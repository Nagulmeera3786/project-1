#!/bin/bash
# =============================================================================
# redeploy.sh — Run this every time you push new code to GitHub
# Usage:
#   cd /srv/mainpanel
#   bash redeploy.sh
# =============================================================================

set -e

APP_DIR="/srv/mainpanel"
VENV="$APP_DIR/backend/venv"

echo ""
echo "================================"
echo " MainPanel — Redeploying update"
echo "================================"

# ── Pull latest code ──────────────────────────────────────────────────────────
echo ""
echo "[1/5] Pulling latest code from GitHub..."
cd $APP_DIR
git pull
echo "Code updated."

# ── Backend update ────────────────────────────────────────────────────────────
echo ""
echo "[2/5] Updating backend..."
cd $APP_DIR/backend
source $VENV/bin/activate
pip install -r requirements.txt --quiet
python manage.py migrate --no-input
python manage.py collectstatic --no-input
deactivate

echo "Backend updated."

# ── Restart gunicorn ──────────────────────────────────────────────────────────
echo ""
echo "[3/5] Restarting backend service..."
sudo systemctl restart mainpanel
sleep 2
systemctl is-active mainpanel && echo "Backend running OK" || (echo "ERROR: Backend failed to start. Check logs: journalctl -u mainpanel -n 30" && exit 1)

# ── Frontend build ────────────────────────────────────────────────────────────
echo ""
echo "[4/5] Rebuilding frontend..."
cd $APP_DIR/frontend
npm install --silent
REACT_APP_USE_SAME_ORIGIN_API=true npm run build

sudo rsync -a --delete $APP_DIR/frontend/build/ /var/www/mainpanel/
sudo chown -R www-data:www-data /var/www/mainpanel
echo "Frontend updated."

# ── Reload Nginx ──────────────────────────────────────────────────────────────
echo ""
echo "[5/5] Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx reloaded."

echo ""
echo "================================"
echo " Redeployment complete!"
echo "================================"
echo ""
echo "Test your site: curl -I https://yourdomain.com"
echo ""
