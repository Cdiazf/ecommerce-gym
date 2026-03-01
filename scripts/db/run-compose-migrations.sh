#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="${2:-docker-compose.production.yml}"
MIGRATIONS_DIR="${3:-docker/postgres/migrations}"
MAX_RETRIES="${MAX_RETRIES:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

PGUSER_VALUE="$(grep -E '^PGUSER=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"

if [[ -z "$PGUSER_VALUE" ]]; then
  PGUSER_VALUE="postgres"
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "Ensuring postgres is running..."
compose up -d postgres

echo "Waiting for postgres readiness..."
attempt=0
until compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1'; do
  attempt=$((attempt + 1))

  if ((attempt >= MAX_RETRIES)); then
    echo "Postgres did not become ready in time." >&2
    exit 1
  fi

  sleep "$SLEEP_SECONDS"
done

echo "Running migrations from $MIGRATIONS_DIR using service postgres..."

compose exec -T postgres psql \
  -v ON_ERROR_STOP=1 \
  -U "$PGUSER_VALUE" \
  -d postgres \
  -c "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())" \
  >/dev/null

existing_bootstrap_count="$(
  compose exec -T postgres psql \
    -tA \
    -U "$PGUSER_VALUE" \
    -d postgres \
    -c "SELECT COUNT(*) FROM pg_database WHERE datname IN ('catalog_db', 'inventory_db', 'orders_db', 'payments_db', 'shipping_db', 'auth_db')"
)"

tracked_count="$(
  compose exec -T postgres psql \
    -tA \
    -U "$PGUSER_VALUE" \
    -d postgres \
    -c "SELECT COUNT(*) FROM schema_migrations"
)"

if [[ "${tracked_count:-0}" == "0" && "${existing_bootstrap_count:-0}" == "6" ]]; then
  echo "Detected existing initialized databases without migration tracking. Bootstrapping migration history."
  compose exec -T postgres psql \
    -v ON_ERROR_STOP=1 \
    -U "$PGUSER_VALUE" \
    -d postgres \
    -c "INSERT INTO schema_migrations (filename) VALUES ('001_schema.sql'), ('002_seed_baseline.sql') ON CONFLICT (filename) DO NOTHING" \
    >/dev/null
fi

for file in "$MIGRATIONS_DIR"/*.sql; do
  [[ -e "$file" ]] || continue
  filename="$(basename "$file")"
  already_applied="$(
    compose exec -T postgres psql \
      -tA \
      -U "$PGUSER_VALUE" \
      -d postgres \
      -c "SELECT 1 FROM schema_migrations WHERE filename = '$filename' LIMIT 1"
  )"

  if [[ "$already_applied" == "1" ]]; then
    echo "Skipping $filename (already applied)"
    continue
  fi

  echo "Applying $filename"
  compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$PGUSER_VALUE" -d postgres < "$file"
  compose exec -T postgres psql \
    -v ON_ERROR_STOP=1 \
    -U "$PGUSER_VALUE" \
    -d postgres \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT (filename) DO NOTHING" \
    >/dev/null
done

echo "Compose-based migrations completed."
