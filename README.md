# Nebula

**Production-ready JavaScript/TypeScript boilerplate.**

Nebula ships with authentication, observability, background infrastructure, and developer tooling pre-wired, so you can skip the setup grind and start building features on day one.

> **Note:** This boilerplate is **InversifyJS IoC-controlled** - see `container.ts`.

---

## Table of Contents

- [Stack Overview](#stack-overview)
- [Dependency Injection Container](#dependency-injection-container)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Commands](#database-commands)
- [Testing & Validation](#testing--validation)
- [Monitoring](#monitoring)
- [Port Map](#port-map)
- [Quick Start Summary](#quick-start-summary)

---

## Stack Overview

| Layer                    | Technology                                           |
| ------------------------ | ---------------------------------------------------- |
| Language                 | TypeScript                                           |
| Runtime                  | Node.js                                              |
| Framework                | Express                                              |
| Database                 | PostgreSQL                                           |
| ORM                      | Drizzle                                              |
| Dependency Injection     | InversifyJS                                          |
| Cache / Queue / Sessions | Redis                                                |
| Validation               | Zod                                                  |
| Auth                     | JWT + Cookies + Google OAuth                         |
| Email Delivery           | Resend                                               |
| SMS                      | Twilio                                               |
| Logging                  | Pino + request logger middleware, Winston (for Loki) |
| Rate Limiting            | express-rate-limit + Redis-backed store              |
| Testing                  | Vitest + Supertest                                   |
| Dev Tooling              | Husky, Commitlint, Prettier, ESLint                  |
| Containers               | Docker + Docker Compose                              |
| Monitoring               | Prometheus + Grafana + Loki                          |

---

## Dependency Injection Container

Dependencies are wired via **InversifyJS**, configured in `container.ts`.

---

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Environment Files

For local, non-Docker development:

```bash
cp .env.example .env
```

For Docker-based local/production-like setup, create a Docker environment file:

```bash
cp .env.example .env.production.local
```

> **Important:** The Docker Compose setup reads `./.env.production.local` for the app service (`env_file: ./.env.production.local`).

### 3. Run in Development Mode

```bash
pnpm dev
```

This starts the app with `tsx --watch ./src/index.ts` and listens on the configured `PORT` value from `.env` (default: `3000`).

### 4. Run a Production Build Locally

Build the app:

```bash
pnpm build
```

Run the compiled server:

```bash
PORT=3000 node dist/index.mjs
```

Or, with a `.env` file loaded automatically from your shell environment:

```bash
node dist/index.mjs
```

### 5. Run with Docker

Start the full stack (API + Postgres + Redis + RedisInsight + Prometheus + Grafana + Loki):

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d
```

Stop everything:

```bash
docker compose down
```

---

## Environment Setup

Copy the example environment file and configure your secrets:

```bash
cp .env.example .env
```

**Key values include:**

| Variable                    | Purpose                          |
| --------------------------- | -------------------------------- |
| `PORT`                      | App server port                  |
| `NODE_ENV`                  | Runtime environment              |
| `DATABASE_URL`              | PostgreSQL connection string     |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection                 |
| `JWT_ACCESS_TOKEN_SECRET`   | JWT access token signing secret  |
| `JWT_REFRESH_TOKEN_SECRET`  | JWT refresh token signing secret |
| `RESEND_API_KEY`            | Email delivery via Resend        |
| `GOOGLE_CLIENT_ID`          | Google OAuth                     |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth                     |
| `GOOGLE_AUTH_REDIRECT_URI`  | Google OAuth redirect            |
| `TWILIO_ACCOUNT_SID`        | SMS via Twilio                   |
| `TWILIO_AUTH_TOKEN`         | SMS via Twilio                   |

---

## Database Commands

Generate Drizzle schema artifacts:

```bash
pnpm db:generate
```

Apply migrations:

```bash
pnpm db:migrate
```

Push schema directly:

```bash
pnpm db:push
```

Seed data:

```bash
pnpm db:seed
```

---

## Testing & Validation

```bash
pnpm test
pnpm check:types
pnpm check:lint
```

---

## Monitoring

### Setup

1. Ensure Grafana, Prometheus, and Loki are running — Docker Compose brings them up on the ports listed below.
2. From the `terraform/` folder, run:

```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

> **Note:** The Terraform provider used is the Grafana provider, and the modules rely on JSON dashboard templates in the repo. Terraform creates the dashboard resources in the target Grafana instance.

### Viewing Metrics and Logs

This boilerplate wires Prometheus and Grafana together, so you get metrics and logs out of the box when running the Docker stack.

**Default Docker Compose UI ports:**

| Service      | URL                   | Notes                                                                                                 |
| ------------ | --------------------- | ----------------------------------------------------------------------------------------------------- |
| Grafana      | http://localhost:3005 | Dashboards created by Terraform live here. Default credentials: `admin:admin` (included Docker image) |
| Prometheus   | http://localhost:9090 | Explore metrics, run ad-hoc queries                                                                   |
| Loki         | http://localhost:3100 | Log aggregation                                                                                       |
| RedisInsight | http://localhost:5540 | Inspect Redis data                                                                                    |

---

## Port Map

| Service        | Address                       |
| -------------- | ----------------------------- |
| App server     | http://localhost:3000         |
| ↳ Health check | http://localhost:3000/health  |
| ↳ Metrics      | http://localhost:3000/metrics |
| PostgreSQL     | localhost:5432                |
| Redis          | localhost:6379                |
| RedisInsight   | http://localhost:5540         |
| Prometheus     | http://localhost:9090         |
| Grafana        | http://localhost:3005         |
| Loki           | http://localhost:3100         |

---

## Quick Start Summary

**Shortest path to running the project locally:**

```bash
pnpm install
pnpm --filter emails run build:package
cp .env.example .env
pnpm dev
```

**Shortest path to the full Docker stack:**

```bash
cp .env.example .env.production.local
docker compose up
```
