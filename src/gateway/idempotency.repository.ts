import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

export const IDEMPOTENCY_PG_POOL = Symbol('IDEMPOTENCY_PG_POOL');

type IdempotencyStatus = 'PROCESSING' | 'COMPLETED';

interface IdempotencyRow {
  idempotency_key: string;
  route_scope: string;
  user_scope: string;
  request_hash: string;
  status: IdempotencyStatus;
  response_json: unknown | null;
}

@Injectable()
export class IdempotencyRepository {
  constructor(@Inject(IDEMPOTENCY_PG_POOL) private readonly pool: Pool) {}

  private schemaEnsured = false;

  async claim(
    idempotencyKey: string,
    routeScope: string,
    userScope: string,
    requestHash: string,
  ): Promise<
    | { state: 'claimed' }
    | { state: 'completed'; response: unknown | null }
    | { state: 'processing' }
    | { state: 'hash_mismatch' }
  > {
    await this.ensureSchema();

    const inserted = await this.pool.query<IdempotencyRow>(
      `INSERT INTO gateway_idempotency_keys (
         idempotency_key,
         route_scope,
         user_scope,
         request_hash,
         status,
         response_json,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, 'PROCESSING', NULL, NOW(), NOW())
       ON CONFLICT (idempotency_key, route_scope, user_scope) DO NOTHING
       RETURNING idempotency_key`,
      [idempotencyKey, routeScope, userScope, requestHash],
    );

    if (inserted.rows.length > 0) {
      return { state: 'claimed' };
    }

    const existing = await this.pool.query<IdempotencyRow>(
      `SELECT idempotency_key, route_scope, user_scope, request_hash, status, response_json
       FROM gateway_idempotency_keys
       WHERE idempotency_key = $1
         AND route_scope = $2
         AND user_scope = $3
       LIMIT 1`,
      [idempotencyKey, routeScope, userScope],
    );

    const row = existing.rows[0];

    if (!row) {
      return { state: 'claimed' };
    }

    if (row.request_hash !== requestHash) {
      return { state: 'hash_mismatch' };
    }

    if (row.status === 'COMPLETED') {
      return { state: 'completed', response: row.response_json };
    }

    return { state: 'processing' };
  }

  async complete(
    idempotencyKey: string,
    routeScope: string,
    userScope: string,
    response: unknown,
  ): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `UPDATE gateway_idempotency_keys
       SET status = 'COMPLETED',
           response_json = $4::jsonb,
           updated_at = NOW()
       WHERE idempotency_key = $1
         AND route_scope = $2
         AND user_scope = $3`,
      [idempotencyKey, routeScope, userScope, JSON.stringify(response)],
    );
  }

  async release(
    idempotencyKey: string,
    routeScope: string,
    userScope: string,
  ): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `DELETE FROM gateway_idempotency_keys
       WHERE idempotency_key = $1
         AND route_scope = $2
         AND user_scope = $3
         AND status = 'PROCESSING'`,
      [idempotencyKey, routeScope, userScope],
    );
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured) {
      return;
    }

    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS gateway_idempotency_keys (
         idempotency_key TEXT NOT NULL,
         route_scope TEXT NOT NULL,
         user_scope TEXT NOT NULL,
         request_hash TEXT NOT NULL,
         status TEXT NOT NULL,
         response_json JSONB,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         PRIMARY KEY (idempotency_key, route_scope, user_scope)
       )`,
    );

    this.schemaEnsured = true;
  }
}
