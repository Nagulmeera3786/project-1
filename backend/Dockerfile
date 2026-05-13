# Dockerfile for Django Backend (Optional for Plesk deployment with Docker)
FROM python:3.11-slim

WORKDIR /app

# ─── Install System Dependencies ──────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ─── Copy Requirements ────────────────────────────────────────
COPY requirements.txt .

# ─── Install Python Dependencies ──────────────────────────────
RUN pip install --no-cache-dir -r requirements.txt

# ─── Copy Application ─────────────────────────────────────────
COPY . .

# ─── Create Non-Root User ────────────────────────────────────
RUN useradd -m -u 1000 django && chown -R django:django /app
USER django

# ─── Expose Port ──────────────────────────────────────────────
EXPOSE 8000

# ─── Run Gunicorn ─────────────────────────────────────────────
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000"]
