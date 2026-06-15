#!/bin/bash
# Docker-only redeploy for VPS
# Usage:
#   cd /var/www/vhosts/bhisha.com/project-1
#   bash redeploy-docker.sh

set -euo pipefail

APP_DIR="/var/www/vhosts/bhisha.com/project-1"
COMPOSE_FILE="docker-compose.prod.yml"

if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

cd "$APP_DIR"

echo "================================"
echo " Docker redeploy started"
echo "================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin is not available"
  exit 1
fi

# Work around known docker compose plugin race/panic on some builds.
export COMPOSE_PARALLEL_LIMIT=1

echo "[1/4] Pulling latest source..."
git pull

echo "[2/4] Building and starting containers (sequential mode)..."
docker compose -f "$COMPOSE_FILE" up -d db
docker compose -f "$COMPOSE_FILE" up -d --build --no-deps backend
docker compose -f "$COMPOSE_FILE" up -d --build --no-deps frontend
docker compose -f "$COMPOSE_FILE" up -d --build --no-deps nginx

echo "[3/4] Container status..."
docker compose -f "$COMPOSE_FILE" ps

echo "[4/4] Health checks..."
curl -fsS http://127.0.0.1/healthz/ >/dev/null && echo "Backend healthz OK" || (echo "Health check failed" && exit 1)

echo "================================"
echo " Docker redeploy complete"
echo "================================"
