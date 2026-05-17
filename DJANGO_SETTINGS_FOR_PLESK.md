# Django Settings.py Configuration for Plesk

This file explains the critical changes you need to make to `backend/project/settings.py` for Plesk deployment.

## ✅ Current Configuration (Already Good)

Your `settings.py` already loads environment variables from `.env` via `python-dotenv`, which is perfect for Plesk. These parts are already correct:

```python
# Load environment variables from .env file
from dotenv import load_dotenv
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(env_path)

DEBUG = _env_bool('DEBUG', True)
SECRET_KEY = _env_text('SECRET_KEY', 'dev-secret-key...')
ALLOWED_HOSTS = [...]  # Loads from env
```

## ⚠️ Critical Changes Needed for Plesk

### 1. DEBUG Setting

**Current (Development):**
```python
DEBUG = _env_bool('DEBUG', True)  # Defaults to True - UNSAFE in production
```

**Change to (Production on Plesk):**
```python
DEBUG = _env_bool('DEBUG', False)  # Defaults to False in production
```

### 2. SECRET_KEY

**IMPORTANT: NEVER use the default dev key in production!**

```python
# BAD - Never do this in production:
SECRET_KEY = _env_text('SECRET_KEY', 'dev-secret-key-change-in-env-32chars-minimum-2026' if DEBUG else '')

# BETTER - Require it to be set:
SECRET_KEY = _env_secret('SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured('SECRET_KEY environment variable is required')
```

**Generate a strong SECRET_KEY:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Output example:
```
mk@a*87yx!-9@3h(y+5x-mz9vz+1^@v@e$-q9@+zl5#1-0kl9
```

### 3. ALLOWED_HOSTS

**Current:**
```python
ALLOWED_HOSTS = ['*'] if DEBUG else []  # Dangerous - allows any host in dev
```

**Change to (Plesk Production):**
```python
ALLOWED_HOSTS = [
    'yourdomain.com',
    'www.yourdomain.com',
    'your-plesk-ip-address',  # Optional: if accessing by IP
]
```

Or load from environment:
```python
allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [
    item.strip().replace('https://', '').replace('http://', '').rstrip('/')
    for item in allowed_hosts_env.split(',')
    if item.strip()
]
```

Then in `.env`:
```
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### 4. CORS Configuration

**Add/Update CORS Settings:**
```python
# Allow React frontend to call API
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]

# For development (remove in production):
if DEBUG:
    CORS_ALLOWED_ORIGINS.append('http://localhost:3000')
    CORS_ALLOWED_ORIGINS.append('http://127.0.0.1:3000')
```

Or load from environment:
```python
cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [
    item.strip() for item in cors_origins_env.split(',') if item.strip()
]
```

### 5. CSRF Settings

**Add CSRF Configuration:**
```python
CSRF_TRUSTED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]

# For development:
if DEBUG:
    CSRF_TRUSTED_ORIGINS.append('http://localhost:3000')
    CSRF_TRUSTED_ORIGINS.append('http://127.0.0.1:3000')
```

### 6. Security Headers (Production)

**Add Security Middleware Settings:**
```python
# Secure cookies
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
}

# HTTPS settings (enable in production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

### 7. Static Files Configuration

**Ensure static files are configured:**
```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# For production, whitenoise serves static files efficiently
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 8. Database Configuration

Use PostgreSQL for both development and production environments.

If Plesk provides PostgreSQL (recommended):
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'abc_sms_db',
        'USER': 'abc_user',
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

In `.env`:
```
DATABASE_URL=postgresql://abc_user:your-secure-database-password@localhost:5432/abc_sms_db
DB_CONN_MAX_AGE=60
DB_SSLMODE=prefer
```

## 📝 Complete Plesk .env Template

Create `backend/.env` with these values:

```env
# ─── Django Core ──────────────────────────────────────────
DEBUG=False
SECRET_KEY=mk@a*87yx!-9@3h(y+5x-mz9vz+1^@v@e$-q9@+zl5#1-0kl9

# ─── Allowed Hosts ────────────────────────────────────────
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# ─── CORS Configuration ────────────────────────────────────
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ─── Database (PostgreSQL) ───────────────────────────────
DATABASE_URL=postgresql://abc_user:your-secure-database-password@localhost:5432/abc_sms_db
DB_CONN_MAX_AGE=60
DB_SSLMODE=prefer

# ─── Email Configuration (if using Plesk Mail) ────────────
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your-email-password

# ─── API Keys & Secrets (if applicable) ────────────────────
SMS_API_KEY=your-sms-provider-key
SMS_ACCOUNT_ID=your-sms-account-id

# ─── External Services ────────────────────────────────────
ALLOWED_EMAIL_DOMAINS=yourdomain.com
```

## 🧪 Testing Your Settings

Before deploying to Plesk, test locally:

```bash
# In backend directory
python manage.py check
python manage.py check --deploy
```

This will warn about any insecure settings.

## 🚀 Deployment Steps

1. Generate strong `SECRET_KEY`: 
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

2. Update `backend/project/settings.py` with production values

3. Create `backend/.env` on Plesk server with values from template above

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Collect static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

6. Test application

## ⚠️ Critical Security Reminders

- ❌ **NEVER** commit `.env` file to git
- ❌ **NEVER** use `DEBUG=True` in production
- ❌ **NEVER** use weak `SECRET_KEY` in production
- ❌ **NEVER** set `ALLOWED_HOSTS=['*']` in production
- ✅ **ALWAYS** use HTTPS (enable in Plesk with Let's Encrypt)
- ✅ **ALWAYS** enable SECURE_SSL_REDIRECT in production
- ✅ **ALWAYS** use strong database passwords
- ✅ **ALWAYS** keep sensitive data in `.env`, not in code

## Environment Variable Reference

| Variable | Value | Example |
|----------|-------|---------|
| `DEBUG` | False for production | `False` |
| `SECRET_KEY` | 50+ character random string | `mk@a*87yx!-9@3h...` |
| `ALLOWED_HOSTS` | Comma-separated domains | `yourdomain.com,www.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Full URLs with https | `https://yourdomain.com,https://www.yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | Full URLs with https | `https://yourdomain.com,https://www.yourdomain.com` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `EMAIL_HOST_PASSWORD` | Email password | `email-password` |
| `SMS_API_KEY` | SMS service API key | `key-from-sms-provider` |

## Next Steps

1. ✅ Review all sections above
2. ✅ Generate SECRET_KEY
3. ✅ Update `backend/project/settings.py`
4. ✅ Create `.env` file on Plesk server (DON'T commit locally)
5. ✅ Test with `python manage.py check --deploy`
6. ✅ Deploy to Plesk
7. ✅ Run migrations on server
8. ✅ Test application

---

**References:**
- Django Deployment: https://docs.djangoproject.com/en/stable/howto/deployment/checklist/
- Django Settings: https://docs.djangoproject.com/en/stable/ref/settings/
