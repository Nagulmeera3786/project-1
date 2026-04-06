import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_BUILD_DIR = os.path.join(BASE_DIR, os.pardir, 'frontend', 'build')
FRONTEND_STATIC_DIR = os.path.join(FRONTEND_BUILD_DIR, 'static')

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(env_path)


def _env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on')


def _env_text(name, default=''):
    value = os.environ.get(name, default)
    return str(value).strip().strip('"').strip("'")


def _env_secret(name, fallback_name=None):
    primary = _env_text(name, '')
    if primary:
        return primary.replace(' ', '')
    if fallback_name:
        return _env_text(fallback_name, '').replace(' ', '')
    return ''


DEBUG = _env_bool('DEBUG', True)
SECRET_KEY = _env_text('SECRET_KEY', 'dev-secret-key-change-in-env-32chars-minimum-2026' if DEBUG else '')

if not SECRET_KEY:
    raise ImproperlyConfigured('SECRET_KEY must be set when DEBUG=False.')

allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
if allowed_hosts_env.strip():
    ALLOWED_HOSTS = [
        item.strip().replace('https://', '').replace('http://', '').rstrip('/')
        for item in allowed_hosts_env.split(',')
        if item.strip()
    ]
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1'] if DEBUG else []

# Render exposes the public host via env vars; include it as a safety fallback.
render_host = _env_text('RENDER_EXTERNAL_HOSTNAME') or _env_text('RENDER_PUBLIC_HOSTNAME')
if render_host:
    normalized_render_host = render_host.replace('https://', '').replace('http://', '').rstrip('/')
    if normalized_render_host and normalized_render_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(normalized_render_host)

if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured('ALLOWED_HOSTS must be set when DEBUG=False.')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # Include React build templates only when available on this server.
        'DIRS': [FRONTEND_BUILD_DIR] if os.path.isdir(FRONTEND_BUILD_DIR) else [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'project.wsgi.application'

db_engine = _env_text('DB_ENGINE', 'django.db.backends.sqlite3')
db_name_default = str(BASE_DIR / 'db.sqlite3') if db_engine == 'django.db.backends.sqlite3' else 'abc_sms'
database_url = _env_text('DATABASE_URL', '')


def _database_config_from_url(raw_url):
    parsed = urlparse(raw_url)
    scheme = (parsed.scheme or '').lower()

    # Normalize database URL schemes from managed providers.
    if scheme in ('postgres', 'postgresql', 'postgresql+psycopg2'):
        engine = 'django.db.backends.postgresql'
    elif scheme in ('mysql', 'mysql2'):
        engine = 'django.db.backends.mysql'
    elif scheme == 'sqlite':
        engine = 'django.db.backends.sqlite3'
    else:
        raise ImproperlyConfigured(
            f"Unsupported DATABASE_URL scheme '{scheme}'. Supported: postgres, mysql, sqlite"
        )

    if engine == 'django.db.backends.sqlite3':
        sqlite_path = unquote(parsed.path or '').lstrip('/') or str(BASE_DIR / 'db.sqlite3')
        return {
            'ENGINE': engine,
            'NAME': sqlite_path,
        }

    db_name = unquote((parsed.path or '').lstrip('/'))
    config = {
        'ENGINE': engine,
        'NAME': db_name,
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or '',
        'PORT': str(parsed.port or ''),
    }

    query = parse_qs(parsed.query or '')
    sslmode = query.get('sslmode', [None])[0] or _env_text('DB_SSLMODE', '')
    if sslmode:
        config['OPTIONS'] = {'sslmode': sslmode}

    return config

if database_url:
    DATABASES = {'default': _database_config_from_url(database_url)}
elif db_engine == 'django.db.backends.sqlite3':
    DATABASES = {
        'default': {
            'ENGINE': db_engine,
            'NAME': _env_text('DB_NAME', db_name_default),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': db_engine,
            'NAME': _env_text('DB_NAME', db_name_default),
            'USER': _env_text('DB_USER', 'root'),
            'PASSWORD': _env_text('DB_PASSWORD', ''),
            'HOST': _env_text('DB_HOST', '127.0.0.1'),
            'PORT': _env_text('DB_PORT', '3306'),
        }
    }

if db_engine == 'django.db.backends.mysql':
    DATABASES['default']['OPTIONS'] = {
        'charset': _env_text('DB_CHARSET', 'utf8mb4'),
    }
    DATABASES['default']['CONN_MAX_AGE'] = int(_env_text('DB_CONN_MAX_AGE', 60))

if DATABASES['default']['ENGINE'] in ('django.db.backends.postgresql', 'django.db.backends.mysql'):
    DATABASES['default']['CONN_MAX_AGE'] = int(_env_text('DB_CONN_MAX_AGE', 60))

if not DEBUG and DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
    DATABASES['default'].setdefault('OPTIONS', {})
    DATABASES['default']['OPTIONS'].setdefault('sslmode', _env_text('DB_SSLMODE', 'require'))

if not DEBUG and DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3' and not _env_bool('ALLOW_SQLITE_IN_PRODUCTION', False):
    raise ImproperlyConfigured(
        'SQLite is disabled in production by default. Use a managed database '
        'or set ALLOW_SQLITE_IN_PRODUCTION=True with a persistent disk.'
    )

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Serve React frontend build files when frontend and backend are deployed together.
STATICFILES_DIRS = [FRONTEND_STATIC_DIR] if os.path.isdir(FRONTEND_STATIC_DIR) else []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST framework / JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# CORS for local development
cors_allowed_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_allowed_origins.strip():
    CORS_ALLOWED_ORIGINS = [item.strip() for item in cors_allowed_origins.split(',') if item.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = DEBUG

cors_allowed_origin_regexes_env = os.environ.get('CORS_ALLOWED_ORIGIN_REGEXES', '')
if cors_allowed_origin_regexes_env.strip():
    CORS_ALLOWED_ORIGIN_REGEXES = [
        item.strip()
        for item in cors_allowed_origin_regexes_env.split(',')
        if item.strip()
    ]

csrf_trusted_origins_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [
    item.strip()
    for item in csrf_trusted_origins_env.split(',')
    if item.strip()
]

csrf_trusted_origin_regexes_env = os.environ.get('CSRF_TRUSTED_ORIGIN_REGEXES', '')
if csrf_trusted_origin_regexes_env.strip():
    CSRF_TRUSTED_ORIGIN_REGEXES = [
        item.strip()
        for item in csrf_trusted_origin_regexes_env.split(',')
        if item.strip()
    ]

# Email configuration - REAL SMTP for production
# For Gmail: https://support.google.com/accounts/answer/185833
# 1. Enable 2FA on your Google account
# 2. Generate an app password at https://myaccount.google.com/apppasswords
# 3. Set EMAIL_USER and EMAIL_PASSWORD in .env file

EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'accounts.email_backend.EmailBackend')
EMAIL_HOST = _env_text('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(_env_text('EMAIL_PORT', 587))
EMAIL_USE_TLS = _env_bool('EMAIL_USE_TLS', True)
EMAIL_USE_SSL = _env_bool('EMAIL_USE_SSL', False)
EMAIL_HOST_USER = _env_text('EMAIL_USER') or _env_text('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = _env_secret('EMAIL_PASSWORD', 'EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = _env_text('EMAIL_FROM', 'no-reply@example.com')
EMAIL_SSL_CERTFILE = _env_text('EMAIL_SSL_CERTFILE') or None
EMAIL_SSL_KEYFILE = _env_text('EMAIL_SSL_KEYFILE') or None
EMAIL_VERIFY_CERTS = _env_bool('EMAIL_VERIFY_CERTS', True)
EMAIL_ALLOW_INSECURE_FALLBACK = _env_bool('EMAIL_ALLOW_INSECURE_FALLBACK', True)
EMAIL_TIMEOUT = int(_env_text('EMAIL_TIMEOUT', 20))

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = _env_bool('USE_X_FORWARDED_HOST', not DEBUG)
SESSION_COOKIE_SECURE = _env_bool('SESSION_COOKIE_SECURE', not DEBUG)
SESSION_COOKIE_HTTPONLY = _env_bool('SESSION_COOKIE_HTTPONLY', True)
SESSION_COOKIE_SAMESITE = _env_text('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SECURE = _env_bool('CSRF_COOKIE_SECURE', not DEBUG)
CSRF_COOKIE_HTTPONLY = _env_bool('CSRF_COOKIE_HTTPONLY', False)
CSRF_COOKIE_SAMESITE = _env_text('CSRF_COOKIE_SAMESITE', 'Lax')
SECURE_SSL_REDIRECT = _env_bool('SECURE_SSL_REDIRECT', not DEBUG)
SECURE_HSTS_SECONDS = int(_env_text('SECURE_HSTS_SECONDS', 0 if DEBUG else 3600))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', not DEBUG)
SECURE_HSTS_PRELOAD = _env_bool('SECURE_HSTS_PRELOAD', False)
SECURE_CONTENT_TYPE_NOSNIFF = _env_bool('SECURE_CONTENT_TYPE_NOSNIFF', True)
SECURE_REFERRER_POLICY = _env_text('SECURE_REFERRER_POLICY', 'strict-origin-when-cross-origin')
SECURE_CROSS_ORIGIN_OPENER_POLICY = _env_text('SECURE_CROSS_ORIGIN_OPENER_POLICY', 'same-origin')
X_FRAME_OPTIONS = _env_text('X_FRAME_OPTIONS', 'DENY')
CORS_ALLOW_CREDENTIALS = _env_bool('CORS_ALLOW_CREDENTIALS', False)

# Avoid silent OTP email failures in production.
# In local debug sessions, allow console backend when SMTP credentials are missing.
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    if DEBUG:
        EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    else:
        raise ImproperlyConfigured(
            'EMAIL_USER/EMAIL_PASSWORD (or EMAIL_HOST_USER/EMAIL_HOST_PASSWORD) '
            'must be configured when DEBUG=False.'
        )

# custom user model
AUTH_USER_MODEL = 'accounts.User'

# Primary admin user to auto-grant elevated access
PRIMARY_ADMIN_EMAIL = os.environ.get('PRIMARY_ADMIN_EMAIL', 'mrm53451@gmail.com').strip().lower()

# SMS provider fallback credentials (use backend/.env for confidential values)
SMS_PROVIDER_USER = _env_text('SMS_PROVIDER_USER', '')
SMS_PROVIDER_PASSWORD = _env_secret('SMS_PROVIDER_PASSWORD')
SMS_PROVIDER_URL = _env_text('SMS_PROVIDER_URL', 'https://mshastra.com/bsms/buser/send_sms_center.aspx')
SMS_PROVIDER_JSON_URL = _env_text('SMS_PROVIDER_JSON_URL', 'https://mshastra.com/sendsms_api_json.aspx')
SMS_DEFAULT_SENDER_IDS = [
    sender_id.strip()
    for sender_id in _env_text('SMS_DEFAULT_SENDER_IDS', '').split(',')
    if sender_id.strip()
]
