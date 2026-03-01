#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <database_name> <backup_file.sql.gz>" >&2
  exit 1
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
DATABASE_NAME="$1"
BACKUP_FILE="$2"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Restoring $DATABASE_NAME from $BACKUP_FILE"
gzip -dc "$BACKUP_FILE" | PGPASSWORD="$PGPASSWORD" psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DATABASE_NAME"
echo "Restore completed"
