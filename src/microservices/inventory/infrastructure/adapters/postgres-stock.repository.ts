import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EnsureStockItemRequest,
  ReserveStockRequest,
  ReserveStockResult,
  StockRepositoryPort,
  UpsertStockItemRequest,
} from '../../application/ports/stock-repository.port';
import { StockItem } from '../../domain/stock-item';
import type { Pool, PoolClient } from 'pg';

export const INVENTORY_PG_POOL = Symbol('INVENTORY_PG_POOL');

type ReservationStatus = 'RESERVED' | 'CONFIRMED' | 'RELEASED';

interface StockRow {
  product_id: string;
  variant_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  status: 'ACTIVE' | 'INACTIVE';
  updated_at: Date;
}

interface ReservationRow {
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  status: ReservationStatus;
}

@Injectable()
export class PostgresStockRepository implements StockRepositoryPort {
  constructor(@Inject(INVENTORY_PG_POOL) private readonly pool: Pool) {}

  async reserve(
    orderId: string,
    items: ReserveStockRequest[],
  ): Promise<ReserveStockResult[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureReservationTable(client);
      const results: ReserveStockResult[] = [];

      for (const item of items) {
        const reserveResult = await this.reserveItem(client, orderId, item);
        results.push(reserveResult);
      }

      const rejected = results.some((result) => !result.reserved);
      if (rejected) {
        await client.query('ROLLBACK');
        return results;
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmReservation(orderId: string): Promise<void> {
    await this.applyReservationTransition(orderId, 'CONFIRMED');
  }

  async releaseReservation(orderId: string): Promise<void> {
    await this.applyReservationTransition(orderId, 'RELEASED');
  }

  async listAll(): Promise<StockItem[]> {
    const result = await this.pool.query<StockRow>(
      `SELECT product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at
       FROM inventory_items
       ORDER BY product_id ASC, variant_id ASC`,
    );

    return result.rows.map((row) => this.toStockItem(row));
  }

  async upsertItem(item: UpsertStockItemRequest): Promise<StockItem> {
    const normalizedVariantId = this.normalizeVariantId(item.variantId);

    const result = await this.pool.query<StockRow>(
      `INSERT INTO inventory_items
         (product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at)
       VALUES ($1, $2, $3, COALESCE((SELECT quantity_reserved FROM inventory_items WHERE product_id = $1 AND variant_id = $2), 0), $4, NOW())
       ON CONFLICT (product_id, variant_id)
       DO UPDATE SET
         quantity_on_hand = EXCLUDED.quantity_on_hand,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at`,
      [
        item.productId,
        normalizedVariantId,
        item.quantityOnHand,
        item.status ?? 'ACTIVE',
      ],
    );

    return this.toStockItem(result.rows[0]);
  }

  async ensureItem(item: EnsureStockItemRequest): Promise<StockItem> {
    const normalizedVariantId = this.normalizeVariantId(item.variantId);

    await this.pool.query(
      `INSERT INTO inventory_items
         (product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at)
       VALUES ($1, $2, 0, 0, $3, NOW())
       ON CONFLICT (product_id, variant_id) DO NOTHING`,
      [item.productId, normalizedVariantId, item.status ?? 'ACTIVE'],
    );

    const result = await this.pool.query<StockRow>(
      `SELECT product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at
       FROM inventory_items
       WHERE product_id = $1 AND variant_id = $2`,
      [item.productId, normalizedVariantId],
    );

    return this.toStockItem(result.rows[0]);
  }

  async deleteItem(productId: string, variantId?: string | null): Promise<StockItem> {
    const normalizedVariantId = this.normalizeVariantId(variantId);

    const result = await this.pool.query<StockRow>(
      `DELETE FROM inventory_items
       WHERE product_id = $1 AND variant_id = $2
       RETURNING product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at`,
      [productId, normalizedVariantId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(
        `Stock item not found for product ${productId} and variant ${variantId ?? ''}`,
      );
    }

    return this.toStockItem(row);
  }

  private async reserveItem(
    client: PoolClient,
    orderId: string,
    item: ReserveStockRequest,
  ): Promise<ReserveStockResult> {
    const normalizedVariantId = this.normalizeVariantId(item.variantId);

    const currentResult = await client.query<StockRow>(
      `SELECT product_id, variant_id, quantity_on_hand, quantity_reserved, status, updated_at
       FROM inventory_items
       WHERE product_id = $1 AND variant_id = $2
       FOR UPDATE`,
      [item.productId, normalizedVariantId],
    );

    const row = currentResult.rows[0];

    if (!row || row.status !== 'ACTIVE') {
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: false,
        remaining: 0,
        isAvailable: false,
      };
    }

    const available = row.quantity_on_hand - row.quantity_reserved;
    const canReserve = available >= item.quantity;

    if (canReserve) {
      await client.query(
        `UPDATE inventory_items
         SET quantity_reserved = quantity_reserved + $1,
             updated_at = NOW()
         WHERE product_id = $2 AND variant_id = $3`,
        [item.quantity, item.productId, normalizedVariantId],
      );

      await client.query(
        `INSERT INTO inventory_reservations
          (order_id, product_id, variant_id, quantity, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'RESERVED', NOW(), NOW())`,
        [orderId, item.productId, normalizedVariantId, item.quantity],
      );

      await client.query(
        `INSERT INTO stock_movements
          (product_id, variant_id, movement_type, quantity, note, created_at)
         VALUES ($1, $2, 'RESERVE', $3, $4, NOW())`,
        [
          item.productId,
          normalizedVariantId,
          item.quantity,
          `Reserved for order ${orderId}`,
        ],
      );
    }

    const remaining = canReserve ? available - item.quantity : available;

    return {
      productId: item.productId,
      variantId: item.variantId ?? null,
      reserved: canReserve,
      remaining,
      isAvailable: remaining > 0,
    };
  }

  private async applyReservationTransition(
    orderId: string,
    targetStatus: 'CONFIRMED' | 'RELEASED',
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureReservationTable(client);

      const reservationsResult = await client.query<ReservationRow>(
        `SELECT order_id, product_id, variant_id, quantity, status
         FROM inventory_reservations
         WHERE order_id = $1 AND status = 'RESERVED'
         ORDER BY product_id ASC, variant_id ASC
         FOR UPDATE`,
        [orderId],
      );

      if (reservationsResult.rows.length === 0) {
        await client.query('COMMIT');
        return;
      }

      for (const reservation of reservationsResult.rows) {
        if (targetStatus === 'CONFIRMED') {
          await client.query(
            `UPDATE inventory_items
             SET quantity_on_hand = quantity_on_hand - $1,
                 quantity_reserved = quantity_reserved - $1,
                 updated_at = NOW()
             WHERE product_id = $2 AND variant_id = $3`,
            [reservation.quantity, reservation.product_id, reservation.variant_id],
          );
        } else {
          await client.query(
            `UPDATE inventory_items
             SET quantity_reserved = quantity_reserved - $1,
                 updated_at = NOW()
             WHERE product_id = $2 AND variant_id = $3`,
            [reservation.quantity, reservation.product_id, reservation.variant_id],
          );
        }

        await client.query(
          `UPDATE inventory_reservations
           SET status = $2,
               updated_at = NOW()
           WHERE order_id = $1 AND product_id = $3 AND variant_id = $4 AND status = 'RESERVED'`,
          [orderId, targetStatus, reservation.product_id, reservation.variant_id],
        );

        await client.query(
          `INSERT INTO stock_movements
            (product_id, variant_id, movement_type, quantity, note, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            reservation.product_id,
            reservation.variant_id,
            targetStatus === 'CONFIRMED' ? 'COMMIT' : 'RELEASE',
            reservation.quantity,
            `${targetStatus} reservation for order ${orderId}`,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureReservationTable(client: PoolClient): Promise<void> {
    await client.query(
      `CREATE TABLE IF NOT EXISTS inventory_reservations (
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        status TEXT NOT NULL CHECK (status IN ('RESERVED', 'CONFIRMED', 'RELEASED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (order_id, product_id, variant_id)
      )`,
    );
  }

  private normalizeVariantId(variantId?: string | null): string {
    return variantId ?? '';
  }

  private toStockItem(row: StockRow): StockItem {
    const quantityAvailable = row.quantity_on_hand - row.quantity_reserved;

    return {
      productId: row.product_id,
      variantId: row.variant_id === '' ? null : row.variant_id,
      quantityOnHand: row.quantity_on_hand,
      quantityReserved: row.quantity_reserved,
      quantityAvailable,
      status: row.status,
      isAvailable: row.status === 'ACTIVE' && quantityAvailable > 0,
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
