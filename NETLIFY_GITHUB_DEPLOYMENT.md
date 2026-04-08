# Netlify + GitHub Deployment Guide (Secure)

## Recommended Architecture

- Frontend (React): Netlify
- Backend (Django API): Render/Railway/Azure/VPS
- Reason: Netlify is ideal for static frontend hosting; Django backend should run on a server platform.

## 1. Before Pushing To GitHub

1. Keep secrets only in local env files:
   - `backend/.env`
   - `frontend/.env`
2. Verify ignored files:
   - `git status --ignored`
3. Rotate any credentials that were ever shared or exposed.
4. Ensure no secret values are hardcoded in source files.
5. Never commit real `.env` files. Use only the `*.example` templates in git.

## 2. Push To GitHub

1. Create a GitHub repository.
2. Add remote and push:

```powershell
Set-Location C:/ABC/Project
git remote add origin https://github.com/<your-username>/<your-repo>.git
git add .
git commit -m "Production-ready deploy hardening"
git push -u origin main
```

3. Confirm GitHub Actions pass:
   - `CI` workflow
   - `Security Scan` workflow

## 3. Deploy Backend (Django)

Use Render/Railway/Azure/VPS and configure environment variables from:
- `backend/.env.production.example`

Minimum required production variables:
- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS`
- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`
- email and SMS credentials

Recommended hardening variables:
- `USE_X_FORWARDED_HOST=True`
- `SESSION_COOKIE_HTTPONLY=True`
- `SESSION_COOKIE_SAMESITE=Lax`
- `CSRF_COOKIE_SAMESITE=Lax`
- `SECURE_CONTENT_TYPE_NOSNIFF=True`
- `SECURE_REFERRER_POLICY=strict-origin-when-cross-origin`
- `SECURE_CROSS_ORIGIN_OPENER_POLICY=same-origin`
- `X_FRAME_OPTIONS=DENY`

Deploy commands:

```bash
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py collectstatic --noinput
```

Serve the backend with:

```bash
gunicorn project.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
```

If you host on Windows instead of Linux:

```powershell
python -m waitress --host=0.0.0.0 --port=$env:PORT project.wsgi:application
```

## 4. Deploy Frontend (Netlify)

This repository includes `netlify.toml` configured with:
- Base directory: `frontend`
- Build command: `npm ci --no-audit --no-fund ; npm run build`
- Publish directory: `build`
- SPA redirects
- Security headers

In Netlify:
1. Connect your GitHub repo.
2. Keep default settings from `netlify.toml`.
3. Set frontend environment variable:
   - `REACT_APP_API_BASE_URL=https://<your-backend-domain>/api/auth/`
   - or `REACT_APP_API_URL=https://<your-backend-domain>/api/auth/` (alias)
   - Do not enable `REACT_APP_USE_SAME_ORIGIN_API=true` unless frontend is actually served by the backend domain.
   - If frontend API variables are omitted in production, the app now raises a clear configuration error by default to prevent silent Netlify misrouting.
   - Set `REACT_APP_ALLOW_PRODUCTION_API_FALLBACK=true` only if you intentionally want same-origin fallback `/api/auth/`.
4. Deploy.

### Required Netlify Build Settings (quick checklist)

Set these in Netlify Site Settings to keep deployed behavior aligned with local development:

- Build command: `npm ci --no-audit --no-fund ; npm run build`
- Publish directory: `build`
- Base directory: `frontend`
- Node version: `20`

Set at least one API target variable (recommended first option):

- `REACT_APP_API_BASE_URL=https://<your-backend-domain>/api/auth/`
- or `REACT_APP_API_URL=https://<your-backend-domain>/api/auth/`
- or `REACT_APP_USE_SAME_ORIGIN_API=true` (only for same-domain hosting)

Important:

- If API variables are missing, build now fails early with a clear message.
- Re-deploy frontend every time you change any `REACT_APP_*` variable.
- Add your exact Netlify site URL to backend `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.

## 5. Post-Deployment Security Checklist

1. Verify frontend never contains backend credentials.
2. Check browser dev tools network calls target only backend API URL.
3. Confirm backend `DEBUG=False` in production.
4. Confirm cookies/security headers are enabled.
5. Confirm CORS and CSRF allow only trusted frontend domains.
6. Enable provider-side 2FA for email/SMS accounts.
7. Periodically rotate secrets and monitor GitHub security alerts.
8. Keep source maps disabled in public frontend builds unless you intentionally need them for debugging.

## 6. If A Secret Is Accidentally Exposed

1. Revoke/rotate it immediately at the provider.
2. Replace it in host environment variables.
3. Remove from repository history (if committed) before further pushes.
4. Redeploy backend/frontend.

