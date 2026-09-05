# Contributing to Team Project Hub

Thanks for taking the time to contribute. This document covers the development
workflow, code conventions, and the review process.

## Table of contents

- [Development environment](#development-environment)
- [Running the app](#running-the-app)
- [Scripts](#scripts)
- [Code style and quality](#code-style-and-quality)
- [Branching and commits](#branching-and-commits)
- [Opening a pull request](#opening-a-pull-request)
- [Reporting bugs and asking questions](#reporting-bugs-and-asking-questions)

## Development environment

### Prerequisites

- Node.js (18.18+ or newer)
- pnpm
- Docker and Docker Compose
- Git

### Setup

Install dependencies:

```bash
pnpm install
```

Create your environment file:

```bash
cp .env.example .env
```

Generate the Better Auth secret if you plan to sign in with OAuth or a custom
secret:

```bash
openssl rand -base64 32
```

Start PostgreSQL (the only container needed for host-based development):

```bash
docker compose up -d postgres
```

Apply the database migrations:

```bash
pnpm exec prisma migrate dev
```

Optionally load the seed data:

```bash
pnpm seed
```

## Running the app

Start the development server:

```bash
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Command             | Description                                              |
|---------------------|----------------------------------------------------------|
| `pnpm dev`          | Start the Next.js development server                     |
| `pnpm build`        | Create an optimized production build                     |
| `pnpm start`        | Start the production server after `pnpm build`           |
| `pnpm lint`         | Run ESLint                                               |
| `pnpm test`         | Run the unit test suite (no database required)           |
| `pnpm smoke`        | Run the integration smoke suite against a live database  |
| `pnpm seed`         | Seed the database with development data                  |
| `pnpm setup:dev`    | Bring up Postgres, migrate, seed, and start the dev server |

Notes:

- `pnpm smoke` needs PostgreSQL running and a valid `DATABASE_URL` in `.env`.
  It signs users up against the real database and leaves test rows behind.
- `pnpm test` is self-contained and requires no services.

## Code style and quality

Run these checks before submitting changes:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Guidelines:

- Follow the existing conventions in the codebase. Match the surrounding style.
- Do not add comments unless they explain a non-obvious decision. The code
  should be self-explanatory.
- Use server actions for mutations and return `{ error }` states. Re-check
  membership and role server-side on every mutation; never trust the client.
- Shared Zod schemas live in `src/lib/validations.ts`; do not duplicate parsing
  inline.
- Add a unit test under `src/` for any new pure logic (schemas, authorization,
  helpers).
- Do not introduce emoji in code or documentation.

## Branching and commits

Branch naming follows the format `YYMMDD-<type>-<short-description>`:

```text
260905-feat-dockerize-app
260904-fix-task-revalidation
260903-chore-update-deps
```

Use conventional commit messages:

```text
feat(workspaces): add member invitation
fix(tasks): revalidate the correct dynamic routes
test: cover comment stream publish/subscribe
chore: update README
```

Keep each commit focused on a single logical change.

## Opening a pull request

1. Create a branch off the latest `master`.
2. Make your changes and commit them on the branch.
3. Push the branch and open a pull request with `gh` or the GitHub web UI:

   ```bash
   git push -u origin <branch-name>
   gh pr create
   ```

4. Describe what changed and why, and mention the checklist items you ran:

   - `pnpm lint`
   - `pnpm exec tsc --noEmit`
   - `pnpm test`
   - `pnpm build`

   Run `pnpm smoke` as well when your change touches database behavior.

## Reporting bugs and asking questions

- For bugs, open an issue using the bug report template.
- For feature ideas, open an issue using the feature request template.
- For questions, prefer GitHub Discussions when enabled, otherwise open an
  issue.
- For security vulnerabilities, follow the guidance in [SECURITY.md](SECURITY.md)
  and do not open a public issue.
