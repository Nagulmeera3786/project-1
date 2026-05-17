# Plesk Deployment Guide for Django + React Application

This guide covers deploying your Django backend and React frontend to Plesk hosting.

## Prerequisites
- Plesk hosting account with Python and Node.js support enabled
- SSH or terminal access to your server
- Your domain pointing to the Plesk server

## Architecture Overview
```
Your Domain (e.g., example.com)
    ├── React Frontend (Static files & SPA routing)
    ├── Django API (/api/*)
    └── Django Admin (/admin/*)
```

## Step 1: Prepare Your Local Project

### 1.1 Build the React Frontend
```bash
cd frontend
npm install
npm run build
```

**Note:** If you get an error about missing API configuration:
- Make sure `frontend/.env.production` exists (it's been added to your project)
- It contains: `REACT_APP_USE_SAME_ORIGIN_API=true`
- This tells React to use the same domain for API calls

This creates optimized production files in `frontend/build/`.

### 1.2 Collect Django Static Files (locally for reference)
```bash
cd backend
python manage.py collectstatic --noinput
```

## Step 2: Upload to Plesk

### 2.1 Via Plesk File Manager
1. Log into your Plesk control panel
2. Go to **Files** → **File Manager**
3. Navigate to your domain's document root (usually `public_html/` or `httpdocs/`)
4. Upload the following folders:
   - `frontend/build/` → Upload contents to the root
   - `backend/` → Upload to a subdirectory (e.g., `/api_backend/` or just `backend/`)

### 2.2 Via SCP/SFTP (Recommended for large projects)
```bash
# From your local machine:
scp -r frontend/build/* user@yourserver.com:/path/to/public_html/
scp -r backend/ user@yourserver.com:/path/to/backend/
```

### 2.3 Via Git
```bash
# On your server:
cd /path/to/public_html
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
```

## Step 3: Configure Plesk for Python/Django

### 3.1 Enable Python Application Server
1. In Plesk, go to your domain → **Python** (or **Web Server Settings**)
2. Enable Python application server (usually enabled by default)
3. Select Python version (3.9+ recommended)

### 3.2 Install Python Dependencies
```bash
# SSH into your server
ssh user@yourserver.com

# Navigate to backend directory
cd /path/to/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3.3 Configure Django Settings
Edit `backend/project/settings.py`:
```python
# Add your Plesk domain
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com', 'your-ip-address']

# Set DEBUG to False in production
DEBUG = False

# Configure database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'abc_sms_db',
        'USER': 'abc_user',
        'PASSWORD': 'your-secure-database-password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Ensure static files are configured
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Ensure CSRF and security settings
CSRF_TRUSTED_ORIGINS = ['https://yourdomain.com', 'https://www.yourdomain.com']
```

## Step 4: Set Up Environment Variables

### 4.1 Create .env File on Server
```bash
# Via SSH, create backend/.env
nano /path/to/backend/.env
```

Add the following:
```env
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://abc_user:your-secure-database-password@localhost:5432/abc_sms_db
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Important:** Never commit .env to git. Plesk stores it securely.

## Step 5: Configure Web Server (Apache or Nginx)

### 5.1 For Apache (via .htaccess)
Plesk typically uses Apache. Create `.htaccess` in your `public_html/`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Serve static files and existing files directly
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # React SPA: Route all requests to index.html
    RewriteRule ^(?!api|admin|static|media).*$ index.html [QSA,L]
</IfModule>
```

### 5.2 For Nginx (Configuration)
If Plesk is using Nginx, create `/backend/plesk-nginx.conf`:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /admin/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /static/ {
    alias /path/to/backend/staticfiles/;
}
```

## Step 6: Start Django Application Server

### 6.1 Using Gunicorn (Recommended)
```bash
cd /path/to/backend
source venv/bin/activate
gunicorn project.wsgi:application --bind 127.0.0.1:8000 --workers 4
```

### 6.2 Using Waitress
```bash
cd /path/to/backend
source venv/bin/activate
waitress-serve --port=8000 project.wsgi:application
```

### 6.3 Running as a Service (Systemd)
Create `/etc/systemd/system/django-abc.service`:
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

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start django-abc
sudo systemctl enable django-abc
```

## Step 7: Handle Frontend Routes

### 7.1 Copy React Build to Document Root
```bash
# On server via SSH
cd /path/to/public_html
rm -rf !(api_backend|.htaccess)  # Remove old files, keep only api_backend
cp -r /path/to/backend/../frontend/build/* .
```

### 7.2 Update React API URLs
In `frontend/src/api.js` (if using axios or fetch):
```javascript
const API_BASE_URL = 'https://yourdomain.com/api';
// or
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://yourdomain.com/api';
```

## Step 8: Database Setup

### 8.1 PostgreSQL Setup (Recommended)
If using PostgreSQL via Plesk:
```bash
# Install adapter
pip install psycopg2-binary  # For PostgreSQL

# Update settings.py with database credentials
# Then run migrations
python manage.py migrate
```

## Step 9: Create Superuser (First Time Only)
```bash
cd /path/to/backend
source venv/bin/activate
python manage.py createsuperuser
```

## Step 10: Test Your Application

1. Visit `https://yourdomain.com` → Should see React frontend
2. Visit `https://yourdomain.com/admin/` → Should see Django admin
3. Visit `https://yourdomain.com/api/` → Should see API endpoints
4. Check Plesk logs for any errors: **Logs** → **Error & Access Logs**

## Step 11: Enable SSL/HTTPS
1. In Plesk, go to your domain → **SSL/TLS Certificates**
2. Enable "Let's Encrypt" (usually free) or upload your own
3. Redirect HTTP to HTTPS

## Troubleshooting

### Django Returns 500 Error
- Check Plesk logs: **Logs** → **Error & Access Logs**
- Verify `.env` file exists and has correct values
- Verify PostgreSQL connectivity and credentials
- Run migrations: `python manage.py migrate`

### React Routes Return 404
- Ensure `.htaccess` is in place with SPA routing rules
- Check React build exists in document root
- Verify `index.html` exists in root

### Static Files Not Loading
- Run: `python manage.py collectstatic --noinput`
- Check file permissions: `chmod -R 755 staticfiles/`
- Verify STATIC_URL and STATIC_ROOT in settings.py

### CORS Issues
- Add your domain to `CORS_ALLOWED_ORIGINS` in settings.py
- Add domain to `CSRF_TRUSTED_ORIGINS`

### Import Errors / Missing Packages
- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt`
- Check Python version compatibility

## Performance Tips

1. **Enable Gzip Compression** in Plesk
2. **Use Redis Caching** (if available)
3. **Optimize Images** in React components
4. **Enable Browser Caching** via HTTP headers
5. **Use CDN** for static assets (optional)

## Security Checklist

- [ ] DEBUG = False
- [ ] SECRET_KEY is strong (50+ characters)
- [ ] ALLOWED_HOSTS configured correctly
- [ ] SSL/HTTPS enabled
- [ ] Database file permissions: 644
- [ ] Sensitive files not committed to git
- [ ] CORS_ALLOWED_ORIGINS restricted
- [ ] Admin password is strong
- [ ] Regular backups enabled in Plesk

## Maintenance

### Regular Backups
In Plesk: **Domains** → **Backup** → Enable automatic backups

### Update Dependencies
```bash
cd backend
pip install --upgrade -r requirements.txt
cd frontend
npm update
```

### Monitor Logs
Check logs regularly in Plesk to catch issues early.

## Support & Further Reading
- [Plesk Documentation](https://docs.plesk.com/)
- [Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [Gunicorn Documentation](https://gunicorn.org/)
