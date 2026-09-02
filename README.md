# Team Project Hub

A full-stack team collaboration platform built with Next.js, TypeScript, Prisma, PostgreSQL, and Better Auth.

The project is also used as a practical environment for learning and applying modern development infrastructure concepts, especially Docker and Docker Compose.

---

## Tech Stack

### Application

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- pnpm

### Backend & Data

- Prisma 7
- PostgreSQL 16
- Better Auth

### Infrastructure

- Docker
- Docker Compose

---

## Architecture

The current development environment intentionally does not containerize the Next.js application.

Instead, the application runs directly in WSL while PostgreSQL runs inside Docker.

```text
┌──────────────────────────────┐
│            Browser           │
│       localhost:3000         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Next.js 16          │
│          WSL / Host          │
└──────────────┬───────────────┘
               │
               │ Prisma
               │ localhost:5432
               ▼
┌──────────────────────────────┐
│           Docker             │
│                              │
│  ┌────────────────────────┐  │
│  │      PostgreSQL 16     │  │
│  │       tp-hub-db        │  │
│  └────────────┬───────────┘  │
│               │              │
│        tp_hub_pgdata         │
│          (volume)            │
└──────────────────────────────┘
````

### Why this setup?

Docker is used where it provides clear value: running PostgreSQL in an isolated, reproducible environment.

The Next.js development server remains outside Docker for now to keep the development workflow simple.

The application may be containerized later when production-like deployment or a fully containerized development environment becomes relevant.

---

## Project Structure

```text
team-project-hub/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
├── src/
│
├── .env
├── .env.example
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
└── README.md
```

---

## Prerequisites

Make sure the following are installed:

* Node.js
* pnpm
* Docker
* Docker Compose

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create `.env` from the example:

```bash
cp .env.example .env
```

The development database configuration should point to PostgreSQL exposed by Docker:

```env
DATABASE_URL="postgresql://tp_hub:tp_hub_dev@localhost:5432/tp_hub?schema=public"
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

Check the service:

```bash
docker compose ps
```

PostgreSQL should eventually report:

```text
healthy
```

### 4. Run Prisma migrations

```bash
pnpm exec prisma migrate dev
```

This creates/updates the database schema according to the Prisma migrations.

### 5. Start Next.js

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

---

## Docker Commands

### Start services

```bash
docker compose up -d
```

### Check services

```bash
docker compose ps
```

### View logs

```bash
docker compose logs
```

### Follow PostgreSQL logs

```bash
docker compose logs -f postgres
```

### Stop services

```bash
docker compose stop
```

This stops the containers without removing them.

### Start stopped services

```bash
docker compose start
```

### Remove containers and network

```bash
docker compose down
```

The PostgreSQL named volume is preserved by default.

### Remove containers, network, and volumes

```bash
docker compose down -v
```

> ⚠️ This removes the PostgreSQL volume and therefore deletes the local database data.

---

## Database

PostgreSQL is configured through Docker Compose.

### Connection

```text
Host:     localhost
Port:     5432
Database: tp_hub
User:     tp_hub
```

### Verify the database

Using `psql`:

```bash
psql -h 127.0.0.1 -p 5432 -U tp_hub -d tp_hub
```

List tables:

```sql
\dt
```

---

## Database Schema

The current Prisma schema contains:

* User
* Account
* Session
* Verification
* Workspace
* WorkspaceMember
* Project
* Task
* TaskComment
* Attachment

Prisma also maintains the `_prisma_migrations` table to track applied migrations.

---

## Authentication

Authentication is handled by Better Auth.

The current application supports the basic authentication flow, including user registration and login.

OAuth providers are configured as optional environment variables:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Development Philosophy

This project follows a pragmatic approach to tooling.

Docker is not used simply because the project can be containerized.

Instead, each tool should solve a concrete problem:

* Docker → isolated and reproducible infrastructure
* PostgreSQL → application database
* Prisma → database schema and migrations
* Next.js → application framework
* Better Auth → authentication

The goal is to understand **why** each technology is used, not simply how to configure it.

---

## Current Infrastructure

```text
Docker Compose
│
├── postgres
│   ├── Image: postgres:16-alpine
│   ├── Container: tp-hub-db
│   ├── Port: 5432
│   ├── Volume: tp_hub_pgdata
│   └── Healthcheck: pg_isready
│
└── Network
    └── team-project-hub_default
```

---

## Development Roadmap

### Infrastructure

* [x] Run PostgreSQL with Docker
* [x] Configure persistent Docker volume
* [x] Configure Docker Compose
* [x] Connect WSL application to Docker PostgreSQL
* [x] Verify Prisma migrations
* [x] Verify authentication against the database
* [ ] Add application Dockerfile
* [ ] Containerize Next.js
* [ ] Multi-stage production build
* [ ] Production-oriented Docker Compose setup

### Application

* [x] Authentication foundation
* [x] Database schema
* [x] Prisma migrations
* [ ] Workspace management
* [ ] Project management
* [ ] Task management
* [ ] Comments
* [ ] Attachments
* [ ] Team collaboration features

---

## Useful Commands

### Development

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
```

### Prisma

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
pnpm exec prisma studio
```

### Docker

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose stop
docker compose start
docker compose down
```

---

## License

This project is currently for learning and development purposes.