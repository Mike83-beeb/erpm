#!/bin/sh
set -e

echo "Starting Scace application container..."

if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma database migrations (migrate deploy)..."
  ./packages/db/node_modules/.bin/prisma migrate deploy --config packages/db/prisma.config.ts || {
    echo "ERROR: Database migration failed."
    exit 1
  }
  echo "Database migrations completed successfully."
else
  echo "WARNING: DATABASE_URL is not set. Skipping database migrations."
fi

echo "Starting API server..."
exec "$@"
