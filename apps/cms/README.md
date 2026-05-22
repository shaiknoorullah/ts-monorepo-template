# @app/cms

Self-hosted Payload CMS 3. Postgres backed, R2-backed media,
multi-tenant. Argon2id password hashing on top of Payload's
built-in auth, with a documented migration path to Ory Kratos.

This is the **one Next.js app** in the monorepo. Payload 3 mandates its
bundled Next.js — see `docs/adrs/0013-payload-cms-self-hosted.md`.

## Local dev

```bash
docker compose -f docker/cms.compose.yml up -d
open http://localhost:3001/admin
```

First boot: visit `/admin`, create the first user (becomes `admin`).

## Env vars

| Var                         | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `PAYLOAD_SECRET`            | JWT signing secret. Generate via `openssl rand -hex 32`.      |
| `PAYLOAD_PUBLIC_SERVER_URL` | Public origin (e.g. `https://cms.example.com`).               |
| `DATABASE_URI`              | Postgres connection string.                                   |
| `R2_BUCKET`                 | R2 / S3-compat bucket name.                                   |
| `R2_ENDPOINT`               | R2 endpoint (e.g. `https://<acct>.r2.cloudflarestorage.com`). |
| `R2_ACCESS_KEY_ID`          | R2 access key.                                                |
| `R2_SECRET_ACCESS_KEY`      | R2 secret.                                                    |
| `CORS_ORIGINS`              | Comma-separated allow-list.                                   |
| `CSRF_ORIGINS`              | Comma-separated CSRF allow-list.                              |

## Collections

| Slug      | Purpose                                                        |
| --------- | -------------------------------------------------------------- |
| `pages`   | Static pages (Pages router on the marketing app reads these).  |
| `posts`   | Blog posts.                                                    |
| `media`   | Uploads — stored in R2 via `@payloadcms/plugin-cloud-storage`. |
| `tenants` | Tenant metadata + theme override.                              |
| `users`   | Admin + editor + viewer roles. Argon2id hashes.                |

## Argon2id + Kratos migration

Today: every user has both a bcrypt hash (Payload built-in) and an
argon2id hash in `passwordHashArgon` (re-derived on create). The hook
in `src/collections/Users.ts` keeps both in sync.

When migrating to Ory Kratos:

1. Stand up Kratos with the same DB.
2. For each `users` row, transfer the argon2id hash directly — Kratos
   accepts argon2id natively (`hashing.algorithm: argon2`).
3. Flip `migrationStatus` to `migrating`, then `kratos`.
4. Switch admin auth to Kratos session JWT validation.

## Commands

| Command                   | What it does                      |
| ------------------------- | --------------------------------- |
| `pnpm dev`                | Next dev server on :3000          |
| `pnpm build`              | Next prod build                   |
| `pnpm generate:types`     | Regenerate `src/payload-types.ts` |
| `pnpm generate:importmap` | Regenerate the admin import map   |
