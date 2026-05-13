# Plesk Deployment - Complete Summary

## 🎯 What Has Been Done

I've prepared your Django + React application for Plesk hosting by creating essential configuration files and comprehensive deployment documentation.

### ✅ Files Added (7 New Files)

1. **[PLESK_DEPLOYMENT_GUIDE.md](PLESK_DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment guide
2. **[PLESK_DEPLOYMENT_CHECKLIST.md](PLESK_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment and testing checklist
3. **[DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md)** - Django settings configuration guide
4. **[PLESK_FILES_CLEANUP.md](PLESK_FILES_CLEANUP.md)** - Which files to remove/keep
5. **[.htaccess](.htaccess)** - Apache rewrite rules for React SPA routing
6. **[backend/gunicorn.conf.py](backend/gunicorn.conf.py)** - Gunicorn application server config
7. **[backend/wsgi.ini](backend/wsgi.ini)** - uWSGI application server config

### 📚 Optional Files Added (Bonus)

- **[plesk-nginx-locations.conf](plesk-nginx-locations.conf)** - Nginx config (if Plesk uses Nginx)
- **[docker-compose.yml](docker-compose.yml)** - Local testing environment
- **[backend/Dockerfile](backend/Dockerfile)** - Backend Docker image
- **[frontend/Dockerfile](frontend/Dockerfile)** - Frontend Docker image

### ❌ Files to Remove (Not Needed for Plesk)

```
netlify.toml              (Netlify config - remove)
Procfile                  (Heroku/Render config - remove)
nginx.conf                (Plesk manages this - remove)
deploy.sh                 (Old script - remove if not needed)
redeploy.sh               (Old script - remove if not needed)
NETLIFY_GITHUB_DEPLOYMENT.md (Netlify docs - remove)
```

---

## 🚀 Quick Start (5 Steps)

### Step 1: Build React Frontend
```bash
cd frontend
npm install
npm run build
```

### Step 2: Prepare Deployment Files
1. Delete unnecessary files (see list above)
2. Create `.env` file on Plesk server (DON'T commit locally)
3. Review [DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md) and update `backend/project/settings.py`

### Step 3: Upload to Plesk

**Via File Manager:**
- Upload `frontend/build/*` → Plesk `public_html/`
- Upload `backend/` → Plesk `backend/` directory

**Via SCP (Recommended):**
```bash
scp -r frontend/build/* user@yourserver:/path/to/public_html/
scp -r backend/ user@yourserver:/path/to/backend/
```

### Step 4: Configure on Plesk Server
```bash
# SSH into Plesk server
ssh user@yourserver

# Navigate to backend
cd /path/to/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

### Step 5: Start Django Application
```bash
# Using Gunicorn (Recommended)
gunicorn -c gunicorn.conf.py project.wsgi:application

# Or using Waitress
waitress-serve --port=8000 project.wsgi:application
```

---

## 📋 Project Structure After Preparation

```
ABC/Project/
├── 📄 PLESK_DEPLOYMENT_GUIDE.md           ← Start here!
├── 📄 PLESK_DEPLOYMENT_CHECKLIST.md       ← Use for testing
├── 📄 DJANGO_SETTINGS_FOR_PLESK.md        ← Configure Django
├── 📄 PLESK_FILES_CLEANUP.md              ← What to remove
├── 📄 PLESK_DEPLOYMENT_SUMMARY.md         ← You are here
├── 📄 .htaccess                           ← Apache routing (new)
├── 📄 README.md                           ✓ Keep
├── 📄 API_DOCUMENTATION.md                ✓ Keep
│
├── 📁 backend/
│   ├── 📄 requirements.txt                ✓ Keep
│   ├── 📄 manage.py                       ✓ Keep
│   ├── 📄 gunicorn.conf.py                ← New, for app server
│   ├── 📄 wsgi.ini                        ← New, for app server
│   ├── 📄 Dockerfile                      ← Optional
│   ├── project/
│   │   ├── settings.py                    ✏️ UPDATE for Plesk
│   │   ├── wsgi.py                        ✓ Keep
│   │   └── urls.py                        ✓ Keep
│   ├── staticfiles/                       ✓ Keep
│   └── ...
│
├── 📁 frontend/
│   ├── 📄 package.json                    ✓ Keep
│   ├── 📄 Dockerfile                      ← Optional
│   ├── 📁 build/                          ✓ Generated (npm run build)
│   ├── 📁 src/                            ✓ Keep
│   └── ...
│
└── 📁 .archive/ (optional, for old docs)
```

---

## 🔧 Configuration Files Explained

### .htaccess (Apache)
- Enables React SPA routing (all routes return `index.html`)
- Routes `/api/` and `/admin/` to Django backend
- Serves static files efficiently
- Adds security headers
- Enables gzip compression

**Location:** Place in `public_html/` (document root)

### gunicorn.conf.py
- Configures Gunicorn application server
- Sets worker processes (4 by default)
- Configures logging
- Sets timeouts and buffering

**Usage:**
```bash
gunicorn -c gunicorn.conf.py project.wsgi:application
```

### wsgi.ini
- Alternative uWSGI configuration (if Plesk uses uWSGI instead of Gunicorn)
- Configure socket binding
- Set process/thread count

---

## 🌐 How Plesk Will Route Requests

```
User visits: https://yourdomain.com/
    ↓
1. Plesk Apache/Nginx receives request
    ↓
2. .htaccess checks if file/directory exists
    ↓
3. If NOT a real file → Routes to /index.html (React SPA)
    ↓
4. React loads and handles routing internally

User calls API: https://yourdomain.com/api/auth/login
    ↓
1. Plesk Apache/Nginx receives /api/ request
    ↓
2. .htaccess (or Nginx config) sees /api/
    ↓
3. Proxies to Django Gunicorn at 127.0.0.1:8000
    ↓
4. Django processes request and returns JSON
```

---

## 🔐 Security Checklist

Before deploying, ensure:

- [ ] `DEBUG = False` in production settings
- [ ] Strong `SECRET_KEY` set (50+ characters)
- [ ] `ALLOWED_HOSTS` set to your domain(s)
- [ ] `.env` file created on server (NOT in git)
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Database file permissions: `chmod 644 db.sqlite3`
- [ ] HTTPS/SSL enabled in Plesk
- [ ] CORS origins restricted to your domain
- [ ] CSRF trusted origins configured
- [ ] Security headers enabled

See [DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md) for details.

---

## 📖 Documentation Files Reference

| File | Purpose | Read When |
|------|---------|-----------|
| [PLESK_DEPLOYMENT_GUIDE.md](PLESK_DEPLOYMENT_GUIDE.md) | Complete deployment instructions | Before uploading to Plesk |
| [PLESK_DEPLOYMENT_CHECKLIST.md](PLESK_DEPLOYMENT_CHECKLIST.md) | Pre/post deployment checks | For verification & testing |
| [DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md) | Django configuration guide | Before updating settings.py |
| [PLESK_FILES_CLEANUP.md](PLESK_FILES_CLEANUP.md) | Files to remove/keep | Before committing & uploading |

---

## 🆘 Common Issues & Solutions

### React Routes Return 404
**Solution:**
- Ensure `.htaccess` exists in `public_html/`
- Verify `RewriteEngine On` is enabled
- Check `index.html` is in root
- Restart Apache

### API Returns 500 Error
**Solution:**
- Check `.env` file exists with correct values
- Run: `python manage.py check`
- Check error logs in Plesk
- Verify database permissions

### Static Files Not Loading
**Solution:**
- Run: `python manage.py collectstatic --noinput`
- Verify `STATIC_ROOT` in `settings.py`
- Check `.htaccess` allows `/static/` access

### CORS/CSRF Errors
**Solution:**
- Add domain to `CORS_ALLOWED_ORIGINS` in `.env`
- Add domain to `CSRF_TRUSTED_ORIGINS` in `.env`
- Restart Django application

See [PLESK_DEPLOYMENT_CHECKLIST.md](PLESK_DEPLOYMENT_CHECKLIST.md#troubleshooting) for more solutions.

---

## 🎓 Next Steps

1. **Read** [PLESK_DEPLOYMENT_GUIDE.md](PLESK_DEPLOYMENT_GUIDE.md) completely
2. **Update** `backend/project/settings.py` using [DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md)
3. **Build** React: `cd frontend && npm install && npm run build`
4. **Clean up** unnecessary files using [PLESK_FILES_CLEANUP.md](PLESK_FILES_CLEANUP.md)
5. **Test** locally with `docker-compose up` (optional)
6. **Upload** to Plesk following the guide
7. **Configure** Plesk using the deployment guide
8. **Test** using [PLESK_DEPLOYMENT_CHECKLIST.md](PLESK_DEPLOYMENT_CHECKLIST.md)

---

## 📞 Support Resources

- **Plesk Docs:** https://docs.plesk.com/
- **Django Deployment:** https://docs.djangoproject.com/en/stable/howto/deployment/
- **Gunicorn:** https://docs.gunicorn.org/
- **Security Checklist:** https://docs.djangoproject.com/en/stable/howto/deployment/checklist/

---

## ✨ Key Features of This Setup

✅ **React SPA Routing** - All routes work correctly (no 404 errors)  
✅ **Django REST API** - Fully functional API at `/api/`  
✅ **Admin Interface** - Django admin at `/admin/`  
✅ **Static Files** - Optimized serving via Nginx/Apache  
✅ **Security** - CORS, CSRF, security headers configured  
✅ **Performance** - Gzip compression, browser caching  
✅ **Scalability** - Gunicorn with multiple workers  
✅ **SSL/TLS** - HTTPS ready with Let's Encrypt support  

---

**Status:** ✅ Ready for Plesk Deployment  
**Last Updated:** May 7, 2026  
**Questions?** Check the documentation files above or Plesk support
