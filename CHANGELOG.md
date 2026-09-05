# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-stage `Dockerfile` for the Next.js app with standalone output.
- `migrate` and `app` services in `docker-compose.yml` with a healthcheck and a
  dedicated uploads volume.
- Standard repository files: `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, and GitHub issue/PR
  templates.

## [0.1.0] - 2026-09-05

### Added

- Next.js 16 application scaffold with TypeScript, Tailwind CSS, and pnpm.
- Dockerized PostgreSQL 16 via Docker Compose with a named data volume.
- Prisma 7 schema for the core domain models (User, Workspace, Project, Task,
  TaskComment, Attachment) plus Better Auth models, with migrations and an
  idempotent seed.
- Better Auth email/password and OAuth (GitHub, Google) authentication with
  login/signup pages and a protected application shell.
- Role-based authorization for workspaces (OWNER / ADMIN / MEMBER) with a
  capability matrix.
- Workspace CRUD, joining by slug, and member management (invite, role change,
  removal).
- Project grid, task board with TODO / IN_PROGRESS / DONE columns, and task
  detail pages with priority, assignee, and due date.
- Task comments with a live SSE stream and heartbeat.
- Attachment uploads with MIME/size allowlists and authorized downloads.
- Vitest unit tests (authz, validation schemas, comment stream) and an
  in-process database smoke suite for server actions.
- Zod validation schemas shared across all server actions.

### Security

- Server-side re-checks of membership and role before every mutation.
- Upload allowlist for file types and a 5 MB size cap.
- Attachment download route enforces workspace membership.
