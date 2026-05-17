# Plesk Deployment - Quick Commands Reference

## Local Preparation (Run on Your Computer)

```bash
# 1. Build React frontend for production
cd frontend
npm install
npm run build
cd ..

# 2. Test Django backend locally
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
cd ..

# 3. Verify everything works at http://localhost:8000/admin/
# Then CTRL+C to stop the server
```

## Upload to Plesk (Choose One Method)

### Method 1: Plesk File Manager (Web UI)
1. Log into Plesk → Files → File Manager
2. Navigate to your domain's `public_html/`
3. Upload `frontend/build/` contents to root
4. Upload `backend/` folder

### Method 2: SCP/SFTP (Recommended)
```bash
# Replace values with your actual Plesk server details
scp -r frontend/build/* user@yourserver.com:/path/to/public_html/
scp -r backend/ user@yourserver.com:/path/to/backend/

# Or use SFTP client (WinSCP, FileZilla, etc.)
```

### Method 3: Git Clone
```bash
# On Plesk server via SSH:
cd /path/to/public_html
git clone https://github.com/yourusername/yourproject.git .
# Then move backend and frontend appropriately
```

---

## Server Setup (Run on Plesk Server via SSH)

```bash
# 1. Connect to Plesk server
ssh user@yourserver.com

# 2. Navigate to backend directory
cd /path/to/backend

# 3. Create Python virtual environment
python3 -m venv venv

# 4. Activate virtual environment
source venv/bin/activate

# 5. Install Python dependencies
pip install -r requirements.txt

# 6. Create .env file (IMPORTANT!)
# Use nano or your favorite editor
nano .env

# Paste this content and replace YOUR VALUES:
```

### .env File Content Template
```
DEBUG=False
SECRET_KEY=your-super-long-random-key-here-50-chars-minimum
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Press `CTRL+X`, then `Y`, then `Enter` to save.

```bash
# 7. Set file permissions (security)
chmod 600 .env
chmod 755 ../

# 8. Run database migrations
python manage.py migrate

# 9. Create superuser for admin panel
python manage.py createsuperuser

# 10. Collect static files
python manage.py collectstatic --noinput

# 11. Generate SECRET_KEY if you don't have one
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# Copy the output and update .env file
```

---

## Start Django Application Server

### Using Gunicorn (Recommended)
```bash
# Start Gunicorn
source venv/bin/activate
cd /path/to/backend
gunicorn -c gunicorn.conf.py project.wsgi:application

# Run in background with nohup
nohup gunicorn -c gunicorn.conf.py project.wsgi:application > /tmp/gunicorn.log 2>&1 &
```

### Using Waitress (Alternative)
```bash
source venv/bin/activate
cd /path/to/backend
waitress-serve --port=8000 project.wsgi:application
```

### As Systemd Service (Auto-restart on reboot)
```bash
# Create service file
sudo nano /etc/systemd/system/django-abc.service
```

Paste this content:
```ini
[Unit]
Description=Django ABC Application
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/gunicorn project.wsgi:application --bind 127.0.0.1:8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Save and run:
```bash
sudo systemctl daemon-reload
sudo systemctl start django-abc
sudo systemctl enable django-abc
sudo systemctl status django-abc
```

---

## Verify Setup

```bash
# 1. Check Django is running
curl http://127.0.0.1:8000/admin/

# 2. Check in web browser
# Visit: https://yourdomain.com
# Visit: https://yourdomain.com/admin/
# Visit: https://yourdomain.com/api/

# 3. Check logs
tail -f /tmp/gunicorn.log              # If using gunicorn
journalctl -u django-abc -f            # If using systemd
```

---

## Troubleshooting Commands

```bash
# Check Django configuration
python manage.py check

# Check for deployment issues
python manage.py check --deploy

# View all migrations
python manage.py showmigrations

# Run specific migration
python manage.py migrate accounts 0001

# Test PostgreSQL connectivity from Django config
python manage.py dbshell -c '\\conninfo'

# Clear cache
python manage.py clear_cache

# Restart Django (if using systemd)
sudo systemctl restart django-abc

# View recent logs
sudo journalctl -u django-abc -n 50

# Check if Gunicorn is running
ps aux | grep gunicorn

# Kill Gunicorn process
pkill -f gunicorn

# Check port 8000 is listening
netstat -tulpn | grep 8000
lsof -i :8000
```

---

## Update & Maintenance Commands

```bash
# Activate virtual environment
source venv/bin/activate

# Update Python packages
pip install --upgrade -r requirements.txt

# Create PostgreSQL backup before updates
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Apply migrations after updates
python manage.py migrate

# Collect static files after updates
python manage.py collectstatic --noinput

# Restart application
sudo systemctl restart django-abc

# Deactivate virtual environment
deactivate
```

---

## File Permission Commands

```bash
# Make .env readable only by owner (security)
chmod 600 /path/to/backend/.env

# Make staticfiles directory accessible
chmod 755 /path/to/backend/staticfiles

# Make entire backend directory accessible to www-data
sudo chown -R www-data:www-data /path/to/backend
```

---

## Backup & Recovery

```bash
# Backup database
pg_dump "$DATABASE_URL" > /path/to/backend/backup_$(date +%Y%m%d).sql

# Backup static files
tar -czf staticfiles-backup.tar.gz /path/to/backend/staticfiles/

# Backup .env (KEEP SECURE)
cp /path/to/backend/.env /path/to/backend/.env.backup
chmod 600 /path/to/backend/.env.backup

# Restore database
psql "$DATABASE_URL" < /path/to/backend/backup_20260507.sql

# Restore static files
tar -xzf staticfiles-backup.tar.gz -C /path/to/backend/
```

---

## SSL/HTTPS Setup (Plesk Web UI)

```
In Plesk Control Panel:
1. Go to Your Domain → SSL/TLS Certificates
2. Click "Get a Certificate"
3. Select "Let's Encrypt" (free)
4. Check all domain variants:
   ☑ yourdomain.com
   ☑ www.yourdomain.com
5. Click "Install"
6. Enable "Permanent SEO-safe redirect from HTTP to HTTPS"
```

Via Command Line (if needed):
```bash
# Install Certbot (if not already installed)
sudo apt-get install certbot

# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Quick Testing Script

Save this as `test-deployment.sh` and run `bash test-deployment.sh`:

```bash
#!/bin/bash

echo "Testing Plesk Deployment..."
echo ""

# Test frontend
echo "1. Testing Frontend..."
curl -I https://yourdomain.com/ | head -n1

# Test API
echo "2. Testing API..."
curl -I https://yourdomain.com/api/ | head -n1

# Test Admin
echo "3. Testing Admin..."
curl -I https://yourdomain.com/admin/ | head -n1

# Test Static Files
echo "4. Testing Static Files..."
curl -I https://yourdomain.com/static/admin/css/ | head -n1

echo ""
echo "Testing complete!"
```

---

## Emergency Commands

```bash
# Stop everything
sudo systemctl stop django-abc
sudo systemctl stop nginx      # or: systemctl stop apache2
sudo systemctl stop mysql      # if using database

# Start everything
sudo systemctl start django-abc
sudo systemctl start nginx     # or: systemctl start apache2
sudo systemctl start mysql

# Restart everything
sudo systemctl restart django-abc nginx mysql

# Check all services status
sudo systemctl status django-abc
sudo systemctl status nginx
sudo systemctl status mysql

# View system logs
tail -n 100 /var/log/syslog

# Free up disk space
sudo apt-get clean
sudo apt-get autoclean
```

---

## Environment Variables Reference

| Variable | Example Value |
|----------|---------------|
| `DEBUG` | `False` |
| `SECRET_KEY` | `mk@a*87yx!-9@3h(y+5x-mz9vz+1^@v@e$-q9@+zl5#1-0kl9` |
| `ALLOWED_HOSTS` | `yourdomain.com,www.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |
| `DB_PASSWORD` | `secure-password-here` |
| `EMAIL_HOST_PASSWORD` | `email-password-here` |

---

## Support & Logs

**Check Error Logs:**
```bash
# Gunicorn logs
tail -f /tmp/gunicorn.log

# Nginx/Apache logs (depending on web server)
tail -f /var/log/nginx/error.log       # Nginx
tail -f /var/log/apache2/error.log     # Apache

# Plesk logs
tail -f /var/log/plesk/panel.log

# Django application logs
sudo journalctl -u django-abc -f
```

**Plesk Web UI Logs:**
- Plesk Dashboard → Logs → Error & Access Logs

---

**Quick Reference:** Save this file for easy access!  
**Version:** 1.0  
**Updated:** May 7, 2026
