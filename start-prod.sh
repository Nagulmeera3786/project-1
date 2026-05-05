#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Production startup with Gunicorn
# Usage:  bash start-prod.sh [BIND_IP] [PORT]
# Example: bash start-prod.sh 0.0.0.0 8000
# ─────────────────────────────────────────────────────────────

BIND_IP=${1:-0.0.0.0}
PORT=${2:-8000}
WORKERS=${3:-3}   # rule of thumb: (2 * CPU cores) + 1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/backend"

# Activate virtual environment if present
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

echo ">>> Running migrations ..."
python3 manage.py migrate --noinput

echo ">>> Collecting static files ..."
python3 manage.py collectstatic --noinput

echo ">>> Starting Gunicorn on $BIND_IP:$PORT with $WORKERS workers ..."
exec gunicorn project.wsgi:application \
    --bind "$BIND_IP:$PORT" \
    --workers $WORKERS \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
