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

Run the current quality gate:

```bash
pnpm verify
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
- `pnpm typecheck` - runs TypeScript project references.
- `pnpm lint` - runs ESLint.
- `pnpm format:check` - checks Prettier formatting.
- `pnpm prisma:validate` - validates the Prisma schema.
- `pnpm verify` - runs the baseline local quality gate.

## Target Stack

- Frontend: React SPA on AWS Amplify Hosting
- Backend: Node API on Render
- Database: Neon Postgres with Prisma
- Auth: Amazon Cognito
- CI/CD: GitHub Actions
