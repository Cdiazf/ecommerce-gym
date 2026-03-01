#!/usr/bin/env bash
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-docker/postgres/migrations}"

command -v psql >/dev/null 2>&1 || {
  echo "psql is required to run migrations" >&2
  exit 1
}

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

echo "Running migrations from $MIGRATIONS_DIR against $PGHOST:$PGPORT as $PGUSER"

PGPASSWORD="$PGPASSWORD" psql \
  -v ON_ERROR_STOP=1 \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d postgres \
  -c "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())" \
  >/dev/null

existing_bootstrap_count="$(
  PGPASSWORD="$PGPASSWORD" psql \
    -tA \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -c "SELECT COUNT(*) FROM pg_database WHERE datname IN ('catalog_db', 'inventory_db', 'orders_db', 'payments_db', 'shipping_db', 'auth_db')"
)"

tracked_count="$(
  PGPASSWORD="$PGPASSWORD" psql \
    -tA \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -c "SELECT COUNT(*) FROM schema_migrations"
)"

if [ "${tracked_count:-0}" = "0" ] && [ "${existing_bootstrap_count:-0}" = "6" ]; then
  echo "Detected existing initialized databases without migration tracking. Bootstrapping migration history."
  PGPASSWORD="$PGPASSWORD" psql \
    -v ON_ERROR_STOP=1 \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -c "INSERT INTO schema_migrations (filename) VALUES ('001_schema.sql'), ('002_seed_baseline.sql') ON CONFLICT (filename) DO NOTHING" \
    >/dev/null
fi

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || continue
  filename="$(basename "$file")"
  already_applied="$(
    PGPASSWORD="$PGPASSWORD" psql \
      -tA \
      -h "$PGHOST" \
      -p "$PGPORT" \
      -U "$PGUSER" \
      -d postgres \
      -c "SELECT 1 FROM schema_migrations WHERE filename = '$filename' LIMIT 1"
  )"

  if [ "$already_applied" = "1" ]; then
    echo "Skipping $filename (already applied)"
    continue
  fi

  echo "Applying $filename"
  PGPASSWORD="$PGPASSWORD" psql \
    -v ON_ERROR_STOP=1 \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -f "$file"

  PGPASSWORD="$PGPASSWORD" psql \
    -v ON_ERROR_STOP=1 \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT (filename) DO NOTHING" \
    >/dev/null
done

echo "Migrations completed"
