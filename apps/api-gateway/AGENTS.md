# AGENTS.md — `@app/api-gateway`

## What this service is

The HTTP entry point. Fastify-based. Ships as a container image to GHCR. **Never** published to npm — it's listed in `.changeset/config.json` `ignore`.

## Invariants

1. **No business logic here.** This service routes and validates; domain work lives in `packages/*` or downstream workers.
2. **Boot fails loudly.** Any env-var failure throws `ConfigValidationError` and the process exits non-zero.
3. **Graceful shutdown.** `SIGINT`/`SIGTERM` close Fastify cleanly before exit. Don't add `process.exit(0)` anywhere else.
4. **Healthcheck contract.** `GET /health` must return `HealthCheck` from `@pkg/types`. The shape is the cross-service contract.
5. **Bundle externally.** Heavy deps (`fastify`, `pino`, `zod`, `pg`) are external — the container's node_modules dedupes them.

## Commands

```bash
pnpm -F @app/api-gateway dev          # tsx watch
pnpm -F @app/api-gateway test
pnpm -F @app/api-gateway build
pnpm -F @app/api-gateway type-check
```

## Common tasks

### Add a route

1. Create `src/routes/<name>.ts` exporting `async function register(app: FastifyInstance): Promise<void>`.
2. Call it from `buildApp` in `app.ts` (between `helmet` and `/health`).
3. Validate request bodies with zod schemas.
4. Add tests using `app.inject` — no HTTP socket needed.

### Add a new env var

1. Extend the schema in `src/config.ts`.
2. Document it in `README.md`.
3. Update `docker/.env.example` if present.

## Out of scope

- Database access in routes — proxy to a domain package instead.
- Long-running work — push to a queue (`@app/worker`).
- Changing the Fastify version — that's a workspace-wide change (catalog).
