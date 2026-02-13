#!/usr/bin/env bash
set -Eeuo pipefail

PORT="${PORT:-8080}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
MIGRATION_MAX_RETRIES="${MIGRATION_MAX_RETRIES:-20}"
MIGRATION_RETRY_SECONDS="${MIGRATION_RETRY_SECONDS:-3}"
ALLOW_START_WITHOUT_MIGRATIONS="${ALLOW_START_WITHOUT_MIGRATIONS:-false}"

echo "=== FinPulse Backend Starting ==="
echo "PORT=${PORT}"
echo "RUN_MIGRATIONS=${RUN_MIGRATIONS}"

if [[ "${RUN_MIGRATIONS,,}" == "true" ]]; then
  echo "Running Alembic migrations..."
  attempt=1
  while true; do
    if alembic upgrade head; then
      echo "Alembic migrations complete."
      break
    fi

    if (( attempt >= MIGRATION_MAX_RETRIES )); then
      echo "Alembic migrations failed after ${attempt} attempt(s)."
      if [[ "${ALLOW_START_WITHOUT_MIGRATIONS,,}" == "true" ]]; then
        echo "ALLOW_START_WITHOUT_MIGRATIONS=true, starting API anyway."
        break
      fi
      exit 1
    fi

    echo "Migration attempt ${attempt} failed; retrying in ${MIGRATION_RETRY_SECONDS}s..."
    attempt=$((attempt + 1))
    sleep "${MIGRATION_RETRY_SECONDS}"
  done
else
  echo "Skipping Alembic migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})."
fi

echo "Starting uvicorn on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --log-level info
