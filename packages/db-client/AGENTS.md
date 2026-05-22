# AGENTS.md — `@pkg/db-client`

## What this package is

The Postgres client wrapper. Owns the pg-pool lifecycle so consumers get pooling, healthcheck, and shutdown hooks for free.

## Invariants

1. **One pool per service.** Never call `createDbClient` more than once per process. Stash the result in a module-level singleton.
2. **`pg` is lazy.** This package must remain importable without `pg` installed (the dynamic `import('pg')`).
3. **Always set `applicationName`.** Visible in `pg_stat_activity` — invaluable for incident triage.
4. **Statement timeout must default to ≤ 30s** — long queries that need it must override explicitly.

## Commands

```bash
pnpm -F @pkg/db-client build
pnpm -F @pkg/db-client test
pnpm -F @pkg/db-client type-check
```

## Common tasks

### Wire a transaction helper

Add `withTransaction(fn)` that acquires a client from the pool, runs `BEGIN`/`COMMIT`/`ROLLBACK`, and releases. Add tests using Testcontainers PG.

### Expose drizzle's query API

Re-export `drizzle` factory bound to the pool. This is intentionally deferred until the first consumer needs it.

## Out of scope

- ORM choice. drizzle is locked in.
- Migrations. Use drizzle-kit in the consumer service.
- Read replicas. Add per-service if/when needed.
