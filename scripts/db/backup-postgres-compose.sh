#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="${2:-docker-compose.production.yml}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

get_env_value() {
  local var_name="$1"
  local line

  line="$(grep -E "^${var_name}=" "$ENV_FILE" | tail -n 1 || true)"

  if [[ -z "$line" ]]; then
    return 1
  fi

  printf '%s' "${line#*=}"
}

PGUSER_VALUE="$(get_env_value PGUSER || true)"
[[ -z "$PGUSER_VALUE" ]] && PGUSER_VALUE="postgres"

mkdir -p "$BACKUP_DIR"

echo "Ensuring postgres is running..."
compose up -d postgres

echo "Waiting for postgres readiness..."
attempt=0
until compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1'; do
  attempt=$((attempt + 1))
  if ((attempt >= 30)); then
    echo "Postgres did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done

databases=(catalog_db inventory_db orders_db payments_db shipping_db auth_db)

for db in "${databases[@]}"; do
  output="$BACKUP_DIR/${db}-${TIMESTAMP}.sql.gz"
  echo "Backing up $db -> $output"
  compose exec -T postgres pg_dump -U "$PGUSER_VALUE" "$db" | gzip > "$output"
done

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && ((RETENTION_DAYS > 0)); then
  echo "Pruning backups older than $RETENTION_DAYS days from $BACKUP_DIR"
  find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
fi

echo "Compose-based backup completed."
