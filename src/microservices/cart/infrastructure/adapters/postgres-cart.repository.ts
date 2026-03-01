import { Inject, Injectable } from '@nestjs/common';
import { Cart, CartItem } from '../../domain/cart';
import { CartRepositoryPort } from '../../application/ports/cart-repository.port';
import type { Pool } from 'pg';

export const CART_PG_POOL = Symbol('CART_PG_POOL');

interface CartItemRow {
  customer_id: string;
  product_id: string;
  quantity: number;
  updated_at: Date | string;
}

@Injectable()
export class PostgresCartRepository implements CartRepositoryPort {
  constructor(@Inject(CART_PG_POOL) private readonly pool: Pool) {}

  private schemaEnsured = false;

  async getByCustomerId(customerId: string): Promise<Cart> {
    await this.ensureSchema();

    const result = await this.pool.query<CartItemRow>(
      `SELECT customer_id, product_id, quantity, updated_at
       FROM cart_items
       WHERE customer_id = $1
       ORDER BY updated_at DESC`,
      [customerId],
    );

    return {
      customerId,
      items: result.rows.map((row) => this.toCartItem(row)),
    };
  }

  async upsertItem(input: {
    customerId: string;
    productId: string;
    quantity: number;
  }): Promise<CartItem> {
    await this.ensureSchema();

    const result = await this.pool.query<CartItemRow>(
      `INSERT INTO cart_items (customer_id, product_id, quantity, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (customer_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
       RETURNING customer_id, product_id, quantity, updated_at`,
      [input.customerId, input.productId, input.quantity],
    );

    return this.toCartItem(result.rows[0]);
  }

  async removeItem(customerId: string, productId: string): Promise<void> {
    await this.ensureSchema();

    await this.pool.query(
      `DELETE FROM cart_items
       WHERE customer_id = $1 AND product_id = $2`,
      [customerId, productId],
    );
  }

  async clearCart(customerId: string): Promise<void> {
    await this.ensureSchema();

    await this.pool.query(
      `DELETE FROM cart_items
       WHERE customer_id = $1`,
      [customerId],
    );
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS cart_items (
        customer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (customer_id, product_id)
      )`,
    );

    this.schemaEnsured = true;
  }

  private toCartItem(row: CartItemRow): CartItem {
    return {
      productId: row.product_id,
      quantity: row.quantity,
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : new Date(row.updated_at).toISOString(),
    };
  }
}
