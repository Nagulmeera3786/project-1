# Dockerfile for React Frontend (Optional for Plesk deployment with Docker)
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Default single-domain production routing for bhisha.com.
ARG REACT_APP_USE_SAME_ORIGIN_API=true
ENV REACT_APP_USE_SAME_ORIGIN_API=${REACT_APP_USE_SAME_ORIGIN_API}

# ─── Copy Package Files ────────────────────────────────────────
COPY package.json package-lock.json ./

# ─── Install Dependencies ─────────────────────────────────────
RUN npm ci --no-audit --no-fund

# ─── Copy Source ──────────────────────────────────────────────
COPY . .

# ─── Build Application ────────────────────────────────────────
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# ─── Install Serve Package ────────────────────────────────────
RUN npm install -g serve

# ─── Copy Built App ───────────────────────────────────────────
COPY --from=builder /app/build ./build

# ─── Use Existing Non-Root User ───────────────────────────────
RUN chown -R node:node /app
USER node

# ─── Expose Port ──────────────────────────────────────────────
EXPOSE 3000

# ─── Start Application ────────────────────────────────────────
CMD ["serve", "-s", "build", "-l", "3000"]
