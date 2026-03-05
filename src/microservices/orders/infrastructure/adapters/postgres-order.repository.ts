import { Inject, Injectable } from '@nestjs/common';
import {
  BestSellerProductStat,
  OrderRepositoryPort,
} from '../../application/ports/order-repository.port';
import { Order, OrderItem } from '../../domain/order';
import type { Pool } from 'pg';

export const ORDERS_PG_POOL = Symbol('ORDERS_PG_POOL');

interface OrderRow {
  id: string;
  customer_id: string;
  payment_method: 'AUTO' | 'YAPE' | null;
  subtotal_amount: string | number | null;
  total_amount: string | number | null;
  shipping_address_id: string | null;
  shipping_label: string | null;
  shipping_recipient_name: string | null;
  shipping_phone: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_district: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_postal_code: string | null;
  shipping_reference: string | null;
  shipping_cost: string | number | null;
  shipping_currency: string | null;
  shipping_service_level: 'EXPRESS' | 'STANDARD' | null;
  estimated_delivery_days: string | null;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  created_at: Date | string;
}

interface OrderItemRow {
  order_id: string;
  product_id: string;
  quantity: number;
}

interface BestSellerRow {
  product_id: string;
  total_sold: string | number;
}

@Injectable()
export class PostgresOrderRepository implements OrderRepositoryPort {
  constructor(@Inject(ORDERS_PG_POOL) private readonly pool: Pool) {}
  private schemaEnsured = false;

  async save(order: Order): Promise<Order> {
    await this.ensureSchema();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (
          id, customer_id, payment_method, subtotal_amount, total_amount,
          shipping_address_id, shipping_label, shipping_recipient_name,
          shipping_phone, shipping_line1, shipping_line2, shipping_district, shipping_city,
          shipping_region, shipping_postal_code, shipping_reference, shipping_cost,
          shipping_currency, shipping_service_level, estimated_delivery_days, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22
        )`,
        [
          order.id,
          order.customerId,
          order.paymentMethod,
          order.subtotalAmount,
          order.totalAmount,
          order.shippingAddress.addressId,
          order.shippingAddress.label,
          order.shippingAddress.recipientName,
          order.shippingAddress.phone,
          order.shippingAddress.line1,
          order.shippingAddress.line2,
          order.shippingAddress.district,
          order.shippingAddress.city,
          order.shippingAddress.region,
          order.shippingAddress.postalCode,
          order.shippingAddress.reference,
          order.shippingCost,
          order.shippingCurrency,
          order.shippingServiceLevel,
          order.estimatedDeliveryDays,
          order.status,
          order.createdAt,
        ],
      );

      for (const item of order.items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
          [order.id, item.productId, item.quantity],
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    await this.ensureSchema();
    const result = await this.pool.query<OrderRow>(
      `SELECT
         id, customer_id, payment_method, subtotal_amount, total_amount,
         shipping_address_id, shipping_label, shipping_recipient_name,
         shipping_phone, shipping_line1, shipping_line2, shipping_district, shipping_city,
         shipping_region, shipping_postal_code, shipping_reference, shipping_cost,
         shipping_currency, shipping_service_level, estimated_delivery_days, status, created_at
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [orderId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    const itemsResult = await this.pool.query<OrderItemRow>(
      `SELECT order_id, product_id, quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY order_id ASC`,
      [orderId],
    );

    return this.mapOrderRow(
      row,
      itemsResult.rows.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
    );
  }

  async updateStatus(orderId: string, status: Order['status']): Promise<Order> {
    await this.ensureSchema();
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders
       SET status = $2
       WHERE id = $1
       RETURNING
         id, customer_id, payment_method, subtotal_amount, total_amount,
         shipping_address_id, shipping_label, shipping_recipient_name,
         shipping_phone, shipping_line1, shipping_line2, shipping_district, shipping_city,
         shipping_region, shipping_postal_code, shipping_reference, shipping_cost,
         shipping_currency, shipping_service_level, estimated_delivery_days, status, created_at`,
      [orderId, status],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error(`Order not found for id ${orderId}`);
    }

    const itemsResult = await this.pool.query<OrderItemRow>(
      `SELECT order_id, product_id, quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY order_id ASC`,
      [orderId],
    );

    return this.mapOrderRow(
      row,
      itemsResult.rows.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
    );
  }

  async findAll(): Promise<Order[]> {
    return this.fetchOrders();
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.fetchOrders(customerId);
  }

  async findBestSellerProducts(limit: number): Promise<BestSellerProductStat[]> {
    await this.ensureSchema();
    const cappedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;
    const result = await this.pool.query<BestSellerRow>(
      `SELECT oi.product_id, SUM(oi.quantity)::int AS total_sold
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'PAID'
       GROUP BY oi.product_id
       ORDER BY total_sold DESC, oi.product_id ASC
       LIMIT $1`,
      [cappedLimit],
    );

    return result.rows.map((row) => ({
      productId: row.product_id,
      totalSold: Number(row.total_sold),
    }));
  }

  private async fetchOrders(customerId?: string): Promise<Order[]> {
    await this.ensureSchema();
    const ordersResult = customerId
      ? await this.pool.query<OrderRow>(
          `SELECT
             id, customer_id, payment_method, subtotal_amount, total_amount,
             shipping_address_id, shipping_label, shipping_recipient_name,
             shipping_phone, shipping_line1, shipping_line2, shipping_district, shipping_city,
             shipping_region, shipping_postal_code, shipping_reference, shipping_cost,
             shipping_currency, shipping_service_level, estimated_delivery_days, status, created_at
           FROM orders
           WHERE customer_id = $1
           ORDER BY created_at DESC`,
          [customerId],
        )
      : await this.pool.query<OrderRow>(
          `SELECT
             id, customer_id, payment_method, subtotal_amount, total_amount,
             shipping_address_id, shipping_label, shipping_recipient_name,
             shipping_phone, shipping_line1, shipping_line2, shipping_district, shipping_city,
             shipping_region, shipping_postal_code, shipping_reference, shipping_cost,
             shipping_currency, shipping_service_level, estimated_delivery_days, status, created_at
           FROM orders
           ORDER BY created_at DESC`,
        );

    if (ordersResult.rows.length === 0) {
      return [];
    }

    const orderIds = ordersResult.rows.map((row) => row.id);

    const itemsResult = await this.pool.query<OrderItemRow>(
      `SELECT order_id, product_id, quantity
       FROM order_items
       WHERE order_id = ANY($1::text[])
       ORDER BY order_id ASC`,
      [orderIds],
    );

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemsResult.rows) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push({
        productId: item.product_id,
        quantity: item.quantity,
      });
      itemsByOrder.set(item.order_id, list);
    }

    return ordersResult.rows.map((row) =>
      this.mapOrderRow(row, itemsByOrder.get(row.id) ?? []),
    );
  }

  private mapOrderRow(row: OrderRow, items: OrderItem[]): Order {
    return {
      id: row.id,
      customerId: row.customer_id,
      items,
      paymentMethod: row.payment_method ?? 'AUTO',
      subtotalAmount: Number(row.subtotal_amount ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
      shippingAddress: {
        addressId: row.shipping_address_id ?? '',
        label: row.shipping_label ?? '',
        recipientName: row.shipping_recipient_name ?? '',
        phone: row.shipping_phone ?? '',
        line1: row.shipping_line1 ?? '',
        line2: row.shipping_line2,
        district: row.shipping_district ?? '',
        city: row.shipping_city ?? '',
        region: row.shipping_region ?? '',
        postalCode: row.shipping_postal_code,
        reference: row.shipping_reference,
      },
      shippingCost: Number(row.shipping_cost ?? 0),
      shippingCurrency: row.shipping_currency ?? 'USD',
      shippingServiceLevel: row.shipping_service_level ?? 'STANDARD',
      estimatedDeliveryDays: row.estimated_delivery_days ?? '',
      status: row.status,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
    };
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    await this.pool.query(
      `ALTER TABLE orders
       ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'AUTO',
       ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS shipping_address_id TEXT,
       ADD COLUMN IF NOT EXISTS shipping_label TEXT,
       ADD COLUMN IF NOT EXISTS shipping_recipient_name TEXT,
       ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
       ADD COLUMN IF NOT EXISTS shipping_line1 TEXT,
       ADD COLUMN IF NOT EXISTS shipping_line2 TEXT,
       ADD COLUMN IF NOT EXISTS shipping_district TEXT,
       ADD COLUMN IF NOT EXISTS shipping_city TEXT,
       ADD COLUMN IF NOT EXISTS shipping_region TEXT,
       ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
       ADD COLUMN IF NOT EXISTS shipping_reference TEXT,
       ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS shipping_currency CHAR(3) NOT NULL DEFAULT 'USD',
       ADD COLUMN IF NOT EXISTS shipping_service_level TEXT NOT NULL DEFAULT 'STANDARD',
       ADD COLUMN IF NOT EXISTS estimated_delivery_days TEXT NOT NULL DEFAULT ''`,
    );

    this.schemaEnsured = true;
  }
}
