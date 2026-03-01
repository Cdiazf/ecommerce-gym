# GitHub Operations Setup

This repo now includes:

- CI checks
- Docker publish to GHCR
- SSH deploy workflow for `staging` and `production`
- `CODEOWNERS`

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

This is used by the Docker publish workflow when building the frontend image.

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

- auto-deploys after `Publish Docker Images` completes successfully on `main`
- can also be run manually via `workflow_dispatch`

### Production

- deploys only by manual `workflow_dispatch`
- intended to stay behind environment approval

## 7. Server-side Pull Command

The workflow runs:

```bash
docker compose --env-file .env.<target> -f docker-compose.production.yml pull
docker compose --env-file .env.<target> -f docker-compose.production.yml up -d --no-build
```

## 8. Required Prerequisites on Server

- Docker installed
- Docker Compose v2 available
- network access to `ghcr.io`
- login token with permission to pull packages
- env file present and correct
