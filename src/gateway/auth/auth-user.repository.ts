import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import type { UserRole } from './auth.types';

export const AUTH_PG_POOL = Symbol('AUTH_PG_POOL');

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserView {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AuthUserRepository {
  constructor(@Inject(AUTH_PG_POOL) private readonly pool: Pool) {}

  async findByUsername(username: string): Promise<StoredUser | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, password_hash, role, created_at, updated_at
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [username],
    );

    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async createUser(input: {
    id: string;
    username: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<StoredUser> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, username, password_hash, role, created_at, updated_at`,
      [input.id, input.username, input.passwordHash, input.role],
    );

    return this.mapRow(result.rows[0]);
  }

  async ensureUser(input: {
    id: string;
    username: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<StoredUser> {
    const existing = await this.findByUsername(input.username);
    if (existing) {
      return existing;
    }

    return this.createUser(input);
  }

  async listUsers(): Promise<UserView[]> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, username, password_hash, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => this.mapToView(this.mapRow(row)));
  }

  private mapRow(row: UserRow): StoredUser {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role,
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

  private mapToView(user: StoredUser): UserView {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
