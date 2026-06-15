# Docker-Only Quick Start

This project can run fully in Docker (database + backend + frontend + nginx).

## Local full-stack (Docker only)

Run from project root:

```bash
docker compose up -d --build
```

Open the app at:

```text
http://127.0.0.1:8080
```

Health check:

```bash
curl -I http://127.0.0.1:8080/healthz/
```

Stop:

```bash
docker compose down
```

## VPS production (Docker only)

## 1. On VPS, go to app folder

```bash
cd /var/www/vhosts/bhisha.com/project-1
```

## 2. Ensure backend environment file exists

The stack reads backend environment values from:

- `backend/.env`

Set production values there (DEBUG=False, SECRET_KEY, ALLOWED_HOSTS, email/SMS config, etc.).

## 3. Set PostgreSQL credentials for Docker stack

Run before first docker deploy (or put in shell profile):

```bash
export POSTGRES_DB=abc_sms
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=change-this-strong-password
```

## 4. Deploy using Docker only

```bash
bash redeploy-docker.sh
```

Or manually:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 5. Verify

```bash
docker compose -f docker-compose.prod.yml ps
curl -I http://127.0.0.1/healthz/
```

## 6. Domain routing

- Point bhisha.com DNS to VPS IP.
- Containerized Nginx listens on port 80 and serves frontend + backend routing.

## Useful commands

```bash
# Logs
 docker compose -f docker-compose.prod.yml logs -f

# Restart stack
 docker compose -f docker-compose.prod.yml restart

# Stop stack
 docker compose -f docker-compose.prod.yml down
```
