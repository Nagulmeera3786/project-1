# ABC Fullstack Project

This repository contains a Django backend (`backend/`) and a React frontend (`frontend/`).

## Structure

- `backend/` – Django application implementing authentication and APIs.
- `frontend/` – React application handling user-facing UI including auth flows and dashboard.
- `frontend/src/dashboard/` – components migrated from the separate `Main_Panel` React project to provide a sidebar/dashboard UI.

## Combining the applications

The original frontend and the `Main_Panel` project have been merged:

1. Dashboard components and CSS were copied into `frontend/src/dashboard`.
2. Dependencies from `Main_Panel` such as `react-icons`, `recharts`, and `web-vitals` were added to `frontend/package.json`.
3. `App.js` now includes a `/dashboard` route displaying the dashboard layout.
4. Backend settings and URLs were adjusted to serve the React build (`frontend/build`) at root when deployed.

## Usage

1. Install Python requirements (inside `backend`):
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Build the frontend (for production) or start in development:
   ```bash
   npm run start   # development
   npm run build   # production build -> served by Django
   ```
4. Run Django server:
   ```bash
   python backend/manage.py runserver
   ```
5. Navigate to `http://localhost:8000/` to access the combined application.

## Environment Configuration

Create `backend/.env` and set these values for consistent local/server/deployment behavior:

```env
SECRET_KEY=change-this-to-a-long-random-value
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_VERIFY_CERTS=True
EMAIL_ALLOW_INSECURE_FALLBACK=True

# Database (SQLite default)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Optional MySQL override
# DB_ENGINE=django.db.backends.mysql
# DB_NAME=abc_sms
# DB_USER=root
# DB_PASSWORD=change-me
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_CONN_MAX_AGE=60
# DB_CHARSET=utf8mb4

# CORS (optional)
# CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain

# SMS provider fallback (secure; do not hardcode in source files)
# user = YOUR_PROFILE_ID
# pwd = YOUR_PASSWORD
# sender = SENDERID
SMS_PROVIDER_USER=YOUR_PROFILE_ID
SMS_PROVIDER_PASSWORD=YOUR_PASSWORD
SMS_DEFAULT_SENDER_IDS=SENDERID
```

For frontend API routing in deployment, set one of:

- `REACT_APP_API_BASE_URL=https://your-api-domain/api/auth/` (required for split hosting like Netlify/Vercel/GitHub Pages + separate backend)
- or `REACT_APP_USE_SAME_ORIGIN_API=true` only when frontend is served by the same Django host/domain.
- or (`REACT_APP_API_PROTOCOL`, `REACT_APP_API_HOST`, `REACT_APP_API_PORT`) when you want host/port-level control.

If no frontend API environment variables are set in a production build, the app raises a configuration error by default to prevent silent misrouting. Set `REACT_APP_ALLOW_PRODUCTION_API_FALLBACK=true` only if you intentionally want same-origin fallback `/api/auth/`.

The local `backend/.env`, `frontend/.env`, and `backend/db.sqlite3` files are ignored by git and should not be committed.

Anything committed to git is potentially public. Never place real credentials in tracked files, markdown examples, or `REACT_APP_*` variables.

## Deployment Notes

- Backend static files are served with WhiteNoise; run `python manage.py collectstatic --noinput` during deployment.
- Set `DEBUG=False` and explicit `ALLOWED_HOSTS` in production.
- Set `CSRF_TRUSTED_ORIGINS=https://your-domain` for any HTTPS domain that serves the frontend.
- If frontend and backend are deployed on different domains, also set `CORS_ALLOWED_ORIGINS=https://your-frontend-domain`.
- Use `GET /healthz/` as deployment health check endpoint.
- Start production server with `gunicorn project.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120` (or use `backend/Procfile`).
- On Windows-hosted platforms, use `python -m waitress --host=0.0.0.0 --port=$PORT project.wsgi:application`.
- If OTP mail fails with Gmail, regenerate App Password and confirm 2FA is enabled.
- SMS sender ID shown to recipients comes from the sender ID chosen/typed in the UI at send time.
- Any successfully used sender ID is automatically stored and appears in future dropdown options.

For production deployment with GitHub + Netlify and secret-safe setup, see:

- `NETLIFY_GITHUB_DEPLOYMENT.md`
- `DEPLOYMENT_AND_SECURITY.md`
- `backend/.env.production.example`

## Release Validation

Before pushing to GitHub or deploying, run these checks:

```bash
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py check
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py test accounts
cd frontend && npm run build
```

## Notes

- You can remove the original `Main_Panel` directory once you're confident the integration is complete; its contents have been copied over.
- Further API endpoints can be added under `backend/accounts` to serve data to the dashboard components.
- Static files from the React build are served by Django using `STATICFILES_DIRS` configured in `settings.py`.

Enjoy the fullstack setup!

## Optional MySQL Migration Steps (from existing SQLite data)

If you already have data in SQLite and want to move to MySQL:

1. Install MySQL 8.x and create database/user.
2. Keep `backend/.env` on SQLite just for export:
   ```bash
   # temporary SQLite mode for export only
   DB_ENGINE=django.db.backends.sqlite3
   DB_NAME=db.sqlite3
   ```
3. Export SQLite data:
   ```bash
   python backend/manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data.json
   ```
4. Update `backend/.env` with MySQL values.
5. Install/update Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```
6. Run migrations on MySQL:
   ```bash
   python backend/manage.py migrate
   ```
7. Import data into MySQL:
   ```bash
   python backend/manage.py loaddata data.json
   ```
8. Create admin user if needed:
   ```bash
   python backend/manage.py createsuperuser
   ```