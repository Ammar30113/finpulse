#!/bin/bash
set -e

echo "=== FinPulse Backend Starting ==="
echo "PORT=${PORT:-8000}"
echo "Running Alembic migrations..."
alembic upgrade head
echo "Alembic migrations complete."

echo "Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
