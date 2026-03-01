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

for file in "$MIGRATIONS_DIR"/*.sql; do
  [[ -e "$file" ]] || continue
  echo "Applying $(basename "$file")"
  compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$PGUSER_VALUE" -d postgres < "$file"
done

echo "Compose-based migrations completed."
