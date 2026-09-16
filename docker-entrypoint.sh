#!/bin/sh
set -e

if [ -z "${AUTH_SECRET}" ]; then
  echo "docker-entrypoint: AUTH_SECRET is not set, falling back to the insecure development secret." >&2
fi

case "${DATABASE_URL}" in
file:*)
  db_file="${DATABASE_URL#file:}"
  mkdir -p "$(dirname "${db_file}")"
  ;;
esac

if [ "${DB_PUSH_ON_START:-true}" = "true" ]; then
  echo "docker-entrypoint: syncing database schema"
  node "${PRISMA_CLI}" db push --schema /app/prisma/schema.prisma --skip-generate
fi

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "docker-entrypoint: seeding the admin account"
  node /app/prisma/seed.js
fi

exec "$@"
