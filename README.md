# Ecommerce Gym

Microservices backend for a sportswear ecommerce platform, built with NestJS, Kafka, Postgres, and a React/Vite frontend.

## Stack

- NestJS API gateway
- Kafka for service-to-service messaging
- Postgres for persistence
- React + Vite frontend
- Docker / Docker Compose for local and production-style runs

## Services

- `gateway`: HTTP API, auth, admin endpoints
- `catalog`: products, categories, variants, prices, images
- `cart`: persistent cart per authenticated user
- `inventory`: stock, reservations, releases
- `orders`: order lifecycle and accounting fields
- `payments`: Yape-style flow and Culqi-ready integration points
- `shipping`: shipment creation, status transitions, tracking timeline

## Local Development

### 1. Install dependencies

```bash
npm install
npm install --prefix frontend
```

### 2. Create env files

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 3. Start infrastructure

```bash
docker compose -f docker-compose.kafka.yml up -d
docker compose -f docker-compose.postgres.yml up -d
```

### 4. Run services

Use separate terminals:

```bash
npm run start:catalog
npm run start:cart
npm run start:inventory
npm run start:orders
npm run start:payments
npm run start:shipping
npm run start:gateway
npm run start:frontend
```

Default URLs:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Production-style Docker Run

### 1. Prepare production env

```bash
cp .env.production.example .env.production
```

Set, at minimum:

- `APP_DOMAIN`
- `AUTH_TOKEN_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `PGUSER`
- `PGPASSWORD`
- `CORS_ORIGIN`
- `VITE_API_URL`

For staging, you can use:

```bash
cp .env.staging.example .env.staging
```

### 2. Build and start

```bash
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

For local HTTPS validation with Caddy:

- `APP_DOMAIN=localhost`
- `VITE_API_URL=https://localhost/api`
- `CORS_ORIGIN=https://localhost`

## Useful Commands

```bash
npm run build
npm run build:frontend
npm test
npm run test:e2e
npm run test:flow
npm run db:migrate
npm run db:backup
```

## Health and Metrics

- `GET /health`
- `GET /metrics`

Examples:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/products
```

With local production proxy:

```bash
curl -k https://localhost/health
curl -k https://localhost/api/products
```

## Admin User

The gateway seeds an admin user on startup using:

- `ADMIN_USER`
- `ADMIN_PASSWORD`

If the user already exists, startup will not overwrite it. To promote an existing user:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
psql -U postgres -d auth_db -c "UPDATE users SET role = 'ADMIN' WHERE username = 'your-user';"
```

## Repo Hygiene

- `.env.production` is intentionally ignored and should never be committed.
- Run the local secret scan before pushing:

```bash
bash scripts/repo/check-secrets.sh
```

- GitHub Actions runs:
  - backend build
  - frontend build
  - unit/e2e tests
  - tracked-file secret scan
  - Docker image publish to GHCR on `main` and `staging`
  - SSH deploy to `staging` from branch `staging`
  - manual SSH deploy to `production`

## Docker Image Publish

The repo includes a publish workflow:

- `.github/workflows/docker-publish.yml`

It publishes:

- `ghcr.io/<owner>/<repo>-backend`
- `ghcr.io/<owner>/<repo>-frontend`

Tags:

- `latest` on `main`
- `staging` on branch `staging`
- short commit SHA on every publish

Optional GitHub repository variable for frontend builds:

- `VITE_API_URL`

To run production using registry images instead of local builds, set in `.env.production`:

```bash
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:latest
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:latest
```

For staging, use branch-tagged images in `.env.staging`:

```bash
BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:staging
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:staging
```

## Deploy Environments

The repo includes:

- `.env.staging.example`
- `.github/workflows/deploy.yml`
- `.github/CODEOWNERS`
- `docs/github-operations.md`

Deployment strategy:

- `staging`: auto-deploy after `Publish Docker Images` succeeds
- `production`: manual deploy through `workflow_dispatch`

The deploy workflow runs over SSH and executes:

```bash
docker compose --env-file .env.<target> -f docker-compose.production.yml pull
docker compose --env-file .env.<target> -f docker-compose.production.yml up -d --no-build
```

GitHub-side setup still required:

- branch protection for `main`
- environments `staging` and `production`
- SSH and GHCR secrets

See:

- `docs/github-operations.md`

## Branch Model

Use:

- `main`: production-ready only
- `staging`: release candidate branch
- `develop`: integration branch
- `feature/*`: short-lived implementation branches

## Current Scope

This repo is production-oriented, but still requires external setup for:

- real domain + HTTPS certificate trust
- real Culqi credentials and webhook validation
- monitoring stack (Prometheus/Grafana, tracing)
- managed backup scheduling

## Remote Repository

GitHub remote configured for this project:

- `https://github.com/Cdiazf/ecommerce-gym.git`
