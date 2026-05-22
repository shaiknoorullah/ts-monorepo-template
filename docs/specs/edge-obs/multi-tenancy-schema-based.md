---
title: Multi-Tenancy — Schema-Per-Tenant in Postgres
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://www.postgresql.org/docs/16/ddl-schemas.html
  - https://www.postgresql.org/docs/16/runtime-config-client.html#GUC-SEARCH-PATH
  - https://www.pgbouncer.org/config.html#pooling-mode
  - https://atlasgo.io/versioned/intro
  - https://www.postgresql.org/docs/16/ddl-rowsecurity.html
  - https://orm.drizzle.team/docs/schemas
  - https://www.postgresql.org/docs/16/sql-set-role.html
  - https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres
---

# Multi-Tenancy — Schema-Per-Tenant in Postgres

## TL;DR

We isolate tenants by giving each one a **Postgres schema** (`tenant_<id>`), keep one **shared** schema for cross-tenant data (auth, billing, audit), and switch tenants by setting `search_path` at the **transaction** scope. Connection pooling is **session-mode pgbouncer** or **pgcat** with per-tenant pools — never transaction-mode against tenant search_path.

## Why schema-per-tenant (not row-level)?

Three isolation strategies exist:

| Strategy | Isolation | Ops cost | Migration cost | Blast radius |
|---|---|---|---|---|
| Single schema + RLS (`tenant_id` column + `CREATE POLICY`) | Logical | Lowest | Single migration | High — one bad query exposes all tenants |
| **Schema-per-tenant** | Logical, hard via `search_path` | Medium | N tenants × M migrations | Per-tenant |
| Database-per-tenant | Physical | Highest | N migrations × N pools | Per-tenant; full noisy-neighbor isolation |

RLS ([Postgres RLS docs](https://www.postgresql.org/docs/16/ddl-rowsecurity.html)) is operationally cheap but has known footguns:

1. **`BYPASSRLS` privilege drift** — any role granted `BYPASSRLS` (or `SUPERUSER`, `pg_signal_backend`) sees everything. One misconfigured role and tenant isolation evaporates.
2. **Index selectivity** — `WHERE tenant_id = $1` must be the leading column of every relevant index. Forget once → seq scan → noisy-neighbor.
3. **`COPY`, `pg_dump`, logical replication** — these honor RLS only with specific flags; the default is permissive.
4. **Constraint exclusion failures** — partitioning by tenant_id helps, but introduces planning overhead at high tenant counts.
5. **Application-layer leaks** — joins to non-RLS tables, `EXPLAIN ANALYZE` output, error messages, all can spill rows.

Schema-per-tenant trades these for two manageable costs:
- **Migrations run N times**. Atlas + concurrency + a migration runner make this routine.
- **Catalog bloat** — one row per table-per-tenant in `pg_class`. Postgres handles 100k+ relations fine but `\dt *.*` becomes slow. Beyond ~5k tenants we partition into Postgres **clusters**, not schemas in one cluster.

Schema-per-tenant gives us:
- **Hard isolation** by `search_path`. A query without the schema prefix referencing tenant data **fails outright** rather than returning the wrong rows.
- **Per-tenant backups** via `pg_dump -n tenant_<id>`.
- **Per-tenant `pg_stat_*` rollups** are trivial.
- **Per-tenant DROP** for offboarding — one statement.

For a SaaS template with 10s–1000s of tenants this is the sweet spot.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway (Envoy/Traefik)               │
│           - validates JWT, extracts `tid` claim                  │
│           - sets `x-tenant-id` header                            │
└──────────────────┬───────────────────────────┬──────────────────┘
                   │                           │
        ┌──────────▼──────────┐    ┌───────────▼──────────┐
        │  apps/api (Fastify) │    │   apps/worker        │
        │  - @pkg/tenancy hook│    │   - @pkg/tenancy ctx │
        │  - opens tx         │    │   - opens tx         │
        │  - SET LOCAL        │    │   - SET LOCAL        │
        │    search_path      │    │     search_path      │
        └──────────┬──────────┘    └───────────┬──────────┘
                   │                           │
        ┌──────────▼───────────────────────────▼──────────┐
        │   pgbouncer (SESSION mode) OR pgcat per-pool    │
        └──────────┬───────────────────────────┬──────────┘
                   │                           │
        ┌──────────▼──────────┐    ┌───────────▼──────────┐
        │  Postgres primary   │    │  Postgres replica    │
        │  schemas:           │    │   - read-only        │
        │   - public          │    │                      │
        │   - shared          │    │                      │
        │   - tenant_<id>...  │    │                      │
        └─────────────────────┘    └──────────────────────┘
```

### Schemas in each Postgres cluster

```
public          -- empty by convention; never used as a tenant schema
shared          -- cross-tenant: users, organizations, billing, audit, feature_flags
tenant_<id>     -- per-tenant: orders, invoices, files, etc.
ops             -- internal: schema_migrations, jobs, etc.
```

- `shared.users(id uuid pk, primary_email, ...)`, `shared.tenants(id uuid pk, slug, created_at, status, schema_name)`.
- `shared.audit_log` is **append-only** with a `tenant_id` discriminator; tenants never write to it directly (functions run as `SECURITY DEFINER`).

## Tenant resolution chain

1. **Edge** validates the JWT. Required claim: `tid` (tenant id, UUID).
2. Edge sets `x-tenant-id: <uuid>` header on the upstream request.
3. The Fastify request hook reads `x-tenant-id` and the validated `sub` claim, builds a `TenantContext`, and stores it on `request`.
4. Every DB operation acquires a connection from the pool, **opens a transaction**, runs `SET LOCAL search_path TO "tenant_<id>", shared, public;`, runs the queries, commits.
5. Background workers (BullMQ, Temporal) read `tenantId` off the job payload and do the same.

The **only** thing the application ever does to set tenant context is `SET LOCAL search_path` inside a transaction. No string-interpolated table names. No "tenant prefix on every query." If the search_path is wrong, the query errors with `relation "orders" does not exist` — fail-loud, not fail-silent.

## Connection pool considerations

This is the single biggest footgun. `SET LOCAL` is scoped to the **current transaction**, and `SET` (without LOCAL) is scoped to the **session**.

**Pgbouncer in `pool_mode = transaction`** rebinds the server connection to a different client every transaction. A `SET search_path` made on transaction A is **not visible** in transaction B — even from the same client. `SET LOCAL` works because it dies at commit, but you must ensure the SET and the queries are in the same `BEGIN ... COMMIT`. See [pgbouncer pooling-mode docs](https://www.pgbouncer.org/config.html#pooling-mode).

Two viable patterns:

### Pattern A — Session-mode pgbouncer

- `pool_mode = session`. One server connection per client until disconnect.
- Pool size must equal the application's connection cap.
- Simpler, but capacity-bound.

### Pattern B — Transaction-mode + per-tx `SET LOCAL`

- `pool_mode = transaction`. The driver wraps every tenant operation in a transaction.
- Every transaction begins with `SET LOCAL search_path TO ...`.
- Higher density (1 server : N clients).
- **Caveat**: prepared statements at the protocol level break in transaction mode unless using **PgBouncer 1.21+** which supports protocol-level prepared statements. Use it or fall back to plain `Query`.

We default to **B** with PgBouncer 1.21+ or **pgcat** ([pgcat repo](https://github.com/postgresml/pgcat)). pgcat additionally supports **per-database sharding by header**, which we keep in our back pocket for the day we move to database-per-tenant.

### Drizzle wiring (Pattern B)

```ts
// packages/tenancy/src/withTenant.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import type { Pool } from "pg";

export type TenantCtx = { tenantId: string; schemaName: string };

export async function withTenant<T>(
  pool: Pool,
  ctx: TenantCtx,
  fn: (tx: ReturnType<typeof drizzle>) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // SET LOCAL is the only correct form here.
    // Identifier quoting via format() to avoid injection from schema_name.
    await client.query(
      `SET LOCAL search_path TO ${quoteIdent(ctx.schemaName)}, shared, public`,
    );
    const db = drizzle(client);
    const result = await fn(db);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

function quoteIdent(s: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error(`invalid schema identifier: ${s}`);
  }
  return `"${s}"`;
}
```

### Fastify plugin

```ts
// packages/tenancy/src/fastify.ts
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenant: { tenantId: string; schemaName: string };
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    const tid = req.headers["x-tenant-id"];
    if (typeof tid !== "string" || !UUID_RX.test(tid)) {
      return reply.code(401).send({ error: "missing tenant" });
    }
    // schemaName lookup is cached (LRU); evict on tenant lifecycle event.
    const schemaName = await resolveSchema(tid);
    req.tenant = { tenantId: tid, schemaName };
  });
};
export default fp(plugin, { name: "tenancy" });

const UUID_RX = /^[0-9a-f-]{36}$/i;
```

## Migration strategy

Migrations come in two flavors:

1. **Shared schema migrations** — run once per cluster against `shared` and `ops`. Owned by `@pkg/db-shared-migrations`. Atlas ([atlasgo.io](https://atlasgo.io/versioned/intro)) versioned migrations.
2. **Tenant schema migrations** — every tenant schema has identical structure. Owned by `@pkg/db-tenant-migrations`. We run them with a parallel migration runner:

```ts
// scripts/migrate-tenants.ts
import pLimit from "p-limit";
import { listActiveTenants } from "./tenants";
import { runAtlasOnSchema } from "./atlas";

const limit = pLimit(8); // 8 concurrent migrations
const tenants = await listActiveTenants();
await Promise.all(
  tenants.map((t) =>
    limit(() =>
      runAtlasOnSchema({
        schema: t.schemaName,
        migrationsDir: "packages/db-tenant-migrations/migrations",
      }),
    ),
  ),
);
```

Each per-tenant migration runs in its own transaction with `SET LOCAL search_path` (Atlas understands `--schema` per invocation). Failures are recorded in `ops.tenant_migration_log(tenant_id, version, status, error)`. The runner is idempotent: re-running picks up where it stopped.

### Onboarding flow

```sql
-- ops.onboard_tenant(p_tenant_id uuid, p_slug text) RETURNS text
DO $$
DECLARE
  v_schema text := 'tenant_' || replace(p_tenant_id::text, '-', '_');
BEGIN
  EXECUTE format('CREATE SCHEMA %I', v_schema);
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO app_role', v_schema);
  INSERT INTO shared.tenants(id, slug, schema_name, status)
    VALUES (p_tenant_id, p_slug, v_schema, 'provisioning');
END $$;
```

Followed by:

1. `pnpm migrate:tenant --tenant <id>` — runs Atlas versioned migrations against the new schema.
2. `pnpm seed:tenant --tenant <id>` — seeds defaults from `packages/db-tenant-seed`.
3. `UPDATE shared.tenants SET status='active' WHERE id=$1`.

All three steps run inside a saga/workflow (Temporal) so partial failures roll back cleanly.

## Cross-tenant queries (audit, analytics)

Analytics never read from `tenant_*` schemas at runtime. We project to a **separate analytics path**:

- **Writes** → CDC via Debezium or `wal2json` → Kafka → ClickHouse/SigNoz.
- **Audit** → `shared.audit_log(id, tenant_id, actor, action, target, payload jsonb, at)`. Insert via `SECURITY DEFINER` function from any tenant context.
- **Cross-tenant materialized views** → live in `shared` and refresh on a schedule; queried by ops dashboards.

This keeps the tenant runtime path free of `UNION ALL` over N schemas. Anyone doing that has chosen the wrong tool.

## `@pkg/tenancy` public interface

```ts
// packages/tenancy/src/index.ts
export interface TenantContext {
  readonly tenantId: string;
  readonly schemaName: string;
  readonly userId: string;
  readonly roles: readonly string[];
}

export function getTenantContext(): TenantContext;     // AsyncLocalStorage
export function withTenantContext<T>(
  ctx: TenantContext,
  fn: () => Promise<T>,
): Promise<T>;

export async function withTenantTx<T>(
  pool: Pool,
  fn: (tx: PgTx) => Promise<T>,
): Promise<T>;                                          // uses ALS

export const fastifyTenancyPlugin: FastifyPluginAsync;
export const otelTenancyPropagator: TextMapPropagator; // attaches tid to spans
```

`AsyncLocalStorage` lets background workers, repository methods, and OTel processors all read the same context without threading it manually. The OTel propagator attaches `tenant.id` as a span attribute so SigNoz can filter traces per-tenant.

## Known footguns

1. **`SET` without `LOCAL`** in transaction-mode pgbouncer → silent cross-tenant leak. Lint rule: forbid `SET ` (without LOCAL) in app SQL.
2. **Prepared statements caching across tenants** — Postgres caches plans per-session; switching `search_path` invalidates only the relevant plans. With transaction-mode + protocol prepares (PgBouncer 1.21+) this is fine. With application-level prepared statement caches (pg-protocol clients) it is **not**; disable client cache or key on `tenantId`.
3. **`pg_dump -n tenant_<id>`** without `--no-acl --no-owner` will fail to restore into a different cluster with different roles. Use `--no-acl --no-owner` for backups intended for restore elsewhere.
4. **Postgres relation cache** grows with tenant count; tune `max_locks_per_transaction` if you do schema-wide operations.
5. **Cross-schema foreign keys** — never. Tenant schemas reference `shared.*` only one-way.

## When to migrate off schema-per-tenant

- > 5000 tenants → split into multiple Postgres clusters keyed by tenant range; introduce a router (Citus, pgcat sharding, or app-level).
- A single tenant's data > 200 GiB → carve it out into a database-per-tenant cluster on Contabo/Longhorn-heavy node.
- Per-tenant SLA requirements diverge → physical isolation is the simplest answer.

We stay on schema-per-tenant until one of those breaks.
