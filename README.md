# Paved Road App

Small full-stack application with a paved road from local development to CI/CD and production deploys.

Live web app: https://main.d2ue44zb6z4n2a.amplifyapp.com/

## Stack

- Monorepo: pnpm workspaces, TypeScript, ESLint, Prettier.
- Frontend: React SPA, Vite, TanStack Query, AWS Amplify client libraries.
- Backend: Node.js API with Fastify and Cognito JWT verification.
- Database: Neon Postgres in deployed environments, Prisma for schema and migrations.
- Local infra: Docker Compose for Postgres.
- Hosting: AWS Amplify Hosting for the web app, Render for the API.
- CI/CD: GitHub Actions for quality gates, migrations, deploy hooks, and API smoke tests.

## Run Locally

Install dependencies.

```bash
pnpm install
```

Create a local environment file.

```bash
cp .env.example .env
```

Fill the Cognito and app values in `.env`, then start local Postgres.

```bash
docker compose up -d postgres
```

Reset the local database and apply migrations.

```bash
pnpm db:reset
```

Start the API and web app.

```bash
pnpm dev
```

This starts local Postgres with Docker Compose, then runs:

- API: `http://localhost:3000`
- Web app: `http://localhost:5173`

To start only the API and web app without touching Docker:

```bash
pnpm dev:apps
```

Run the local quality gate.

```bash
pnpm verify
```

Useful API checks:

```bash
curl http://localhost:3000/health
curl -H "Authorization: Bearer <cognito-jwt>" http://localhost:3000/me
curl -H "Authorization: Bearer <cognito-jwt>" http://localhost:3000/notes
```

Requests to authenticated API routes require a valid Cognito bearer token.

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

## CI/CD

GitHub Actions define the path from pull request to production:

- `.github/workflows/ci.yml` runs quality gates for pull requests and pushes to `main`.
- `.github/workflows/deploy.yml` runs on pushes to `main`.

The CI workflow installs from `pnpm-lock.yaml`, runs against a real Postgres service, applies Prisma
migrations to the test database, then checks formatting, linting, Prisma Client generation,
TypeScript, production builds, Prisma schema validation, and tests.

The deploy workflow generates the Prisma Client, applies production database migrations, optionally
triggers Render and Amplify deploy hooks, then smoke-tests the API health endpoint.

Production deployment is split by service:

- `amplify.yml` builds the React SPA from `apps/web` for AWS Amplify Hosting.
- `render.yaml` defines the Render web service for the Node API.
- Neon Postgres stores production data and receives schema changes through Prisma migrations.
