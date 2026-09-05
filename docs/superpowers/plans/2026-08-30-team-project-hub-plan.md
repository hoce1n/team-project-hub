# Team Project Hub — Implementation Plan

**Date:** 2026-08-30
**Spec:** `docs/superpowers/specs/2026-08-30-team-project-hub-design.md`
**Stack:** Next.js 16.3.x, TypeScript strict, Prisma, Postgres 16 (Docker), Better-Auth, Zod, Tailwind, shadcn/ui, Vitest

## Conventions

- Branch: `master` is used for this project (no submodules).
- All mutations are Server Actions returning `{ error }` on failure.
- Every Server Action re-checks membership + role server-side.
- Commit after each phase with a conventional message.
- `.env` holds secrets; `.env.example` holds placeholders.

---

## Phase 0 — Scaffolding

### 0.1 Create Next.js app
- Steps:
  1. `pnpm create next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-pnpm --yes` in `/workspace`
  2. Add `scripts/setup:dev` to `package.json` that runs compose up + migrate + seed
  3. Configure `next.config.ts` `server.allowedHosts` with `.monkeycode-ai.live` and dev proxy for `/api` (if backend split later)
- Verify: `pnpm dev` boots; `pnpm build` passes.

### 0.2 Docker Postgres
- Steps:
  1. Create `docker-compose.yml`: `postgres:16-alpine`, container `tp-hub-db`, port 5432, named volume, healthcheck, `POSTGRES_PASSWORD` from `.env`
  2. Create `.env` (DB URL, auth secrets placeholders) + `.env.example`
  3. `docker compose up -d postgres`
- Verify: `docker compose ps` shows healthy; `pg_isready` inside container succeeds.

### 0.3 Install dependencies
- Steps:
  1. `pnpm add @prisma/client prisma better-auth zod zustand` (zustand only if needed for optimistic state)
  2. `pnpm add -D vitest @prisma/client dev deps` for test tooling
- Verify: `pnpm install` exits 0; versions in `package.json`.

## Phase 1 — Database

### 1.1 Prisma schema
- Steps:
  1. `prisma init --datasource-provider postgresql`
  2. Write schema per spec: `User` (extended), `Workspace`, `WorkspaceMember` (role enum), `Project`, `Task` (status/priority enums), `TaskComment`, `Attachment`
  3. Define indexes on FKs; `onDelete: Cascade` for child rows
- Verify: `prisma validate` passes.

### 1.2 Migrate
- Steps:
  1. `prisma migrate dev --name init`
- Verify: migration applies; `\dt` in psql shows tables.

### 1.3 Seed
- Steps:
  1. `prisma/seed.ts`: demo user, one workspace with 2 members, 2 projects, tasks with comments + attachment metadata
  2. Register seed in `package.json` (`prisma.seed`)
- Verify: `prisma db seed` succeeds; idempotent on re-run (upsert/check).

## Phase 2 — Auth

### 2.1 Better-Auth setup
- Steps:
  1. `pnpm better-auth init` (or manual) — create `src/lib/auth.ts` with email/password + GitHub + Google providers
  2. Route handler `src/app/api/auth/[...all]/route.ts`
  3. `src/lib/session.ts`: `getSession()`, `requireUser()` helpers
- Verify: `/api/auth` responds; session cookie set on login (curl).

### 2.2 Auth UI
- Steps:
  1. `/login` and `/signup` pages with `useActionState` forms (server actions calling `auth.signUpEmail` / `signInEmail`)
  2. OAuth buttons calling `auth.api.signInSocial`
  3. `(app)` layout redirects to `/login` when unauthenticated
- Verify: signup → session persists across refresh; logout works.

## Phase 3 — Workspaces & Roles

### 3.1 Core authz logic
- Steps:
  1. `src/lib/authz.ts`: `can(userId, action, workspace)` pure function; actions: `invite`, `editWorkspace`, `deleteProject`, `manageTasks`, `comment`
  2. Vitest tests for role matrix (owner/admin/member; non-member)
- Verify: `pnpm test` passes.

### 3.2 Workspace CRUD (server actions)
- Steps:
  1. `createWorkspace`, `joinWorkspaceBySlug` (invite-code or slug), `updateWorkspace` (admin), `deleteWorkspace` (owner)
  2. Zod schemas; slug uniqueness mapped to friendly error
  3. `/dashboard` lists workspaces
- Verify: creating + joining works; duplicate slug errors friendly.

### 3.3 Members
- Steps:
  1. `inviteMember` (admin; by email → creates membership), `removeMember`, `changeRole`
  2. `/w/[slug]/members` tab; settings UI gated by role
- Verify: admin sees controls, member sees read-only; MEMBER invite call returns `{ error }`.

## Phase 4 — Projects & Tasks

### 4.1 Projects
- Steps:
  1. `createProject`, `renameProject`, `deleteProject` (admin/owner) server actions
  2. `/w/[slug]` projects grid
- Verify: CRUD works; non-admin delete blocked.

### 4.2 Task board
- Steps:
  1. `createTask`, `updateTask`, `setTaskStatus`, `deleteTask` with Zod
  2. `/w/[slug]/p/[id]` board grouped by status; optimistic status toggle (`useActionState` + local state)
  3. `/w/[slug]/p/[id]/t/[taskId]` detail page
- Verify: create/edit/status change persists; assignee + priority render.

## Phase 5 — Comments & Realtime

### 5.1 Comment CRUD
- Steps:
  1. `createComment`, `deleteComment` (author or admin)
  2. Zod body; cascade on task delete
- Verify: comments persist and render on detail page.

### 5.2 SSE stream
- Steps:
  1. `src/app/api/tasks/[id]/comments/stream/route.ts`: subscribe to a per-task channel (in-memory `EventEmitter` map; last-write-wins registry keyed by taskId)
  2. Emit `{ type: 'comment', data }` to subscribers on create
  3. Heartbeat comment to keep connection alive
- Verify: `curl -N` shows heartbeat; opening two clients shows new comments live.

### 5.3 Live feed component
- Steps:
  1. Client component `TaskCommentStream` subscribes via `EventSource` to `/api/tasks/[id]/comments/stream`, prepends new comments
  2. Fallback to polling if SSE fails (documented)
- Verify: comment in one browser appears in another without refresh.

## Phase 6 — File Uploads

### 6.1 Upload action
- Steps:
  1. `addAttachment(taskId, formData)`: validate mime allowlist + size cap (e.g. 5MB), write to `uploads/<taskId>/` with UUID filename, create `Attachment` row
  2. `.gitignore` `uploads/`
- Verify: valid file uploads; oversized/wrong-type rejected with friendly error.

### 6.2 Download route
- Steps:
  1. `GET /api/attachments/[id]`: auth check (membership), stream file with content-type + filename header
  2. Render attachment list on task detail with links
- Verify: authorized download works; non-member gets 403.

## Phase 7 — Tests & Smoke

> **Status: done.** Smoke was implemented as a Vitest integration suite
> (`tests/smoke/actions.smoke.test.ts`, `pnpm smoke`) rather than a standalone
> script, because replaying Next.js Server Action transports over raw HTTP is
> brittle (bound args reference the RSC flight stream). The suite mocks
> `next/headers`/`next/navigation`/`next/cache` and drives the real action
> functions in-process against the real Postgres DB, which exercises the full
> action code path (session, Zod, authz, persistence, uploads) minus only the
> HTTP transport.

### 7.1 Unit tests (Vitest)
- Steps:
  1. `authz.test.ts` (role matrix, already in 3.1)
  2. `validations.test.ts`: valid/invalid payloads for each action's Zod schema
  3. `comment-stream.test.ts`: hub subscribe/publish/unsubscribe
- Verify: `pnpm test` green.

### 7.2 Smoke suite
- Steps:
  1. `tests/smoke/actions.smoke.test.ts`: with a seeded DB, run: signup → create
     workspace → join → promote role → create project/task → add comment →
     upload attachment → assert each persists and unauthorized actors are
     rejected; also assert an unauthenticated actor redirects to `/login`
  2. Wired as `pnpm smoke` (runs the `tests/smoke` Vitest project)
- Verify: `pnpm smoke` exits 0 against a running Postgres DB.

## Phase 8 — Docker stretch goal

> **Status: done.** `output: "standalone"` is env-gated (`NEXT_STANDALONE=1`) so
> host-based `pnpm build && pnpm start` still works unchanged.

### 8.1 App container
- Steps:
  1. Multi-stage `Dockerfile` (`deps` → `builder` → `runner`). `deps` installs
     the full lockfile (dev tools included, since the Prisma CLI runs
     migrations); `builder` runs `prisma generate` + `next build` with
     `NEXT_STANDALONE=1`; `runner` is a slim Node image running the standalone
     `server.js` as the non-root `nextjs` user (uploads dir pre-created).
  2. `docker-compose.yml` adds two services: `migrate` (builds the `builder`
     target, runs `prisma migrate deploy`, exits) and `app` (builds the `runner`
     target) with `depends_on: migrate: condition: service_completed_successfully`,
     env wiring for `DATABASE_URL`/`BETTER_AUTH_*` against the `postgres`
     service, a `tp_hub_uploads` volume at `/app/uploads`, and a `/login`
     healthcheck. `.dockerignore` keeps the context lean.
- Verify: `docker compose up -d --build` boots `postgres` (healthy) → `migrate`
  (exit 0, "No pending migrations to apply") → `app` (healthy). Runtime check
  over HTTP on the container passed: `/` redirects to `/login`, email/password
  signup inserts a user and sets the session cookie, and `/dashboard` renders
  server-side from Postgres; `/app/uploads` is writable by uid 1001.

---

## Final verification

- Fresh clone → `pnpm install && pnpm setup:dev && pnpm dev` works (spec success criteria).
- `pnpm test`, `pnpm smoke`, `pnpm build`, `pnpm lint` all pass.
- Push all commits; update spec/plan if deviations.
