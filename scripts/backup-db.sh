#!/bin/bash
# Manual database backup -- run this yourself whenever you want (daily,
# weekly, whatever), separate from the GitHub Actions workflow. Always
# writes to the SAME filename, so each run overwrites the last one --
# exactly one backup file exists at a time, not a growing pile of them.
#
# Usage:
#   ./scripts/backup-db.sh
#
# Requires: pg_dump (already installed locally -- part of the Postgres
# client tools) and a .env file with DATABASE_URI set, same as the rest
# of this project.

set -e

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env file found in the project root. Aborting." >&2
  exit 1
fi

DATABASE_URI=$(grep "^DATABASE_URI=" .env | cut -d= -f2-)
if [ -z "$DATABASE_URI" ]; then
  echo "DATABASE_URI not found in .env. Aborting." >&2
  exit 1
fi

mkdir -p backups
OUT_FILE="backups/primegen-backup.sql"

# pg_dump can't dump a server newer than itself -- the Neon database runs
# Postgres 18, so this needs the versioned postgresql@18 keg specifically
# (installed via `brew install postgresql@18`), not whatever `pg_dump`
# resolves to on PATH (which may be an older default install like 14).
PG_DUMP="/opt/homebrew/opt/postgresql@18/bin/pg_dump"
if [ ! -x "$PG_DUMP" ]; then
  echo "postgresql@18 not found at $PG_DUMP -- run: brew install postgresql@18" >&2
  exit 1
fi

echo "Backing up database to $OUT_FILE ..."
"$PG_DUMP" "$DATABASE_URI" --no-owner --no-privileges -f "$OUT_FILE"

SIZE=$(du -h "$OUT_FILE" | cut -f1)
echo "Done. $OUT_FILE ($SIZE) -- $(date '+%Y-%m-%d %H:%M:%S')"
