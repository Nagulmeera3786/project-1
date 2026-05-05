#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Development startup script
# Usage:  bash start-dev.sh [PORT]        (default port = 8000)
# Opens backend on  http://0.0.0.0:PORT
# Opens frontend on http://0.0.0.0:3000
# ─────────────────────────────────────────────────────────────

BACKEND_PORT=${1:-8000}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ──────────────────────────────────────────────────
echo ">>> Starting Django dev server on port $BACKEND_PORT ..."
cd "$SCRIPT_DIR/backend"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

python3 manage.py migrate --run-syncdb 2>/dev/null || true
python3 manage.py runserver 0.0.0.0:$BACKEND_PORT &
BACKEND_PID=$!
echo "    Backend PID: $BACKEND_PID  →  http://0.0.0.0:$BACKEND_PORT"

# ── Frontend ─────────────────────────────────────────────────
echo ">>> Starting React dev server on port 3000 ..."
cd "$SCRIPT_DIR/frontend"
npm run start:lan &
FRONTEND_PID=$!
echo "    Frontend PID: $FRONTEND_PID  →  http://0.0.0.0:3000"

echo ""
echo ">>> Both servers are running."
echo "    Backend  : http://$(hostname -I | awk '{print $1}'):$BACKEND_PORT"
echo "    Frontend : http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "    Press Ctrl+C to stop both."

# Wait and stop both on Ctrl+C
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
