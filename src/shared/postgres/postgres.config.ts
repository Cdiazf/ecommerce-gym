import { Pool, type PoolConfig } from 'pg';

interface CreatePostgresPoolOptions {
  dbEnvVar: string;
  defaultDatabase: string;
}

export function createPostgresPool(options: CreatePostgresPoolOptions): Pool {
  const config: PoolConfig = {
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? 'postgres',
    database: process.env[options.dbEnvVar] ?? options.defaultDatabase,
    max: Number(process.env.PGPOOL_MAX ?? 10),
  };

  return new Pool(config);
}
