import { Inject, Injectable } from '@nestjs/common';
import { ShipmentRepositoryPort } from '../../application/ports/shipment-repository.port';
import { Shipment, ShipmentEvent } from '../../domain/shipment';
import type { Pool, PoolClient } from 'pg';

export const SHIPPING_PG_POOL = Symbol('SHIPPING_PG_POOL');

interface ShipmentRow {
  id: string;
  order_id: string;
  payment_id: string;
  customer_id: string;
  tracking_code: string | null;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  created_at: Date | string;
}

interface ShipmentEventRow {
  shipment_id: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  note: string;
  happened_at: Date | string;
}

@Injectable()
export class PostgresShipmentRepository implements ShipmentRepositoryPort {
  constructor(@Inject(SHIPPING_PG_POOL) private readonly pool: Pool) {}

  private schemaEnsured = false;

  async save(shipment: Shipment): Promise<Shipment> {
    await this.ensureSchema();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const inserted = await client.query<ShipmentRow>(
        `INSERT INTO shipments (id, order_id, payment_id, customer_id, tracking_code, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (payment_id) DO NOTHING
         RETURNING id, order_id, payment_id, customer_id, tracking_code, status, created_at`,
        [
          shipment.id,
          shipment.orderId,
          shipment.paymentId,
          shipment.customerId,
          shipment.trackingCode,
          shipment.status,
          shipment.createdAt,
        ],
      );

      if (inserted.rows.length === 0) {
        await client.query('COMMIT');
        const existing = await this.findByPaymentId(shipment.paymentId);
        if (!existing) {
          throw new Error(
            `Shipment not found after conflict for payment ${shipment.paymentId}`,
          );
        }

        return existing;
      }

      for (const event of shipment.events) {
        await client.query(
          `INSERT INTO shipment_events (shipment_id, status, note, happened_at)
           VALUES ($1, $2, $3, $4)`,
          [shipment.id, event.status, event.note, event.happenedAt],
        );
      }

      await client.query('COMMIT');
      return shipment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<Shipment[]> {
    await this.ensureSchema();
    const result = await this.pool.query<ShipmentRow>(
      `SELECT id, order_id, payment_id, customer_id, tracking_code, status, created_at
       FROM shipments
       ORDER BY created_at DESC`,
    );

    return this.withEvents(result.rows);
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    await this.ensureSchema();
    const result = await this.pool.query<ShipmentRow>(
      `SELECT id, order_id, payment_id, customer_id, tracking_code, status, created_at
       FROM shipments
       WHERE order_id = $1
       LIMIT 1`,
      [orderId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    const shipments = await this.withEvents([row]);
    return shipments[0] ?? null;
  }

  async findByPaymentId(paymentId: string): Promise<Shipment | null> {
    await this.ensureSchema();
    const result = await this.pool.query<ShipmentRow>(
      `SELECT id, order_id, payment_id, customer_id, tracking_code, status, created_at
       FROM shipments
       WHERE payment_id = $1
       LIMIT 1`,
      [paymentId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    const shipments = await this.withEvents([row]);
    return shipments[0] ?? null;
  }

  async updateStatus(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ): Promise<Shipment> {
    await this.ensureSchema();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<ShipmentRow>(
        `UPDATE shipments
         SET status = $2
         WHERE order_id = $1
         RETURNING id, order_id, payment_id, customer_id, tracking_code, status, created_at`,
        [orderId, status],
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error(`Shipment not found for order ${orderId}`);
      }

      await client.query(
        `INSERT INTO shipment_events (shipment_id, status, note, happened_at)
         VALUES ($1, $2, $3, NOW())`,
        [row.id, status, this.getStatusNote(status, note)],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updated = await this.findByOrderId(orderId);
    if (!updated) {
      throw new Error(`Shipment not found for order ${orderId}`);
    }

    return updated;
  }

  private async withEvents(rows: ShipmentRow[]): Promise<Shipment[]> {
    if (rows.length === 0) {
      return [];
    }

    const shipmentIds = rows.map((row) => row.id);
    const eventsResult = await this.pool.query<ShipmentEventRow>(
      `SELECT shipment_id, status, note, happened_at
       FROM shipment_events
       WHERE shipment_id = ANY($1::text[])
       ORDER BY happened_at ASC`,
      [shipmentIds],
    );

    const eventsByShipment = new Map<string, ShipmentEvent[]>();
    for (const row of eventsResult.rows) {
      const list = eventsByShipment.get(row.shipment_id) ?? [];
      list.push({
        status: row.status,
        note: row.note,
        happenedAt:
          row.happened_at instanceof Date
            ? row.happened_at.toISOString()
            : new Date(row.happened_at).toISOString(),
      });
      eventsByShipment.set(row.shipment_id, list);
    }

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      paymentId: row.payment_id,
      customerId: row.customer_id,
      trackingCode: row.tracking_code ?? `TRK-${row.order_id.slice(0, 8).toUpperCase()}`,
      status: row.status,
      events: eventsByShipment.get(row.id) ?? [],
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
    }));
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `ALTER TABLE shipments
         ADD COLUMN IF NOT EXISTS tracking_code TEXT,
         ALTER COLUMN status TYPE TEXT`,
      );
      await client.query(
        `CREATE TABLE IF NOT EXISTS shipment_events (
          id BIGSERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          note TEXT NOT NULL,
          happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      );
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_time
         ON shipment_events (shipment_id, happened_at ASC)`,
      );
      await client.query('COMMIT');
      this.schemaEnsured = true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private getStatusNote(status: Shipment['status'], note?: string): string {
    const trimmedNote = note?.trim();
    if (trimmedNote) {
      return trimmedNote;
    }

    switch (status) {
      case 'IN_TRANSIT':
        return 'Package is on the way to the destination.';
      case 'DELIVERED':
        return 'Package delivered to the customer.';
      case 'FAILED':
        return 'Delivery attempt failed.';
      default:
        return 'Shipment was created.';
    }
  }
}
