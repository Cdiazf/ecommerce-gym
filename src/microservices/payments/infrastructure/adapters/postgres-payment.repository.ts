import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../application/ports/payment-repository.port';
import { Payment } from '../../domain/payment';
import type { Pool } from 'pg';

export const PAYMENTS_PG_POOL = Symbol('PAYMENTS_PG_POOL');

interface PaymentRow {
  id: string;
  order_id: string;
  customer_id: string;
  amount: string | number;
  method: 'AUTO' | 'YAPE';
  status: 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED';
  external_reference: string | null;
  operation_code: string | null;
  processed_at: Date | string;
}

@Injectable()
export class PostgresPaymentRepository implements PaymentRepositoryPort {
  constructor(@Inject(PAYMENTS_PG_POOL) private readonly pool: Pool) {}
  private schemaEnsured = false;

  async save(payment: Payment): Promise<Payment> {
    await this.ensureSchema();
    const inserted = await this.pool.query<PaymentRow>(
      `INSERT INTO payments (id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (order_id) DO NOTHING
       RETURNING id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at`,
      [
        payment.id,
        payment.orderId,
        payment.customerId,
        payment.amount,
        payment.method,
        payment.status,
        payment.externalReference,
        payment.operationCode,
        payment.processedAt,
      ],
    );

    if (inserted.rows.length > 0) {
      return this.mapRow(inserted.rows[0]);
    }

    const existing = await this.findByOrderId(payment.orderId);
    if (!existing) {
      throw new Error(
        `Payment not found after conflict for order ${payment.orderId}`,
      );
    }

    return existing;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    await this.ensureSchema();
    const result = await this.pool.query<PaymentRow>(
      `SELECT id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at
       FROM payments
       WHERE order_id = $1
       LIMIT 1`,
      [orderId],
    );

    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async findAll(): Promise<Payment[]> {
    await this.ensureSchema();
    const result = await this.pool.query<PaymentRow>(
      `SELECT id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at
       FROM payments
       ORDER BY processed_at DESC`,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findPendingYapeBefore(cutoffIso: string): Promise<Payment[]> {
    await this.ensureSchema();
    const result = await this.pool.query<PaymentRow>(
      `SELECT id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at
       FROM payments
       WHERE method = 'YAPE'
         AND status = 'PENDING'
         AND processed_at <= $1
       ORDER BY processed_at ASC`,
      [cutoffIso],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async update(payment: Payment): Promise<Payment> {
    await this.ensureSchema();
    const result = await this.pool.query<PaymentRow>(
      `UPDATE payments
       SET method = $2,
           status = $3,
           external_reference = $4,
           operation_code = $5,
           processed_at = $6
       WHERE order_id = $1
       RETURNING id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at`,
      [
        payment.orderId,
        payment.method,
        payment.status,
        payment.externalReference,
        payment.operationCode,
        payment.processedAt,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error(`Payment not found for order ${payment.orderId}`);
    }

    return this.mapRow(row);
  }

  private mapRow(row: PaymentRow): Payment {
    return {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      amount: Number(row.amount),
      method: row.method,
      status: row.status,
      externalReference: row.external_reference,
      operationCode: row.operation_code,
      processedAt:
        row.processed_at instanceof Date
          ? row.processed_at.toISOString()
          : new Date(row.processed_at).toISOString(),
    };
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    await this.pool.query(
      `ALTER TABLE payments
       ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'AUTO',
       ADD COLUMN IF NOT EXISTS external_reference TEXT,
       ADD COLUMN IF NOT EXISTS operation_code TEXT`,
    );

    this.schemaEnsured = true;
  }
}
