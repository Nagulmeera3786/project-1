#!/bin/bash
# =============================================================================
# deploy.sh — First-time full setup for Linux VPS
# Run this ONCE on a fresh Ubuntu 22.04/24.04 server as the deploy user.
#
# Usage:
#   chmod +x deploy.sh
#   sudo bash deploy.sh
# =============================================================================

set -e  # Stop on any error

APP_DIR="/srv/mainpanel"
REPO_URL=""          # Filled automatically — see STEP 0 below
DOMAIN=""            # You will be asked to enter this
VENV="$APP_DIR/backend/venv"

echo ""
echo "=============================="
echo " MainPanel Linux Deployment"
echo "=============================="
echo ""

# ── STEP 0: Ask for inputs ────────────────────────────────────────────────────
read -p "Enter your GitHub repo URL (e.g. https://github.com/user/repo): " REPO_URL
read -p "Enter your domain name (e.g. mysite.com — without www): " DOMAIN
read -p "Enter your Linux VPS public IP: " VPS_IP

echo ""
echo "Domain  : $DOMAIN"
echo "VPS IP  : $VPS_IP"
echo "Repo    : $REPO_URL"
echo ""
read -p "Correct? Press Enter to continue or Ctrl+C to cancel..."

# ── STEP 1: Update system + install packages ─────────────────────────────────
echo ""
echo "[1/10] Updating system and installing packages..."
apt update -y
apt upgrade -y
apt install -y nginx python3-pip python3-venv git certbot python3-certbot-nginx ufw fail2ban curl

# ── STEP 2: Install Node 20 ──────────────────────────────────────────────────
echo ""
echo "[2/10] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# ── STEP 3: Firewall ─────────────────────────────────────────────────────────
echo ""
echo "[3/10] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# ── STEP 4: Create deploy user (skip if already exists) ──────────────────────
echo ""
echo "[4/10] Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart mainpanel, /usr/bin/systemctl reload nginx, /usr/bin/rsync" >> /etc/sudoers.d/deploy
fi

# ── STEP 5: Clone project ────────────────────────────────────────────────────
echo ""
echo "[5/10] Cloning project from GitHub..."
mkdir -p $APP_DIR
chown -R deploy:deploy /srv/mainpanel

if [ -d "$APP_DIR/.git" ]; then
    echo "Repo already cloned. Pulling latest..."
    cd $APP_DIR && git pull
else
    git clone "$REPO_URL" "$APP_DIR"
fi

chown -R deploy:deploy $APP_DIR

# ── STEP 6: Backend setup ────────────────────────────────────────────────────
echo ""
echo "[6/10] Setting up Python backend..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo ""
    echo "----------------------------------------------"
    echo " Creating backend .env — enter your values now"
    echo "----------------------------------------------"
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
    cat > $APP_DIR/backend/.env << ENVEOF
SECRET_KEY=$SECRET
DEBUG=False
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,$VPS_IP
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
CSRF_TRUSTED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
ALLOW_SQLITE_IN_PRODUCTION=True

# Email settings — fill in your Gmail or IONOS credentials
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-16-char-app-password
# EMAIL_FROM=your-email@gmail.com

# SMS settings
# SMS_PROVIDER_USER=YOUR_PROFILE_ID
# SMS_PROVIDER_PASSWORD=YOUR_PASSWORD
# SMS_DEFAULT_SENDER_IDS=SENDERID
ENVEOF
    echo ".env created at $APP_DIR/backend/.env"
    echo "Edit it later to add email/SMS credentials: nano $APP_DIR/backend/.env"
fi

# Run migrations and collectstatic
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# ── STEP 7: Frontend build ───────────────────────────────────────────────────
echo ""
echo "[7/10] Building React frontend..."
cd $APP_DIR/frontend
npm install
REACT_APP_USE_SAME_ORIGIN_API=true npm run build

# Copy build to web root
mkdir -p /var/www/mainpanel
rsync -a --delete $APP_DIR/frontend/build/ /var/www/mainpanel/
chown -R www-data:www-data /var/www/mainpanel

# ── STEP 8: Gunicorn systemd service ─────────────────────────────────────────
echo ""
echo "[8/10] Creating Gunicorn systemd service..."
cat > /etc/systemd/system/mainpanel.service << SERVICEEOF
[Unit]
Description=MainPanel Gunicorn WSGI Server
After=network.target

[Service]
User=deploy
Group=www-data
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$VENV/bin/gunicorn \\
          --workers 3 \\
          --bind unix:/run/mainpanel.sock \\
          --timeout 120 \\
          project.wsgi:application
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable mainpanel
systemctl start mainpanel
systemctl status mainpanel --no-pager

# ── STEP 9: Nginx config ─────────────────────────────────────────────────────
echo ""
echo "[9/10] Configuring Nginx..."
cat > /etc/nginx/sites-available/mainpanel << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/mainpanel;
    index index.html;

    location /api/ {
        proxy_pass http://unix:/run/mainpanel.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    location /admin/ {
        proxy_pass http://unix:/run/mainpanel.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /s/ {
        proxy_pass http://unix:/run/mainpanel.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        proxy_pass http://unix:/run/mainpanel.sock;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /healthz/ {
        proxy_pass http://unix:/run/mainpanel.sock;
        proxy_set_header Host \$host;
    }

    location / {
        try_files \$uri /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
NGINXEOF

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

ln -sf /etc/nginx/sites-available/mainpanel /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# ── STEP 10: SSL certificate ─────────────────────────────────────────────────
echo ""
echo "[10/10] Obtaining SSL certificate..."
echo "NOTE: DNS must already point $DOMAIN to this server IP ($VPS_IP)"
read -p "Is DNS ready? Press Enter to get certificate, or Ctrl+C to skip and do it later..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect -m admin@$DOMAIN

echo ""
echo "=============================="
echo " Deployment Complete!"
echo "=============================="
echo ""
echo "Your app is live at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  Check backend status : sudo systemctl status mainpanel"
echo "  Check nginx status   : sudo systemctl status nginx"
echo "  View backend logs    : sudo journalctl -u mainpanel -f"
echo "  Edit env variables   : nano $APP_DIR/backend/.env"
echo "  Update app           : bash $APP_DIR/redeploy.sh"
echo ""
