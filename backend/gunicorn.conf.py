# Gunicorn Configuration for Plesk Deployment
# Place this in backend/ directory
# Run with: gunicorn -c gunicorn.conf.py project.wsgi:application

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# ─── Worker Configuration ──────────────────────────────────────
# gthread workers let one process serve many concurrent requests (validation
# submits, polling, and streaming report downloads) without blocking. Each
# process handles `threads` requests in parallel; tune via env vars.
workers = int(os.environ.get('GUNICORN_WORKERS', '4'))
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'gthread')
threads = int(os.environ.get('GUNICORN_THREADS', '4'))
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# ─── Server Socket ────────────────────────────────────────────
bind = '127.0.0.1:8000'
backlog = 2048

# ─── Timeout ──────────────────────────────────────────────────
# Large streamed CSV/JSON downloads can take longer than 30s on slow links.
timeout = int(os.environ.get('GUNICORN_TIMEOUT', '300'))
graceful_timeout = int(os.environ.get('GUNICORN_GRACEFUL_TIMEOUT', '30'))
keepalive = 5

# ─── Logging ──────────────────────────────────────────────────
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ─── Process Naming ────────────────────────────────────────────
proc_name = 'django-abc'

# ─── Server Mechanics ─────────────────────────────────────────
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# ─── SSL ───────────────────────────────────────────────────────
# Only needed if Gunicorn handles SSL (usually Plesk/Nginx handles it)
# keyfile = None
# certfile = None

# ─── Application ──────────────────────────────────────────────
raw_env = ['DJANGO_SETTINGS_MODULE=project.settings']
