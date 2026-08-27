import os
import sys
import logging
from pathlib import Path
from datetime import timedelta
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)

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


def _env_csv_list(name):
    raw = os.environ.get(name, '')
    return [item.strip().rstrip('/') for item in raw.split(',') if item.strip()]


def _normalize_origin(value):
    normalized = str(value or '').strip().rstrip('/')
    if normalized.startswith('http://') or normalized.startswith('https://'):
        return normalized
    return ''


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
    # Default to Plesk production domain when no env variable
    if DEBUG:
        ALLOWED_HOSTS = ['*']  # Allow any host in debug mode
    else:
        ALLOWED_HOSTS = ['bhisha.com', 'www.bhisha.com', 'localhost', '127.0.0.1']

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
    'project.middleware.PrimaryAdminOnlyMiddleware',
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

database_url = _env_text('DATABASE_URL', '')


def _database_config_from_url(raw_url):
    parsed = urlparse(raw_url)
    scheme = (parsed.scheme or '').lower()

    if scheme not in ('postgres', 'postgresql', 'postgresql+psycopg2'):
        raise ImproperlyConfigured(
            f"Unsupported DATABASE_URL scheme '{scheme}'. Supported: postgres"
        )

    db_name = unquote((parsed.path or '').lstrip('/'))
    if not db_name:
        raise ImproperlyConfigured('DATABASE_URL must include a PostgreSQL database name.')

    config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or '',
        'PORT': str(parsed.port or '5432'),
        'CONN_MAX_AGE': int(_env_text('DB_CONN_MAX_AGE', 60)),
    }

    query = parse_qs(parsed.query or '')
    sslmode = query.get('sslmode', [None])[0] or _env_text('DB_SSLMODE', 'require' if not DEBUG else 'prefer')
    if sslmode:
        config['OPTIONS'] = {'sslmode': sslmode}

    return config

if database_url:
    DATABASES = {'default': _database_config_from_url(database_url)}
else:
    db_name = _env_text('DB_NAME', 'abc_sms')
    db_user = _env_text('DB_USER', '')
    db_password = _env_text('DB_PASSWORD', '')
    db_host = _env_text('DB_HOST', '127.0.0.1')
    db_port = _env_text('DB_PORT', '5432')

    if not db_name:
        raise ImproperlyConfigured('Set DB_NAME or DATABASE_URL for PostgreSQL configuration.')

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': db_port,
            'CONN_MAX_AGE': int(_env_text('DB_CONN_MAX_AGE', 60)),
        }
    }

DATABASES['default'].setdefault('OPTIONS', {})
DATABASES['default']['OPTIONS'].setdefault('sslmode', _env_text('DB_SSLMODE', 'require' if not DEBUG else 'prefer'))

# Prefer SQLite for local test runs to avoid requiring PostgreSQL CREATE DATABASE privileges.
RUNNING_TESTS = any(arg in ('test', 'pytest') for arg in sys.argv)
if RUNNING_TESTS and _env_bool('USE_SQLITE_FOR_TESTS', DEBUG):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(BASE_DIR / 'test_db.sqlite3'),
            # File-based test DB (not in-memory shared-cache) so concurrent
            # live-server threads get real file locking instead of sqlite
            # 'bad parameter or other API misuse' errors; the longer busy
            # timeout makes concurrent writes retry instead of failing.
            'OPTIONS': {'timeout': int(_env_text('SQLITE_TEST_TIMEOUT', 30))},
            'TEST': {'NAME': str(BASE_DIR / 'test_db.sqlite3')},
        }
    }

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
    {
        'NAME': 'accounts.password_validators.StrongPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Serve React frontend build files when frontend and backend are deployed together.
STATICFILES_DIRS = [FRONTEND_STATIC_DIR] if os.path.isdir(FRONTEND_STATIC_DIR) else []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Upload limits for large bulk operations (SMS file uploads, etc.).
FILE_UPLOAD_MAX_MEMORY_SIZE = int(_env_text('FILE_UPLOAD_MAX_MEMORY_SIZE', str(250 * 1024 * 1024)))
DATA_UPLOAD_MAX_MEMORY_SIZE = int(_env_text('DATA_UPLOAD_MAX_MEMORY_SIZE', str(500 * 1024 * 1024)))

# REST framework / JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Scoped rate limits. Only endpoints that explicitly opt in via
    # throttle_classes are affected; all other endpoints stay unthrottled.
    'DEFAULT_THROTTLE_RATES': {
        # Mail-validation report downloads are bandwidth heavy; cap per user.
        'email_validation_download': _env_text('EMAIL_VALIDATION_DOWNLOAD_RATE', '120/min'),
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# CORS / CSRF trusted frontend origins.
# In production, set CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS explicitly when possible.
CORS_ALLOWED_ORIGINS = _env_csv_list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_ALL_ORIGINS = False if CORS_ALLOWED_ORIGINS else DEBUG

if not DEBUG:
    # Temporary HTTP-first production fallback for bhisha.com.
    # Keep both schemes while SSL is intentionally bypassed.
    for _origin in ['http://bhisha.com', 'http://www.bhisha.com']:
        if _origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(_origin)
    for _origin in ['https://bhisha.com', 'https://www.bhisha.com']:
        if _origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(_origin)
    CORS_ALLOW_ALL_ORIGINS = False

frontend_origin_candidates = [
    _env_text('FRONTEND_URL'),
    _env_text('FRONTEND_ORIGIN'),
    _env_text('FRONTEND_APP_URL'),
    _env_text('NETLIFY_APP_URL'),
    _env_text('NETLIFY_URL'),
    _env_text('NETLIFY_PRIMARY_URL'),
]
frontend_origin_candidates.extend(_env_csv_list('PUBLIC_FRONTEND_ORIGINS'))

for _origin_candidate in frontend_origin_candidates:
    normalized_frontend_origin = _normalize_origin(_origin_candidate)
    if normalized_frontend_origin and normalized_frontend_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(normalized_frontend_origin)
        CORS_ALLOW_ALL_ORIGINS = False

# Optional support for Netlify deploy preview URLs:
# Example: https://main--your-site.netlify.app
netlify_site_name = _env_text('NETLIFY_SITE_NAME')
if netlify_site_name:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        rf'^https://[a-zA-Z0-9-]+--{netlify_site_name}\.netlify\.app$'
    ]
else:
    CORS_ALLOWED_ORIGIN_REGEXES = [r'^https://[a-zA-Z0-9-]+\.netlify\.app$']

cors_allowed_origin_regexes_env = os.environ.get('CORS_ALLOWED_ORIGIN_REGEXES', '')
if cors_allowed_origin_regexes_env.strip():
    _configured_regexes = [
        item.strip()
        for item in cors_allowed_origin_regexes_env.split(',')
        if item.strip()
    ]
    if 'CORS_ALLOWED_ORIGIN_REGEXES' in globals():
        CORS_ALLOWED_ORIGIN_REGEXES.extend(_configured_regexes)
    else:
        CORS_ALLOWED_ORIGIN_REGEXES = _configured_regexes

CSRF_TRUSTED_ORIGINS = _env_csv_list('CSRF_TRUSTED_ORIGINS')
if not DEBUG:
    for _origin in ['http://bhisha.com', 'http://www.bhisha.com']:
        if _origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(_origin)
    for _origin in ['https://bhisha.com', 'https://www.bhisha.com']:
        if _origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(_origin)

for _origin_candidate in frontend_origin_candidates:
    normalized_frontend_origin = _normalize_origin(_origin_candidate)
    if normalized_frontend_origin and normalized_frontend_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(normalized_frontend_origin)

csrf_trusted_origin_regexes_env = os.environ.get('CSRF_TRUSTED_ORIGIN_REGEXES', '')
if csrf_trusted_origin_regexes_env.strip():
    CSRF_TRUSTED_ORIGIN_REGEXES = [
        item.strip()
        for item in csrf_trusted_origin_regexes_env.split(',')
        if item.strip()
    ]

# ── Email configuration ────────────────────────────────────────────────────
# Supported providers (set EMAIL_PROVIDER in Render env):
#   sendgrid  →  EMAIL_PROVIDER=sendgrid  +  SENDGRID_API_KEY=SG.xxx
#   mailgun   →  EMAIL_PROVIDER=mailgun   +  EMAIL_USER=postmaster@mg.yourdomain.com
#                                         +  MAILGUN_SMTP_PASSWORD=xxx
#   gmail     →  EMAIL_USER=you@gmail.com +  EMAIL_PASSWORD=app_password  (2FA + App Password required)
#   ionos     →  EMAIL_PROVIDER=ionos     +  EMAIL_USER=you@yourdomain.com
#                                         +  EMAIL_PASSWORD=your_ionos_email_password
#                                         +  EMAIL_FROM=you@yourdomain.com
#                                         +  automatic fallback between 465/SSL and 587/TLS
#   graph     →  EMAIL_PROVIDER=graph     +  GRAPH_TENANT_ID / GRAPH_CLIENT_ID / GRAPH_CLIENT_SECRET
#                                         +  GRAPH_SENDER_EMAIL (defaults to PRIMARY_ADMIN_EMAIL)
#                                         (sends via Microsoft Graph API instead of SMTP)
#   custom    →  set EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASSWORD manually
#
# For Gmail App Password: Google Account → Security → 2-Step Verification → App passwords
# For IONOS: use your IONOS email address as EMAIL_USER and your IONOS email password as EMAIL_PASSWORD.

_email_provider = _env_text('EMAIL_PROVIDER', '').lower()
EMAIL_PROVIDER = _email_provider

# Provider-specific defaults (overridden by explicit env vars if present)
_PROVIDER_DEFAULTS = {
    'sendgrid': {
        'host': 'smtp.sendgrid.net',
        'port': '587',
        'user': 'apikey',               # SendGrid requires this literal value
        'password_env': 'SENDGRID_API_KEY',
        'use_tls': True,
        'use_ssl': False,
    },
    'mailgun': {
        'host': 'smtp.mailgun.org',
        'port': '587',
        'user': None,                   # set via EMAIL_USER
        'password_env': 'MAILGUN_SMTP_PASSWORD',
        'use_tls': True,
        'use_ssl': False,
    },
    'ionos': {
        'host': 'smtp.ionos.com',
        'port': '465',
        'user': None,                   # set via EMAIL_USER (your IONOS email address)
        'password_env': '',             # use EMAIL_PASSWORD
        'use_tls': False,
        'use_ssl': True,
    },
}

_pd = _PROVIDER_DEFAULTS.get(_email_provider, {})

EMAIL_BACKEND     = os.environ.get('EMAIL_BACKEND', 'accounts.email_backend.EmailBackend')
EMAIL_HOST        = _env_text('EMAIL_HOST',    _pd.get('host', 'smtp.gmail.com'))
EMAIL_PORT        = int(_env_text('EMAIL_PORT', str(_pd.get('port', 587))))
EMAIL_USE_TLS     = _env_bool('EMAIL_USE_TLS', _pd.get('use_tls', True))
EMAIL_USE_SSL     = _env_bool('EMAIL_USE_SSL', _pd.get('use_ssl', False))

# Guard against common IONOS misconfiguration where port and SSL/TLS flags are mixed.
if _email_provider == 'ionos':
    if EMAIL_PORT == 587 and EMAIL_USE_SSL:
        EMAIL_USE_SSL = False
        EMAIL_USE_TLS = True
        logger.warning('Adjusted IONOS SMTP config: port 587 requires TLS (SSL disabled).')
    elif EMAIL_PORT == 465 and EMAIL_USE_TLS:
        EMAIL_USE_TLS = False
        EMAIL_USE_SSL = True
        logger.warning('Adjusted IONOS SMTP config: port 465 requires SSL (TLS disabled).')

# SendGrid requires 'apikey' as the SMTP username; other providers use the real email address.
_default_smtp_user    = _pd.get('user') or ''
EMAIL_HOST_USER       = _env_text('EMAIL_USER') or _env_text('EMAIL_HOST_USER') or _default_smtp_user

# Check provider-specific key first (e.g. SENDGRID_API_KEY), then generic keys.
_pw_env               = _pd.get('password_env', '')
EMAIL_HOST_PASSWORD   = (
    (_env_secret(_pw_env) if _pw_env else '')
    or _env_secret('EMAIL_PASSWORD', 'EMAIL_HOST_PASSWORD')
)

_configured_email_from = _env_text('EMAIL_FROM', '')
if _configured_email_from:
    DEFAULT_FROM_EMAIL = _configured_email_from
elif _email_provider == 'ionos' and EMAIL_HOST_USER:
    # IONOS SMTP commonly rejects messages when FROM doesn't match authenticated mailbox.
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    DEFAULT_FROM_EMAIL = 'no-reply@example.com'
EMAIL_SSL_CERTFILE         = _env_text('EMAIL_SSL_CERTFILE') or None
EMAIL_SSL_KEYFILE          = _env_text('EMAIL_SSL_KEYFILE') or None

# Microsoft Graph API mail sending (Entra ID app, client-credentials flow).
# Used for signup OTP, forgot-password OTP, and reset-password mail when
# EMAIL_PROVIDER=graph. The sending mailbox is the admin mailbox (PRIMARY_ADMIN_EMAIL)
# unless GRAPH_SENDER_EMAIL is set explicitly.
GRAPH_TENANT_ID = _env_text('GRAPH_TENANT_ID', '')
GRAPH_CLIENT_ID = _env_text('GRAPH_CLIENT_ID', '')
GRAPH_CLIENT_SECRET = _env_secret('GRAPH_CLIENT_SECRET')
GRAPH_SENDER_EMAIL = _env_text('GRAPH_SENDER_EMAIL', '')

if _email_provider == 'graph':
    EMAIL_BACKEND = 'accounts.graph_email_backend.GraphEmailBackend'
EMAIL_VERIFY_CERTS         = _env_bool('EMAIL_VERIFY_CERTS', True)
EMAIL_ALLOW_INSECURE_FALLBACK = _env_bool('EMAIL_ALLOW_INSECURE_FALLBACK', True)
EMAIL_TIMEOUT              = int(_env_text('EMAIL_TIMEOUT', 15 if not DEBUG else 20))
OTP_EMAIL_MAX_ATTEMPTS     = int(_env_text('OTP_EMAIL_MAX_ATTEMPTS', 2 if not DEBUG else 2))
OTP_EMAIL_RETRY_DELAY_MS   = int(_env_text('OTP_EMAIL_RETRY_DELAY_MS', 0 if not DEBUG else 500))
OTP_EMAIL_SUBJECT          = _env_text('OTP_EMAIL_SUBJECT', 'Your verification code')

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
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

# Enforce HTTP compatibility for bhisha.com while SSL is intentionally bypassed.
if not DEBUG and ('bhisha.com' in ALLOWED_HOSTS or 'www.bhisha.com' in ALLOWED_HOSTS):
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0

# Avoid silent OTP email failures in production.
# Fall back to console backend when SMTP credentials are missing so the
# application can still boot; OTP emails simply won't be delivered until
# proper SMTP credentials are configured. Graph mode uses its own
# tenant/client credentials instead of SMTP, so it is exempt from this check.
if _email_provider == 'graph':
    if not (GRAPH_TENANT_ID and GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET):
        EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
        logger.warning(
            'GRAPH_TENANT_ID/GRAPH_CLIENT_ID/GRAPH_CLIENT_SECRET are not configured; '
            'using console email backend until Microsoft Graph credentials are set.'
        )
elif not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    logger.warning(
        'SMTP credentials are not configured; using console email backend. '
        'Set EMAIL_USER/EMAIL_PASSWORD (or EMAIL_HOST_USER/EMAIL_HOST_PASSWORD) '
        'to enable real email delivery.'
    )

# custom user model
AUTH_USER_MODEL = 'accounts.User'

# Primary admin user to auto-grant elevated access.
# Set PRIMARY_ADMIN_EMAIL in backend/.env to your real admin mailbox; it is also
# used as the sender identity for OTP/forgot-password/reset-password mail.
PRIMARY_ADMIN_EMAIL = os.environ.get('PRIMARY_ADMIN_EMAIL', 'noreply@smshandover.com').strip().lower()
PRIMARY_ADMIN_ENFORCEMENT = _env_bool('PRIMARY_ADMIN_ENFORCEMENT', not DEBUG)

# Graph mode sends as the admin mailbox unless EMAIL_FROM/GRAPH_SENDER_EMAIL override it.
if _email_provider == 'graph' and not _configured_email_from:
    DEFAULT_FROM_EMAIL = GRAPH_SENDER_EMAIL or PRIMARY_ADMIN_EMAIL

# SMS provider fallback credentials (use backend/.env for confidential values)
SMS_PROVIDER_USER = _env_text('SMS_PROVIDER_USER', '')
SMS_PROVIDER_PASSWORD = _env_secret('SMS_PROVIDER_PASSWORD')
SMS_PROVIDER_URL = _env_text('SMS_PROVIDER_URL', 'https://mshastra.com/bsms/buser/send_sms_center.aspx')
SMS_PROVIDER_JSON_URL = _env_text('SMS_PROVIDER_JSON_URL', 'https://mshastra.com/sendsms_api_json.aspx')
SMS_PROVIDER_BALANCE_URL = _env_text('SMS_PROVIDER_BALANCE_URL', '')
SMS_PROVIDER_BALANCE_METHOD = _env_text('SMS_PROVIDER_BALANCE_METHOD', 'GET').upper()
SMS_DEFAULT_SENDER_IDS = [
    sender_id.strip()
    for sender_id in _env_text('SMS_DEFAULT_SENDER_IDS', '').split(',')
    if sender_id.strip()
]
SMS_DLT_TEMPLATE_ID = _env_text('SMS_DLT_TEMPLATE_ID', '')
SMS_DLT_ENTITY_ID = _env_text('SMS_DLT_ENTITY_ID', '')
SMS_DLT_TELEMARKETER_ID = _env_text('SMS_DLT_TELEMARKETER_ID', '')
SMS_SEND_MAX_FILE_SIZE_MB = int(_env_text('SMS_SEND_MAX_FILE_SIZE_MB', 250))
SMS_MAX_SEGMENTS = int(_env_text('SMS_MAX_SEGMENTS', 10))

# Razorpay wallet recharge settings
RAZORPAY_KEY_ID = _env_text('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = _env_secret('RAZORPAY_KEY_SECRET')
RAZORPAY_CURRENCY = _env_text('RAZORPAY_CURRENCY', 'INR')

# Email validation provider settings
EMAIL_VALIDATION_PROVIDER_MODE = _env_text('EMAIL_VALIDATION_PROVIDER_MODE', 'own_system').strip().lower()
EMAIL_VALIDATION_BATCH_SIZE = int(_env_text('EMAIL_VALIDATION_BATCH_SIZE', 1000))
EMAIL_VALIDATION_MAX_WORKERS = int(_env_text('EMAIL_VALIDATION_MAX_WORKERS', 64))
EMAIL_VALIDATION_DOMAIN_PREFETCH_WORKERS = int(_env_text('EMAIL_VALIDATION_DOMAIN_PREFETCH_WORKERS', 64))
EMAIL_VALIDATION_MAX_FILE_SIZE_MB = int(_env_text('EMAIL_VALIDATION_MAX_FILE_SIZE_MB', 500))
EMAIL_VALIDATION_MAX_EMAILS_PER_REQUEST = int(_env_text('EMAIL_VALIDATION_MAX_EMAILS_PER_REQUEST', 500000))
EMAIL_VALIDATION_ASYNC_THRESHOLD = int(_env_text('EMAIL_VALIDATION_ASYNC_THRESHOLD', 1500))
EMAIL_VALIDATION_PROGRESS_UPDATE_INTERVAL = int(_env_text('EMAIL_VALIDATION_PROGRESS_UPDATE_INTERVAL', 1))
EMAIL_VALIDATION_SKIP_SMTP_FOR_POPULAR_DOMAINS = _env_bool('EMAIL_VALIDATION_SKIP_SMTP_FOR_POPULAR_DOMAINS', True)
EMAIL_VALIDATION_MAILBOX_CHECK_ENABLED = _env_bool('EMAIL_VALIDATION_MAILBOX_CHECK_ENABLED', False)
EMAIL_VALIDATION_OWN_SYSTEM_USE_SMTP = _env_bool('EMAIL_VALIDATION_OWN_SYSTEM_USE_SMTP', False)
EMAIL_VALIDATION_SMTP_RETRY_ATTEMPTS = int(_env_text('EMAIL_VALIDATION_SMTP_RETRY_ATTEMPTS', 1))
EMAIL_VALIDATION_DNS_RETRY_ATTEMPTS = int(_env_text('EMAIL_VALIDATION_DNS_RETRY_ATTEMPTS', 1))
EMAIL_VALIDATION_SMTP_TIMEOUT_SECONDS = float(_env_text('EMAIL_VALIDATION_SMTP_TIMEOUT_SECONDS', 2.5))

# ZeroBounce API
ZEROBOUNCE_API_KEY = _env_secret('ZEROBOUNCE_API_KEY')
ZEROBOUNCE_VALIDATE_URL = _env_text('ZEROBOUNCE_VALIDATE_URL', 'https://api.zerobounce.net/v2/validate')
ZEROBOUNCE_CREDITS_URL = _env_text('ZEROBOUNCE_CREDITS_URL', 'https://api.zerobounce.net/v2/getcredits')

# MillionVerifier API
MILLIONVERIFIER_API_KEY = _env_secret('MILLIONVERIFIER_API_KEY')
MILLIONVERIFIER_VALIDATE_URL = _env_text('MILLIONVERIFIER_VALIDATE_URL', 'https://api.millionverifier.com/api/v3/')
MILLIONVERIFIER_CREDITS_URL = _env_text('MILLIONVERIFIER_CREDITS_URL', 'https://api.millionverifier.com/api/v3/credits')

# Celery + Redis async processing
EMAIL_VALIDATION_USE_CELERY = _env_bool('EMAIL_VALIDATION_USE_CELERY', False)
CELERY_BROKER_URL = _env_text('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = _env_text('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = int(_env_text('CELERY_TASK_TIME_LIMIT', 7200))
CELERY_TASK_SOFT_TIME_LIMIT = int(_env_text('CELERY_TASK_SOFT_TIME_LIMIT', 6900))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'level': _env_text('DJANGO_DB_LOG_LEVEL', 'WARNING').upper(),
            'handlers': ['console'],
        },
        # Surface unhandled view exceptions (500s) on the console so load
        # tests and local dev show the real traceback instead of an empty page.
        'django.request': {
            'level': _env_text('DJANGO_REQUEST_LOG_LEVEL', 'ERROR').upper(),
            'handlers': ['console'],
            'propagate': False,
        },
    },
}

