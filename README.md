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

Start the API locally:

```bash
pnpm --filter @paved-road/api dev
```

## Planned Architecture

- `apps/web` - frontend app.
- `apps/api` - backend app.
- `packages/database` - Prisma schema, migrations, and database tooling for Neon Postgres.
- `infra` - Infrastructure notes and future IaC.
- `.github/workflows` - CI/CD workflows and quality gates.

## Workspace Commands

- `pnpm dev` - runs available development scripts across workspaces.
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
of notes. The API will later use the Cognito subject from verified tokens to map requests
to an internal `User` record.

## API Development

The API currently uses a temporary development auth boundary before Cognito is integrated.
Send the seeded Cognito subject through `x-demo-user`:

```bash
curl -H "x-demo-user: local-demo-user" http://localhost:3000/me
curl -H "x-demo-user: local-demo-user" http://localhost:3000/notes
```

Requests without a known `x-demo-user` return `401`. The next auth-focused commit will
replace this internal boundary with server-side Cognito JWT verification.

## Target Stack

- Frontend: React SPA on AWS Amplify Hosting
- Backend: Node API on Render
- Database: Neon Postgres with Prisma
- Auth: Amazon Cognito
- CI/CD: GitHub Actions
