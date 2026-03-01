# GitHub Operations Setup

This repo now includes:

- CI checks
- Docker publish to GHCR
- SSH deploy workflow for `staging` and `production`
- automated database backup workflow
- `CODEOWNERS`

## Branch Strategy

Use this branch model:

- `main`: production-ready only
- `staging`: pre-production integration branch
- `develop`: ongoing internal integration
- `feature/*`: short-lived task branches

Recommended flow:

1. Create a `feature/*` branch from `develop`
2. Merge validated work into `develop`
3. Promote selected changes from `develop` to `staging`
4. Validate staging deployment
5. Merge to `main` only when ready for production

## 1. Branch Protection

Configure this in GitHub UI:

1. Open `Settings > Branches`
2. Add a branch protection rule for `main`
3. Enable:
   - `Require a pull request before merging`
   - `Require approvals` (at least 1)
   - `Require status checks to pass before merging`
   - `Require branches to be up to date before merging`
4. Set required checks:
   - `CI / backend (push)`
   - `CI / frontend (push)`
   - `CI / secrets (push)`
   - `Publish Docker Images / publish (push)`

## 2. Environments

Create two GitHub Environments:

- `staging`
- `production`

Recommended:

- Require approval before deployment to `production`
- Restrict who can deploy to `production`

## 3. Repository Secrets

### Staging

- `STAGING_SSH_HOST`
- `STAGING_SSH_PORT` (optional, defaults to `22`)
- `STAGING_SSH_USER`
- `STAGING_SSH_KEY`
- `STAGING_DEPLOY_PATH`
- `STAGING_GHCR_USERNAME`
- `STAGING_GHCR_TOKEN`

### Production

- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_PORT` (optional, defaults to `22`)
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_DEPLOY_PATH`
- `PRODUCTION_GHCR_USERNAME`
- `PRODUCTION_GHCR_TOKEN`

## 4. Repository Variables

Optional:

- `VITE_API_URL`
- `ENABLE_AUTOMATED_PRODUCTION_BACKUPS`

These are used for:

- `VITE_API_URL`: frontend image build
- `ENABLE_AUTOMATED_PRODUCTION_BACKUPS=true`: enable scheduled production DB backups

## 5. Server Layout

Each target server should contain:

- cloned repo
- `docker-compose.production.yml`
- matching env file:
  - staging: `.env.staging`
  - production: `.env.production`

Example deploy directories:

- `/opt/ecommerce-gym-staging`
- `/opt/ecommerce-gym-production`

## 6. Deploy Behavior

### Staging

- auto-deploys after `Publish Docker Images` completes successfully on branch `staging`
- can also be run manually via `workflow_dispatch`

### Production

- deploys only by manual `workflow_dispatch`
- intended to stay behind environment approval

## 7. Server-side Pull Command

The workflow runs:

```bash
git fetch origin && git checkout <target-branch> && git pull --ff-only origin <target-branch>
bash scripts/db/run-compose-migrations.sh .env.<target> docker-compose.production.yml
docker compose --env-file .env.<target> -f docker-compose.production.yml pull
docker compose --env-file .env.<target> -f docker-compose.production.yml up -d --no-build
```

## 8. Required Prerequisites on Server

- Docker installed
- Docker Compose v2 available
- network access to `ghcr.io`
- login token with permission to pull packages
- env file present and correct
- enough disk space for retained backup files

## 9. Local Pre-Deploy Validation

Before promoting changes to `staging` or `main`, validate the env file locally:

```bash
npm run ops:check:env
```

This fails if required variables are missing or still use placeholder values.

Also validate compose-based migrations locally when testing deployment flow:

```bash
npm run db:migrate:compose -- .env.production docker-compose.production.yml
```

Test backup and restore flow locally:

```bash
npm run db:backup:compose -- .env.production docker-compose.production.yml
npm run db:restore:compose -- orders_db backups/orders_db-YYYYMMDD-HHMMSS.sql.gz .env.production docker-compose.production.yml
```
