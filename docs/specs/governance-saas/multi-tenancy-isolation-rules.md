---
title: Multi-Tenancy Isolation Rules
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://www.postgresql.org/docs/current/ddl-schemas.html
  - https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - https://www.rfc-editor.org/rfc/rfc9562
  - https://martinfowler.com/articles/multi-tenant-microservice.html
  - https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
  - https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/data-residency
---

# Multi-Tenancy Isolation Rules

The architecture spec (`docs/specs/.../multi-tenancy.md`, TBD) describes the *shape*: schema-per-tenant for tenant data, shared schema for platform metadata. This document describes the **rules** every developer in this repo must follow when writing or reviewing code that touches tenant data.

Violating these rules creates the most expensive kind of bug in a SaaS: **cross-tenant data leakage**. We treat them with the same gravity as auth bypass.

---

## 1. Tenant ID must be set on every request before any DB call

The flow:

1. **Gateway** resolves tenant from auth context (session token → user → primary tenant; or explicit `X-Tenant-Id` header for admin tooling that allow-lists this header).
2. **`@pkg/tenancy`** middleware stores tenant ID in an AsyncLocalStorage context tied to the request.
3. **`@pkg/db-client`** reads from that ALS context on every `getClient()` call and either:
   - sets `search_path = tenant_<uuid>, public` for the connection's lifetime in this request, **or**
   - sets `SET LOCAL app.tenant_id = '<uuid>'` for use by RLS (row-level security) policies on shared tables.
4. **If ALS context has no tenant**, `getClient()` throws `MissingTenantError`. The request never reaches a query.

Code rule: **never `pool.query(...)` directly from app code**. Always `dbClient.query(...)` via `@pkg/db-client`. ESLint's `no-restricted-imports` blocks `pg` and `postgres-js` from `apps/*` source.

```ts
// BAD — bypasses tenant check
import pg from 'pg'
const pool = new pg.Pool(...)
const rows = await pool.query('SELECT * FROM invoices')

// GOOD — tenant context applied automatically
import { db } from '@pkg/db-client'
const rows = await db.query('SELECT * FROM invoices')
// Under the hood: SET search_path = tenant_<uuid>, public
```

For background jobs / Kafka consumers / Temporal activities — the tenant comes from the **message envelope**, not from a request. The first line of the handler:

```ts
import { withTenant } from '@pkg/tenancy'

export async function handleInvoiceIssued(event: InvoiceIssued) {
  await withTenant(event.tenantId, async () => {
    // all DB calls inside this scope are tenant-scoped
  })
}
```

`withTenant` enters the ALS scope. No tenant ID in the envelope → reject the message (log + DLQ + alert).

---

## 2. Cross-tenant queries are forbidden in app code

Three legitimate places to query across tenants — and only three:

1. **`platform` schema** — shared metadata: `platform.tenants`, `platform.users`, `platform.feature_flags`. Queries here do not need a tenant context.
2. **Admin tooling** — flagged by explicit code path (`@internal/admin-tools`) and audited per query. Every cross-tenant query writes a row to `audit.admin_queries` (who, when, what, why-ticket).
3. **Analytics pipeline** — reads from per-tenant schemas via ETL jobs that publish into a `analytics` schema (one row per tenant per metric per period). App code reads from `analytics`, not from per-tenant schemas.

A query that does `FROM tenant_<uuid1>.x JOIN tenant_<uuid2>.y` from app code is a bug. The reviewer rejects the PR.

Detection: a CI job scans for the pattern `tenant_[a-f0-9-]+\.` in source and fails if found outside `@internal/admin-tools` or `analytics-pipeline`.

---

## 3. Tenant deletion playbook

A tenant deletion is **irreversible** beyond a 30-day grace window. The playbook:

1. **Mark `platform.tenants.deleted_at = now()` and `status = 'deleting'`.** The gateway now rejects requests with `410 Gone`.
2. **Quiesce workloads**: pause Temporal workflows owned by the tenant (search attribute `tenantId == <uuid>` → `terminate` with reason `tenant-deleted`). Pause Kafka consumers from acting on this tenant (filter at the boundary).
3. **Backup** the tenant schema: `pg_dump --schema=tenant_<uuid>` to WORM storage with a 30-day retention; record the hash + location in `audit.tenant_deletions`.
4. **Wait 30 days** (status `deleting`). During this window any privileged operator can restore by reverting `deleted_at` and re-running the workflow resumes.
5. **At T+30**, run the destructor: `DROP SCHEMA tenant_<uuid> CASCADE`. Remove blob objects in object storage matching the tenant's prefix. Remove search indexes scoped to the tenant.
6. **Retain audit data** for the regulatory retention window (default 7 years; configurable per tenant per region for GDPR-erasure cases). Audit data lives in `audit` schema with `tenant_id` column — it is **not** in the per-tenant schema, so it survives the `DROP`.
7. **Record completion** in `audit.tenant_deletions.completed_at`.

This is **never** done by hand. The runbook is implemented as a Temporal workflow (`tenant-deletion`) — it's a textbook case for §1 of `temporal-when-and-when-not.md`.

---

## 4. Tenant migration (schema move) playbook

When you need to move a tenant's data — region migration, hardware migration, schema-name rename — the playbook is similar to deletion but ends in a new schema, not nothing.

1. **Mark tenant `status = 'migrating'`**; gateway returns `503 Retry-After` for writes, allows reads (or, for hard cutover, blocks both).
2. **Snapshot source**: `pg_dump --schema=tenant_<uuid>` + Kafka topic offsets + Temporal workflow state (use `WorkflowService.ListWorkflowExecutions` filtered by `tenantId`).
3. **Restore at target**: `psql --set ON_ERROR_STOP=1` of the dump into the new cluster's schema name (`tenant_<uuid>` is stable across clusters; we do not rename per cluster).
4. **Reconcile**: replay any Kafka events that arrived during the cutover window into the target; verify counts match (`SELECT count(*) FROM tenant_<uuid>.<each table>` source vs target).
5. **Switch routing**: update `platform.tenants.cluster_id` to point at the new cluster. The gateway's tenant resolver re-reads this on every request (TTL ≤ 30s).
6. **Resume workloads**; mark `status = 'active'`.
7. **Wait for confidence window** (typically 24h) before dropping source schema. Until then, source is **read-only** standby.

Like deletion, this is a Temporal workflow. The activities are idempotent so partial failures resume cleanly.

---

## 5. Test fixture pattern — per-test tenant + truncation

Integration tests must not share tenant data. The pattern, implemented in `@internal/test-utils`:

```ts
import { withTestTenant } from '@internal/test-utils'

test('invoice issuance creates row', async () => {
  await withTestTenant(async (tenant) => {
    // schema tenant_<random> is created + migrated in setup
    const result = await issueInvoice({ tenantId: tenant.id, amount: 100 })
    expect(result.isOk()).toBe(true)
    const rows = await db.query('SELECT * FROM invoices')
    expect(rows).toHaveLength(1)
  })
  // schema is DROPPED in teardown
})
```

Rules:

- **Each test gets a fresh tenant** unless the test is explicitly testing cross-tenant isolation (in which case it creates two and asserts no leakage).
- **TRUNCATE between tests within the same tenant** is acceptable for performance — but only for tests grouped under a shared `describe` block with an explicit `beforeAll`/`afterAll`.
- **Migrations run once per test process**, not per test. `withTestTenant` creates a fresh schema by `CREATE SCHEMA ... LIKE template_tenant` from a pre-migrated template.
- **Parallel test execution is allowed** — schema names are random UUID v7, so no collision.

---

## 6. Background work — tenant context propagation

For every async path that processes per-tenant data:

- **Kafka producer**: every event MUST carry `tenantId` in the CloudEvents extension attribute `tenantid` AND in the payload. Schema registry enforces this for all `*.v1` topics scoped to a tenant.
- **Kafka consumer**: first thing the handler does is `withTenant(event.tenantId, …)`. Anything else is a bug.
- **Temporal workflow**: `tenantId` is set as a search attribute on workflow start, AND passed as the first argument. Activities read it from workflow input, never from "ambient" context (Temporal workflows don't share Node ALS with the calling RPC).
- **HTTP client between services**: propagate `X-Tenant-Id` (the gateway adds it) and re-bind on receipt. Do not trust client-sent `X-Tenant-Id` at the public edge — only at internal hops.

---

## 7. Audit log

Every state change in a tenant schema writes an audit row to `audit.events`:

```sql
CREATE TABLE audit.events (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id    UUID NOT NULL,
  actor_id     UUID,             -- user; null for system actions
  actor_kind   TEXT NOT NULL,    -- 'user' | 'system' | 'admin'
  action       TEXT NOT NULL,    -- 'invoice.issued' | 'tenant.deleted' | …
  resource     TEXT NOT NULL,
  resource_id  TEXT NOT NULL,
  diff         JSONB,
  trace_id     TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_hash    BYTEA,            -- hash chain over (tenant_id, occurred_at, id, ...)
  hash         BYTEA NOT NULL
);
```

- Hash-chained for tamper evidence.
- Replicated to ClickHouse for analytics + to WORM object storage for compliance.
- Cross-tenant audit queries are allowed inside `@internal/admin-tools` only.

---

## 8. Defensive defaults

- **`@pkg/db-client` refuses to issue a query without an active tenant or an explicit `withPlatform()` scope.**
- **Tests that bypass the tenant context throw** in the test runner unless wrapped in `withTestTenant` or `withPlatform`.
- **ORM models** (if any are introduced — currently raw SQL + Zod) are decorated with a `@Tenant()` macro that fails compile if missing.
- **Backups** are per-schema, not per-cluster. A "restore tenant X to last Tuesday" is a single command, not a full cluster restore.
- **Region pinning**: `platform.tenants.region` is immutable from app code; changes go through the migration playbook (§4). This is the data-residency control point (e.g., EU tenants stay in EU schemas; see Microsoft's data residency considerations doc in references).

---

## 9. Detection — what triggers an incident

Any of these is a P1 incident:

- A row exists where the tenant ID column doesn't match the schema's tenant.
- A user (non-admin) issues a request that returns data from a tenant they don't belong to.
- An admin query is run without an `audit.admin_queries` row.
- `MissingTenantError` rate spikes (suggests a code path bypassing the middleware).
- An app log emits a tenant ID that doesn't match `RequestContext.tenant`.

We instrument these with metric counters in `@pkg/tenancy` and alert via Prometheus.

---

## 10. The shortest summary

If you remember nothing else: **tenant context is set at the boundary, propagated through ALS / message envelopes / workflow inputs, and asserted at every DB call.** No app code constructs a raw connection. No query crosses a tenant boundary outside `platform` or `analytics` or `@internal/admin-tools`. Every cross-tenant action — by any human or system — leaves a row in `audit`.
