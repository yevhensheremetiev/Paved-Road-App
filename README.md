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

Apply migrations and seed local demo data:

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
- `pnpm db:seed` - seeds local development data.
- `pnpm db:reset` - resets the local database, applies migrations, and seeds demo data.
- `pnpm verify` - runs the baseline local quality gate.

## Local Demo Data

The database seed creates a demo user with Cognito subject `local-demo-user` and a couple
of notes. The API maps verified Cognito token subjects to internal `User` records.

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

## Target Stack

- Frontend: React SPA on AWS Amplify Hosting
- Backend: Node API on Render
- Database: Neon Postgres with Prisma
- Auth: Amazon Cognito
- CI/CD: GitHub Actions
