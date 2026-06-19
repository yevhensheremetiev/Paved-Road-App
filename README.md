# Paved Road App

Skeleton repository for a small full-stack application and its paved road to production.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Prepare local environment variables:

```bash
cp .env.example .env
```

Start the local Postgres database:

```bash
docker compose up -d postgres
```

Apply local migrations:

```bash
pnpm db:reset
```

Run the current quality gate:

```bash
pnpm verify
```

Start the whole app locally:

```bash
pnpm dev
```

This starts local Postgres with Docker Compose, then runs the API on `http://localhost:3000`
and the web app on `http://localhost:5173`.

To start only the API and web app without touching Docker:

```bash
pnpm dev:apps
```

## Planned Architecture

- `apps/web` - frontend app.
- `apps/api` - backend app.
- `packages/database` - Prisma schema, migrations, and database tooling for Neon Postgres.
- `infra` - Infrastructure notes and future IaC.
- `.github/workflows` - CI/CD workflows and quality gates.

## Workspace Commands

- `pnpm dev` - starts local Postgres, API, and web app.
- `pnpm dev:apps` - starts only the API and web app using `.env`.
- `pnpm build` - runs available build scripts across workspaces.
- `pnpm test` - runs available tests across workspaces.
- `pnpm typecheck` - runs TypeScript project references.
- `pnpm lint` - runs ESLint.
- `pnpm format:check` - checks Prettier formatting.
- `pnpm prisma:generate` - generates the Prisma client.
- `pnpm prisma:migrate:dev` - creates/applies local Prisma migrations.
- `pnpm prisma:migrate:deploy` - applies existing migrations in deployed environments.
- `pnpm prisma:validate` - validates the Prisma schema.
- `pnpm db:reset` - resets the local database and applies migrations.
- `pnpm verify` - runs the baseline local quality gate.

## API Development

The API verifies Cognito JWTs server-side. Send Cognito tokens through the standard
authorization header:

```bash
curl -H "Authorization: Bearer <cognito-jwt>" http://localhost:3000/me
curl -H "Authorization: Bearer <cognito-jwt>" http://localhost:3000/notes
```

Requests without a valid bearer token return `401`. Configure the API with:

- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`

The local API upserts a `User` record from the verified Cognito token `sub` claim and then
uses that internal user id for notes queries.

## Cognito Local Setup

Create a Cognito app client for the SPA:

- App type: public client / single-page application.
- Client secret: disabled.
- OAuth grant type: authorization code grant.
- OpenID Connect scopes: `openid`, `email`, `profile`.
- Allowed callback URL: `http://localhost:5173`.
- Allowed sign-out URL: `http://localhost:5173`.

Configure local environment variables:

```bash
VITE_API_URL=http://localhost:3000
VITE_COGNITO_USER_POOL_ID=<user-pool-id>
VITE_COGNITO_CLIENT_ID=<app-client-id>
VITE_COGNITO_DOMAIN=<domain>.auth.<region>.amazoncognito.com

COGNITO_USER_POOL_ID=<user-pool-id>
COGNITO_CLIENT_ID=<app-client-id>
CORS_ORIGIN=http://localhost:5173
```

The SPA redirects to Cognito Hosted UI for login, receives a session after redirect, and
calls the API with `Authorization: Bearer <Cognito JWT>`.

## Deployment

This repository includes deployment configuration for the first production path:

- `amplify.yml` builds the React SPA from `apps/web` for AWS Amplify Hosting.
- `render.yaml` defines the Render web service for the Node API.

### AWS Amplify Hosting

Connect the repository in Amplify Hosting and use the checked-in `amplify.yml`.

Set these Amplify environment variables:

```bash
VITE_API_URL=<render-api-url>
VITE_COGNITO_USER_POOL_ID=<user-pool-id>
VITE_COGNITO_CLIENT_ID=<app-client-id>
VITE_COGNITO_DOMAIN=<domain>.auth.<region>.amazoncognito.com
```

The build command is defined in `amplify.yml`:

```bash
pnpm --filter @paved-road/web build
```

For SPA routing, configure Amplify rewrites so unmatched routes serve `/index.html`.

### Render API

Create the API service from `render.yaml` or copy these values into the Render dashboard:

```bash
Build command: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm --filter @paved-road/api build
Start command: pnpm --filter @paved-road/api start
Health check path: /health
```

Set these Render environment variables:

```bash
DATABASE_URL=<neon-postgres-connection-string>
COGNITO_USER_POOL_ID=<user-pool-id>
COGNITO_CLIENT_ID=<app-client-id>
CORS_ORIGIN=<amplify-app-url>
```

Render provides `PORT` automatically.

### Database Migrations

Use Neon Postgres for deployed environments. Run migrations before deploying API changes that
depend on schema updates:

```bash
DATABASE_URL=<neon-postgres-connection-string> pnpm prisma:migrate:deploy
```

The next CI/CD commit should automate this migration step before triggering or promoting the API
deployment.

## CI/CD

GitHub Actions define the paved road from pull request to deployed infrastructure:

- `.github/workflows/ci.yml` runs quality gates for pull requests and pushes to `main`.
- `.github/workflows/deploy.yml` runs production migrations, optional deploy hooks, and an API
  health smoke test on pushes to `main`.

### Pull Request Gates

The CI workflow runs against a real Postgres service and checks:

- install from `pnpm-lock.yaml`;
- Prisma migrations against the test database;
- formatting;
- linting;
- Prisma Client generation;
- TypeScript;
- production builds;
- Prisma schema validation;
- API integration tests.

### GitHub Secrets

Create these repository secrets before relying on the deploy workflow:

```bash
DATABASE_URL=<neon-postgres-connection-string>
API_URL=<render-api-url>
```

Optional deploy hook secrets:

```bash
RENDER_DEPLOY_HOOK_URL=<render-deploy-hook-url>
AMPLIFY_DEPLOY_HOOK_URL=<amplify-deploy-hook-url>
```

If Render and Amplify are already configured for auto-deploy on `main`, the deploy hook secrets can
be omitted. The workflow will still run migrations and smoke-test the API.

### Branch Protection

Require the `CI / Quality gates` check before merging pull requests into `main`. This ensures broken
builds, invalid migrations, failing tests, or formatting/lint issues block deployment.

## Target Stack

- Frontend: React SPA on AWS Amplify Hosting
- Backend: Node API on Render
- Database: Neon Postgres with Prisma
- Auth: Amazon Cognito
- CI/CD: GitHub Actions
