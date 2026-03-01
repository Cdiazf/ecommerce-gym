#!/usr/bin/env bash
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

databases=(catalog_db inventory_db orders_db payments_db shipping_db auth_db)

for db in "${databases[@]}"; do
  output="$BACKUP_DIR/${db}-${TIMESTAMP}.sql.gz"
  echo "Backing up $db -> $output"
  PGPASSWORD="$PGPASSWORD" pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$db" | gzip > "$output"
done

echo "Backup completed"
