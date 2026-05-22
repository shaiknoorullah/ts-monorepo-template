# AGENTS — @app/cms

Self-hosted Payload CMS 3.

## Hard rules

- **This is the ONE Next.js app.** No other app in this monorepo may
  import Next.js — see ADR 0010 and ADR 0013.
- **Schema changes go in `src/collections/*.ts`**. After every change,
  run `pnpm generate:types` and commit the regenerated
  `src/payload-types.ts`.
- **Never store passwords in plaintext or weaker than argon2id.** The
  `Users` `beforeChange` hook is load-bearing — do not remove without
  replacing with the Kratos-backed flow.
- **Media uploads go to R2** via `@payloadcms/plugin-cloud-storage`.
  Local dev uses the MinIO container in `docker/cms.compose.yml`.
- **Migrations are not auto-applied in prod.** Payload's
  `db-postgres` will warn — `payload migrate` is the correct command,
  triggered manually from a CI job (TODO: workflow).

## When adding a collection

1. New file in `src/collections/`.
2. Reference it from `payload.config.ts`.
3. Add it to the multi-tenant plugin map if it should be per-tenant.
4. `pnpm generate:types`; commit the result.
5. If it has uploads, declare `imageSizes` and `mimeTypes`.

## When changing auth

- Bump `migrationStatus` enum cautiously — Kratos migration is the
  only documented exit. Do not invent new states.
- Argon2 parameters in `Users.ts` follow OWASP 2024. Bump only after
  benchmarking on the production node class.

## Out of scope here

- Sending email — handled by the SaaS-commons stack.
- File CDN cache invalidation — Worker (TODO: `cf-cms-cdn`).
- Internationalization — Payload 3 supports it; not yet wired.
