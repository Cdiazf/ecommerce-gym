import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { AUTH_PG_POOL } from './auth-user.repository';

interface ShippingAddressRow {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  district: string;
  city: string;
  region: string;
  postal_code: string | null;
  reference: string | null;
  is_default: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  district: string;
  city: string;
  region: string;
  postalCode: string | null;
  reference: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ShippingAddressRepository {
  private schemaEnsured = false;

  constructor(@Inject(AUTH_PG_POOL) private readonly pool: Pool) {}

  async listByUserId(userId: string): Promise<ShippingAddress[]> {
    await this.ensureSchema();
    const result = await this.pool.query<ShippingAddressRow>(
      `SELECT id, user_id, label, recipient_name, phone, line1, line2, district, city, region, postal_code, reference, is_default, created_at, updated_at
       FROM user_shipping_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, updated_at DESC`,
      [userId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findByIdForUser(
    userId: string,
    id: string,
  ): Promise<ShippingAddress | null> {
    await this.ensureSchema();
    const result = await this.pool.query<ShippingAddressRow>(
      `SELECT id, user_id, label, recipient_name, phone, line1, line2, district, city, region, postal_code, reference, is_default, created_at, updated_at
       FROM user_shipping_addresses
       WHERE user_id = $1 AND id = $2
       LIMIT 1`,
      [userId, id],
    );

    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async create(input: {
    id: string;
    userId: string;
    label: string;
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    district: string;
    city: string;
    region: string;
    postalCode?: string | null;
    reference?: string | null;
    isDefault?: boolean;
  }): Promise<ShippingAddress> {
    await this.ensureSchema();

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (input.isDefault) {
        await client.query(
          `UPDATE user_shipping_addresses
           SET is_default = FALSE, updated_at = NOW()
           WHERE user_id = $1 AND is_default = TRUE`,
          [input.userId],
        );
      }

      const result = await client.query<ShippingAddressRow>(
        `INSERT INTO user_shipping_addresses
           (id, user_id, label, recipient_name, phone, line1, line2, district, city, region, postal_code, reference, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING id, user_id, label, recipient_name, phone, line1, line2, district, city, region, postal_code, reference, is_default, created_at, updated_at`,
        [
          input.id,
          input.userId,
          input.label,
          input.recipientName,
          input.phone,
          input.line1,
          input.line2 ?? null,
          input.district,
          input.city,
          input.region,
          input.postalCode ?? null,
          input.reference ?? null,
          input.isDefault ?? false,
        ],
      );

      await client.query('COMMIT');
      return this.mapRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(
    userId: string,
    id: string,
    input: {
      label?: string;
      recipientName?: string;
      phone?: string;
      line1?: string;
      line2?: string | null;
      district?: string;
      city?: string;
      region?: string;
      postalCode?: string | null;
      reference?: string | null;
      isDefault?: boolean;
    },
  ): Promise<ShippingAddress> {
    await this.ensureSchema();

    const existing = await this.findByIdForUser(userId, id);
    if (!existing) {
      throw new NotFoundException(`Shipping address not found: ${id}`);
    }

    const next = {
      ...existing,
      label: input.label ?? existing.label,
      recipientName: input.recipientName ?? existing.recipientName,
      phone: input.phone ?? existing.phone,
      line1: input.line1 ?? existing.line1,
      line2: input.line2 ?? existing.line2,
      district: input.district ?? existing.district,
      city: input.city ?? existing.city,
      region: input.region ?? existing.region,
      postalCode: input.postalCode ?? existing.postalCode,
      reference: input.reference ?? existing.reference,
      isDefault: input.isDefault ?? existing.isDefault,
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (next.isDefault) {
        await client.query(
          `UPDATE user_shipping_addresses
           SET is_default = FALSE, updated_at = NOW()
           WHERE user_id = $1 AND id <> $2 AND is_default = TRUE`,
          [userId, id],
        );
      }

      const result = await client.query<ShippingAddressRow>(
        `UPDATE user_shipping_addresses
         SET label = $3,
             recipient_name = $4,
             phone = $5,
             line1 = $6,
             line2 = $7,
             district = $8,
             city = $9,
             region = $10,
             postal_code = $11,
             reference = $12,
             is_default = $13,
             updated_at = NOW()
         WHERE user_id = $1 AND id = $2
         RETURNING id, user_id, label, recipient_name, phone, line1, line2, district, city, region, postal_code, reference, is_default, created_at, updated_at`,
        [
          userId,
          id,
          next.label,
          next.recipientName,
          next.phone,
          next.line1,
          next.line2,
          next.district,
          next.city,
          next.region,
          next.postalCode,
          next.reference,
          next.isDefault,
        ],
      );

      await client.query('COMMIT');
      return this.mapRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `DELETE FROM user_shipping_addresses
       WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS user_shipping_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        line1 TEXT NOT NULL,
        line2 TEXT,
        district TEXT NOT NULL,
        city TEXT NOT NULL,
        region TEXT NOT NULL,
        postal_code TEXT,
        reference TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );

    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS idx_user_shipping_addresses_user_default
       ON user_shipping_addresses (user_id, is_default DESC, updated_at DESC)`,
    );

    this.schemaEnsured = true;
  }

  private mapRow(row: ShippingAddressRow): ShippingAddress {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      recipientName: row.recipient_name,
      phone: row.phone,
      line1: row.line1,
      line2: row.line2,
      district: row.district,
      city: row.city,
      region: row.region,
      postalCode: row.postal_code,
      reference: row.reference,
      isDefault: row.is_default,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : new Date(row.updated_at).toISOString(),
    };
  }
}
