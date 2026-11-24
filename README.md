# NexusERP Monorepo

Multi-tenant ERP backend monorepo powered by **Turborepo**, **pnpm**, **NestJS (Fastify)**, **Prisma 7 + PostgreSQL 18**, **Redis 7**, and **Better Auth Organizations**.

## Workspace Architecture

- `apps/api` (`@erp/api`): High-performance NestJS API running on Fastify with Better Auth authentication, organization RBAC, Redis caching/session storage, and tenant-isolated endpoints.
- `packages/db` (`@erp/db`): Prisma 7 + `@prisma/adapter-pg` database package with an `AsyncLocalStorage` `TenantContext` and Prisma `$extends` client extension enforcing automatic `organizationId` isolation across tenant-scoped models.
- `packages/typescript-config` (`@erp/typescript-config`): Shared TypeScript presets (`base.json`, `library.json`, `nestjs.json`) consumed by all workspace packages.

## Quick Start

1. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Set a strong random `BETTER_AUTH_SECRET` (32+ chars) in `.env` for production deployments.

2. **Start PostgreSQL 18 and Redis 7**
   ```bash
   docker compose up -d
   ```

3. **Install dependencies & generate Prisma Client**
   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   ```

4. **Run the API in development or production**
   ```bash
   pnpm dev
   # or
   pnpm build && pnpm start
   ```

## Key API Endpoints

- `GET /` — Public service info & endpoint discovery.
- `GET /api/v1/health` — Public PostgreSQL 18 & Redis 7 health probe.
- `/api/auth/*` — Better Auth endpoints (sign-up, sign-in, session, organization creation, invitations, member role management, and `set-active` organization).
- `GET /api/v1/me` — Authenticated user profile and organization memberships.
- `GET /api/v1/tenants/current` — Active tenant organization overview and settings (auto-provisioned per organization).
- `PATCH /api/v1/tenants/settings` — Update tenant settings (`owner` / `admin` roles only), invalidates Redis cache and records an `AuditLog`.
- `GET /api/v1/tenants/audit-logs` — Paginated tenant-scoped audit trail (`owner` / `admin` roles only).
