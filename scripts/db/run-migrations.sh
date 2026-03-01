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

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || continue
  echo "Applying $(basename "$file")"
  PGPASSWORD="$PGPASSWORD" psql \
    -v ON_ERROR_STOP=1 \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -f "$file"
done

echo "Migrations completed"
