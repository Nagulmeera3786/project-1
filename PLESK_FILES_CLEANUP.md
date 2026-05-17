# Plesk Deployment - Files to Remove & Project Cleanup

## Files to Remove (Not Needed for Plesk)

These files were configured for Netlify, Render, or other platforms and are **NOT needed for Plesk**:

### ❌ DELETE THESE FILES:

```bash
# Configuration files for other platforms
netlify.toml                          # Netlify-specific (remove)
nginx.conf                            # Already handled by Plesk (remove)
Procfile                              # Heroku/Render specific (remove)
deploy.sh                             # Old deployment script (optional - remove if using new one)
redeploy.sh                           # Old deployment script (optional - remove if using new one)

# Documentation for other platforms
NETLIFY_GITHUB_DEPLOYMENT.md          # Netlify docs (remove)
NETWORK_ERROR_FIXED.md                # Internal notes (optional - archive)
IMPLEMENTATION_COMPLETE.md            # Outdated (optional - archive)
IMPLEMENTATION_COMPLETE_SMS.md        # Outdated (optional - archive)
```

### ⚠️ OPTIONAL CLEANUP (Archive these):

```bash
# Old environment setup docs
CREDENTIALS_SETUP.md
FORGOT_PASSWORD_SETUP.md
SMS_DEBUGGING_GUIDE.md
SMS_FEATURE_DOCUMENTATION.md
SMS_FEATURE_READY.md
SMS_FINAL_STATUS.md
SMS_QUICK_REFERENCE.md
SMS_QUICK_START.md
DEPLOYMENT_AND_SECURITY.md            # Partially obsolete
API_DOCUMENTATION.md                  # Keep if still relevant

# Test files
query/                                # Remove if unused
test_*.py                             # Keep if needed, but remove if not
```

## Files to Keep

```bash
README.md                             # Main documentation
backend/                              # Core application
  requirements.txt                    # Python dependencies ✅
  project/settings.py                 # Config (edit for Plesk) ✅
  manage.py                           # Django CLI ✅
  wsgi.py                             # WSGI entry point ✅
frontend/                             # React app
  package.json                        # Dependencies ✅
  build/                              # Production build (generated) ✅
  src/                                # Source code ✅
```

## New Files Added for Plesk

✅ **These have been added to your project:**

```bash
# Main deployment guide
PLESK_DEPLOYMENT_GUIDE.md             # Complete deployment instructions ✅

# Apache/Nginx configurations
.htaccess                             # Apache rewrite rules for SPA routing ✅
plesk-nginx-locations.conf            # Nginx config (if Plesk uses Nginx) ✅

# Application server configurations
backend/wsgi.ini                      # uWSGI configuration ✅
backend/gunicorn.conf.py              # Gunicorn configuration ✅

# Docker support (optional, for local testing)
docker-compose.yml                    # Local dev environment ✅
backend/Dockerfile                    # Backend container ✅
frontend/Dockerfile                   # Frontend container ✅

# This file
PLESK_FILES_CLEANUP.md                # You are here ✅
```

## Quick Cleanup Commands

Run these on your local machine:

```bash
# Navigate to project root
cd /path/to/ABC/Project

# Remove unnecessary files
rm -f netlify.toml Procfile deploy.sh redeploy.sh NETLIFY_GITHUB_DEPLOYMENT.md

# (Optional) Archive old documentation
mkdir -p .archive
mv NETWORK_ERROR_FIXED.md IMPLEMENTATION_COMPLETE*.md SMS_*.md DEPLOYMENT_AND_SECURITY.md .archive/

# (Optional) Remove old test files
cd backend
rm -f test_*.py
cd ..
```

## File Structure After Cleanup

```
ABC/Project/
├── PLESK_DEPLOYMENT_GUIDE.md              ✅ Read this first!
├── PLESK_FILES_CLEANUP.md                 ✅ You are here
├── README.md                              ✅ Keep
├── API_DOCUMENTATION.md                   ✅ Keep
├── .htaccess                              ✅ NEW - Apache rewrite rules
├── docker-compose.yml                     ✅ NEW - Local testing (optional)
│
├── backend/
│   ├── requirements.txt                   ✅ Keep
│   ├── manage.py                          ✅ Keep
│   ├── wsgi.ini                           ✅ NEW - Plesk app server config
│   ├── gunicorn.conf.py                   ✅ NEW - Gunicorn config
│   ├── Dockerfile                         ✅ NEW - Docker support (optional)
│   ├── project/
│   │   ├── settings.py                    ✅ EDIT for Plesk domain
│   │   ├── wsgi.py                        ✅ Keep
│   │   ├── urls.py                        ✅ Keep
│   │   ├── middleware.py                  ✅ Keep
│   │   └── ...
│   ├── accounts/                          ✅ Keep
│   ├── migrations/                        ✅ Keep
│   └── staticfiles/                       ✅ Keep
│
├── frontend/
│   ├── package.json                       ✅ Keep
│   ├── build/                             ✅ Keep (generated from npm run build)
│   ├── src/                               ✅ Keep
│   ├── public/                            ✅ Keep
│   ├── Dockerfile                         ✅ NEW - Docker support (optional)
│   └── scripts/                           ✅ Keep
│
└── .archive/ (optional)
    ├── SMS_*.md
    ├── IMPLEMENTATION_COMPLETE*.md
    └── ...
```

## Next Steps

1. ✅ Review [PLESK_DEPLOYMENT_GUIDE.md](PLESK_DEPLOYMENT_GUIDE.md) carefully
2. ✅ Clean up unnecessary files (see commands above)
3. ✅ Edit `backend/project/settings.py` with your Plesk domain
4. ✅ Build frontend: `cd frontend && npm install && npm run build`
5. ✅ Upload to Plesk using the guide
6. ✅ Configure Python/Node.js in Plesk panel
7. ✅ Set up environment variables in Plesk
8. ✅ Run migrations: `python manage.py migrate`
9. ✅ Create superuser: `python manage.py createsuperuser`
10. ✅ Start Django app server
11. ✅ Test your application

## Important Notes

- **Do NOT commit `.env` to git** - Plesk will store it securely
- **PostgreSQL is recommended for Plesk production**
- **Update `ALLOWED_HOSTS` in `settings.py`** with your actual domain
- **Test locally first** using `docker-compose up` before deploying to Plesk
- **Enable HTTPS** in Plesk using Let's Encrypt (free SSL)

## Support

- Plesk Help: https://docs.plesk.com/
- Django Deployment: https://docs.djangoproject.com/en/stable/howto/deployment/
- Gunicorn: https://docs.gunicorn.org/
