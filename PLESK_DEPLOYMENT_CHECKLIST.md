# Plesk Deployment Quick Checklist

## Pre-Deployment Checklist

### 1. Local Preparation
- [ ] Build React frontend: `cd frontend && npm install && npm run build`
- [ ] Test backend locally: `cd backend && python manage.py runserver`
- [ ] Verify all tests pass: `cd backend && python manage.py test`
- [ ] Review `backend/project/settings.py`
- [ ] Update `ALLOWED_HOSTS` with your Plesk domain
- [ ] Generate a strong `SECRET_KEY`

### 2. Project Cleanup
- [ ] Delete `netlify.toml` (Netlify config - not needed)
- [ ] Delete `Procfile` (Heroku/Render - not needed)
- [ ] Delete old deployment scripts (`deploy.sh`, `redeploy.sh`) if no longer needed
- [ ] Delete `nginx.conf` (Plesk manages this)
- [ ] Archive or delete old documentation files

### 3. Prepare Environment Variables
Create a note with these values (DON'T commit to git):
```
DEBUG = False
SECRET_KEY = [your-very-long-random-key-here]
ALLOWED_HOSTS = yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS = https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS = https://yourdomain.com,https://www.yourdomain.com
```

### 4. Verify File Structure
```
✓ frontend/build/     (generated from npm run build)
✓ backend/requirements.txt
✓ backend/wsgi.ini    (new file added)
✓ backend/gunicorn.conf.py (new file added)
✓ .htaccess           (new file added)
✓ PLESK_DEPLOYMENT_GUIDE.md (new file added)
```

## Upload to Plesk

### Option 1: File Manager (for small projects)
- [ ] Log into Plesk control panel
- [ ] Navigate to Files → File Manager
- [ ] Go to `public_html/` directory
- [ ] Upload `frontend/build/` contents to root
- [ ] Create `/api_backend/` folder and upload `backend/` there

### Option 2: SCP/SFTP (for large projects)
```bash
# Replace with your actual values
scp -r frontend/build/* user@yourserver.com:/path/to/public_html/
scp -r backend/ user@yourserver.com:/path/to/backend/
```

### Option 3: Git Clone (if hosting code on GitHub)
```bash
cd /path/to/public_html
git clone https://github.com/yourusername/yourrepo.git
```

## Server Configuration in Plesk

### Python Setup
- [ ] SSH into server
- [ ] Navigate to backend directory: `cd /path/to/backend`
- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate: `source venv/bin/activate`
- [ ] Install requirements: `pip install -r requirements.txt`

### Environment Variables
- [ ] Create `.env` file in `backend/` directory
- [ ] Add all environment variables (see Pre-Deployment section)
- [ ] Verify file permissions: `chmod 600 .env`

### Database Setup
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Collect static files: `python manage.py collectstatic --noinput`

### Web Server Configuration
- [ ] For Apache: Verify `.htaccess` is in `public_html/`
- [ ] For Nginx: Add location blocks from `plesk-nginx-locations.conf`
- [ ] Test configuration: Run Plesk's tests

### Application Server
- [ ] Start Gunicorn: `gunicorn -c gunicorn.conf.py project.wsgi:application`
- [ ] (Optional) Set up systemd service for auto-restart
- [ ] Verify app is running: `curl http://127.0.0.1:8000`

### SSL/HTTPS
- [ ] Go to Plesk → Domain → SSL/TLS Certificates
- [ ] Enable Let's Encrypt (free)
- [ ] Redirect HTTP → HTTPS
- [ ] Test with `https://yourdomain.com`

## Testing

### Frontend
- [ ] Visit `https://yourdomain.com`
- [ ] Verify React app loads
- [ ] Click navigation links (should NOT get 404)
- [ ] Verify CSS/images load correctly

### Backend API
- [ ] Visit `https://yourdomain.com/api/` (should see API list)
- [ ] Visit `https://yourdomain.com/admin/` (should see Django admin login)
- [ ] Test authentication endpoints

### Combined Tests
- [ ] Log in through frontend → verify backend session works
- [ ] Submit form → verify API receives data
- [ ] Check Plesk logs for errors: **Logs** → **Error & Access Logs**

## Post-Deployment

### Monitoring
- [ ] Enable error email notifications in Plesk
- [ ] Check logs regularly
- [ ] Monitor server resources (CPU, disk, memory)

### Backups
- [ ] Enable automatic backups in Plesk
- [ ] Set backup frequency (daily recommended)
- [ ] Download a test backup to verify it works

### Maintenance
- [ ] Update dependencies monthly: `pip install --upgrade -r requirements.txt`
- [ ] Review Plesk security advisories
- [ ] Update SSL certificate (auto-renewal should be on)
- [ ] Review error logs weekly

### Performance
- [ ] Enable gzip compression in Plesk
- [ ] Enable browser caching via `.htaccess`
- [ ] Monitor page load times
- [ ] Consider CDN for static assets if needed

## Troubleshooting

### If Frontend Returns 404 on Routes
- [ ] Verify `.htaccess` exists in `public_html/`
- [ ] Verify `RewriteEngine` is enabled
- [ ] Check React `index.html` exists in root
- [ ] Restart Apache: `systemctl restart httpd` (via SSH)

### If API Returns 500 Error
- [ ] Check Plesk error logs
- [ ] Verify `.env` file exists with correct values
- [ ] Run: `python manage.py check`
- [ ] Verify PostgreSQL connectivity and credentials (`DATABASE_URL` or `DB_*`)

### If Static Files Don't Load
- [ ] Run: `python manage.py collectstatic --noinput`
- [ ] Verify `staticfiles/` folder exists
- [ ] Check `.htaccess` allows access to `/static/`
- [ ] Verify correct path in `.htaccess` alias

### If CORS Issues Occur
- [ ] Add domain to `CORS_ALLOWED_ORIGINS` in `settings.py`
- [ ] Add domain to `CSRF_TRUSTED_ORIGINS`
- [ ] Restart Django app server
- [ ] Clear browser cache

### If Emails/SMS Don't Send
- [ ] Verify email configuration in `settings.py`
- [ ] Check Plesk Mail settings
- [ ] Verify API keys in `.env` file
- [ ] Check service logs

## Rollback Plan

If something goes wrong:

```bash
# SSH into server
ssh user@yourserver.com

# Stop the app
systemctl stop django-abc  # if using systemd

# Restore from backup
# Via Plesk: Tools → Backup Manager → Restore

# Or manually restore files
git checkout main  # if using git
```

## Final Verification

- [ ] All checklist items completed
- [ ] Application loads without errors
- [ ] API endpoints respond correctly
- [ ] Admin panel accessible
- [ ] SSL certificate working
- [ ] Backups configured
- [ ] Error notifications enabled
- [ ] Team members can access application

## Support Contact

- Plesk Support: [https://www.plesk.com/help/](https://www.plesk.com/help/)
- Django Docs: [https://docs.djangoproject.com/](https://docs.djangoproject.com/)
- Gunicorn Docs: [https://docs.gunicorn.org/](https://docs.gunicorn.org/)

---

**Last Updated:** May 7, 2026  
**Status:** Ready for Plesk Deployment
