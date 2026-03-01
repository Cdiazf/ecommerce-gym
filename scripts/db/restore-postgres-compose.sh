#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -lt 2 || "$#" -gt 4 ]]; then
  echo "Usage: $0 <database_name> <backup_file.sql.gz> [env_file] [compose_file]" >&2
  exit 1
fi

DATABASE_NAME="$1"
BACKUP_FILE="$2"
ENV_FILE="${3:-.env.production}"
COMPOSE_FILE="${4:-docker-compose.production.yml}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

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

echo "Ensuring postgres is running..."
compose up -d postgres

echo "Restoring $DATABASE_NAME from $BACKUP_FILE"
gzip -dc "$BACKUP_FILE" | compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$PGUSER_VALUE" -d "$DATABASE_NAME"
echo "Compose-based restore completed."
