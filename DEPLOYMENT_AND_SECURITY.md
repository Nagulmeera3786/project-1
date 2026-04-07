# Deployment And Security

## What Is Safe To Push

- `backend/.env` is local-only and ignored by git.
- `frontend/.env` is local-only and ignored by git.
- `backend/db.sqlite3` is local-only and ignored by git.
- Placeholder files such as `backend/.env.example` and `frontend/.env.example` are safe to push.

If a secret is only present in `backend/.env`, it will not appear on GitHub unless you force-add it, paste it into source code, include it in logs, or previously committed it in another repository.

## Important Rule For Frontend Secrets

Anything compiled into the React frontend is public to every browser user. Never place email passwords, SMS credentials, database passwords, or Django secrets in any `REACT_APP_*` variable.

## Important Rule For Public Repositories

Anything committed into the repository is visible to anyone who can access that repository. Git ignore rules only protect files that were never committed. If a secret was ever committed before, remove it from git history and rotate it.

## Pre-Deployment Checklist

1. Confirm `backend/.env`, `frontend/.env`, and `backend/db.sqlite3` are ignored.
2. Set production values for `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, and `CSRF_TRUSTED_ORIGINS`.
3. Keep backend-only credentials in server environment variables, not in frontend code.
4. Run backend checks and tests.
5. Build the frontend.
6. Review logs for accidental secret printing.
7. Rotate any credential that may already have been exposed outside your machine.
8. Keep `DEBUG=False` in every non-local deployment.
9. Set frontend API environment variables on the hosting platform instead of baking machine-local URLs into builds.

## Commands To Run Before Release

```powershell
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py check
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
C:/ABC/Project/backend/.venv/Scripts/python.exe backend/manage.py test accounts
Set-Location frontend
npm run build
```

## GitHub Setup

1. Initialize the repository: `git init`
2. Review ignored files: `git status --ignored`
3. Commit only source, docs, and config templates.
4. Create a GitHub repository.
5. Add the remote and push.

This repo includes GitHub Actions security scanning via `.github/workflows/security.yml`.

## Website Deployment

This project is ready for a single-host deployment where Django serves the built React app.

Set these environment variables on the hosting platform:

```env
SECRET_KEY=your-production-secret
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
DATABASE_URL=postgresql://user:password@host:5432/database
DB_CONN_MAX_AGE=60
DB_SSLMODE=require
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
SMS_PROVIDER_USER=your_sms_user
SMS_PROVIDER_PASSWORD=your_sms_password
SMS_DEFAULT_SENDER_IDS=YOURID
USE_X_FORWARDED_HOST=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin
SECURE_CROSS_ORIGIN_OPENER_POLICY=same-origin
X_FRAME_OPTIONS=DENY
CORS_ALLOW_CREDENTIALS=False
```

Production note:
- Do not use SQLite for Render production unless you attach a persistent disk and explicitly set `ALLOW_SQLITE_IN_PRODUCTION=True`.
- Best practice is a managed PostgreSQL instance (Render PostgreSQL) because user auth data must survive restarts and redeployments.

Deployment steps:

1. Install backend dependencies.
2. Install frontend dependencies.
3. Run `npm run build` in `frontend`.
4. Run `python backend/manage.py migrate`.
5. Run `python backend/manage.py collectstatic --noinput`.
6. Start Django with a production server such as `gunicorn` on Linux-hosted platforms or `waitress-serve` on Windows-hosted platforms.

Linux example:

```bash
gunicorn project.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120
```

Windows example:

```powershell
python -m waitress --host=0.0.0.0 --port=$env:PORT project.wsgi:application
```

## Netlify Frontend Deployment

Use Netlify for frontend and host Django API separately.

1. Connect your GitHub repository in Netlify.
2. The included `netlify.toml` sets:
	- Base directory: `frontend`
	- Build command: `npm ci ; npm run build`
	- Publish directory: `build`
3. Add Netlify environment variable:
	- `REACT_APP_API_BASE_URL=https://your-backend-domain/api/auth/`
	- Keep `REACT_APP_USE_SAME_ORIGIN_API` unset/false for split-host deployments.
4. Deploy and verify network calls point only to your backend domain.
5. Set matching backend variables:
	- `ALLOWED_HOSTS=your-backend-domain`
	- `CSRF_TRUSTED_ORIGINS=https://your-netlify-domain.netlify.app,https://your-custom-domain.com`
	- `CORS_ALLOWED_ORIGINS=https://your-netlify-domain.netlify.app,https://your-custom-domain.com`
	- `EMAIL_TIMEOUT=8`
	- `OTP_EMAIL_MAX_ATTEMPTS=1`
	- `OTP_EMAIL_RETRY_DELAY_MS=0`

## OTP Mail Delivery And Slowness On Netlify + Render

- Netlify does not send OTP emails. Your Django backend on Render sends them.
- If OTP sending is slow or fails, the usual cause is wrong backend mail env vars or the mail provider blocking SMTP login.
- Gmail requires 2FA and an App Password. Normal Gmail account passwords do not work reliably for SMTP in production.
- Render free instances can also cold-start, which adds noticeable delay to login/signup requests.

Recommended production mail settings:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_TIMEOUT=8
OTP_EMAIL_MAX_ATTEMPTS=1
OTP_EMAIL_RETRY_DELAY_MS=0
```

If delivery is still failing, use a transactional mail provider such as SendGrid, Brevo, or Resend instead of personal Gmail SMTP.

## Portability Notes

- Frontend production builds no longer depend on your local machine's `localhost` or `127.0.0.1` unless you explicitly configure that for development.
- Frontend production builds disable source maps by default to reduce source exposure in public deployments.
- Backend startup is compatible with variable ports through `PORT` and works behind reverse proxies.
- Host-specific values belong in environment variables, not in committed source files.

## If A Secret Was Already Exposed

1. Change the password or token at the provider immediately.
2. Replace the local value in `backend/.env`.
3. If it was ever committed in git, rewrite git history before pushing further.
4. Update the secret in your hosting platform environment variables.