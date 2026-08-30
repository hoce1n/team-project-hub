# Team Project Hub — Design Spec

**Date:** 2026-08-30
**Stack:** Next.js 15 (App Router), TypeScript (strict), Prisma, Postgres 16, Better-Auth, Zod, Tailwind CSS, shadcn/ui, Vitest
**Goal:** Build a small, cohesive fullstack app ("Team Project Hub") that deliberately exercises every layer of the stack as a learning lab.

## 1. Purpose

A learning-first fullstack project. The app is a mini Linear/Notion clone where users create workspaces, invite members, manage projects and tasks, comment live on tasks, and attach files. Each feature is intentionally small but touches a different part of the stack:

- Better-Auth (email/password + Google/GitHub OAuth, sessions)
- Role-based access control on shared resources
- Relational data modeling with Prisma migrations + seeding
- Server Actions with Zod validation
- Realtime updates via SSE
- File uploads
- Docker (Postgres in Compose; optional app containerization as a stretch goal)

## 2. Architecture

- Next.js 15 App Router: RSC pages + client components as leaf nodes only.
- All mutations via Server Actions; reads via Server Components or RSC data fetching.
- Realtime via Server-Sent Events (SSE) on a single route. No WebSocket infra.
- Postgres 16 runs in Docker Compose; Prisma is the data layer.
- Auth handled entirely by Better-Auth; app code never touches session cookies directly.

### Folder structure (App Router)

```
/app
  (auth)/login, (auth)/signup
  (app)/dashboard           → user's workspaces + join by slug
  (app)/w/[slug]            → workspace: projects grid, members, settings (admin-only)
  (app)/w/[slug]/p/[id]     → project: task board
  (app)/w/[slug]/p/[id]/t/[taskId] → task detail: comments + attachments
  api/auth/[...all]         → Better-Auth handler
  api/tasks/[id]/comments/stream → SSE route
  api/attachments/[id]      → file streaming route
```

## 3. Data Model (Prisma)

```
User                    (managed by Better-Auth + app fields: name, image)
  └─ Workspace          (name, slug unique, createdAt)
       └─ WorkspaceMember (userId, workspaceId, role: OWNER|ADMIN|MEMBER)
            └─ Project  (name, description, workspaceId)
                 └─ Task (title, description, status enum, priority enum, dueDate)
                      └─ TaskComment (body, taskId, authorId)
                      └─ Attachment (filename, mimeType, size, taskId)
```

Key modeling decisions:

- **Role lives on `WorkspaceMember`**, not `User` — a user can be admin in one workspace and member in another (join table with extra fields pattern).
- **Better-Auth owns the `User` table.** App-specific profile data lives on a separate table rather than fighting Better-Auth's schema.
- **Enums** for `role`, `status` (TODO | IN_PROGRESS | DONE), `priority` (LOW | MEDIUM | HIGH) — Postgres enums through Prisma migrations.
- **Unique slug** on Workspace with custom validation.

## 4. Learning Modules & Feature Mapping

| Module | Home in the app |
|---|---|
| Email/password auth | Signup + login pages via Better-Auth |
| OAuth (Google/GitHub) | Same login page; credentials configured via env vars |
| Roles/permissions | Workspace membership; OWNER/ADMIN invite members, edit settings, delete projects; MEMBER creates/edits tasks and comments. Enforced in server actions, not just UI |
| Relational data + seeding | 5-model hierarchy; `prisma/seed.ts` creates demo workspace, members, projects, tasks |
| Server Actions + validation | All mutations; Zod schemas shared client/server; `useActionState` for pending/error states; optimistic update for task status |
| Realtime | SSE `GET /api/tasks/[id]/comments/stream`; client subscribes with `EventSource` |
| File uploads | Attachments on local disk under `uploads/`; validation of type + size in the action |
| Docker | Postgres via `docker-compose.yml`; optional multi-stage app Dockerfile as stretch goal |

### Explicitly out of scope (YAGNI)

- Email verification / password reset flows
- Real multi-user presence/collaborative editing
- S3/cloud file storage (documented as swap-in point)
- Full E2E suite (Playwright) in v1
- Notifications / activity feed beyond the comment stream

## 5. Security & Authorization

- **Trust nothing from the client:** every Server Action re-checks membership + role server-side.
- Central `can(user, action, workspace)` pure function, unit-tested.
- Zod validates all input; Postgres errors (e.g. duplicate slug) mapped to friendly messages.
- Attachments checked for MIME type and size in the action; streamed back via a route with auth check.
- Never log or leak secrets; all credentials via `.env` (`.env.example` committed).

## 6. Error Handling

- Server Actions return `{ error }` for validation/authorization failures — never throw to the client.
- RSC pages throw typed errors caught by `error.tsx`; global `not-found.tsx` for bad slugs/task IDs.

## 7. Testing

- **Vitest unit tests** for: `can()` role logic, Zod schemas.
- **Smoke script** (`scripts/smoke.ts`) exercising critical server actions against the seeded DB.
- No E2E suite initially; documented as future work.

## 8. Dev Workflow & Docker

- `docker compose up -d postgres` (pinned `postgres:16-alpine`, named volume, healthcheck)
- `prisma migrate dev` → `prisma db seed`
- `pnpm dev`
- Wrapped by `pnpm setup:dev`.

### Stretch goal (optional, after core ships)

Multi-stage `Dockerfile` for the Next.js app + a compose service so `docker compose up` runs the full stack (db + app).

## 9. Success Criteria

1. Fresh clone → `pnpm install && pnpm setup:dev && pnpm dev` yields a working, seeded app.
2. Email/password and OAuth login both work; sessions persist across refresh.
3. A MEMBER cannot invite members or delete projects; enforced server-side.
4. New task comments appear on other sessions without a manual refresh (SSE).
5. Attachments upload, validate, and stream back for authorized users.
6. Unit tests + smoke script pass.
7. Optional: full stack boots from a single `docker compose up`.
