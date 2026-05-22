# `@pnats/event-journal` — R3 Alternative: OTel-Native + PG Outbox

> **Status:** Alternative design doc (R3) — 2026-05-22.
>
> **Companion to:** `2026-05-22-event-journal-package-design.md` (R2 — the explicit-decorator + twin-package approach).
>
> **Relationship:** R2 and R3 are **two valid architectures** for the same requirements. Pick one; don't try to merge them. Both extend Faizan's V1 (`journal.events`); they differ in HOW the V2 capture half is implemented.
>
> **R3's promise:** ~470 LoC + 2-3 engineer-weeks to production. R2's: ~5,000+ LoC + 6+ months. R3 trades explicit control for radical simplicity by leaning on the OTel + Beyla stack we already operate.

---

## 0. R2 vs R3 — which to pick

| Axis | R2 (explicit) | R3 (OTel-native) |
|---|---|---|
| Total project LoC | ~5,000+ | **~470** |
| Engineer-weeks to production | 6-12 months | **2-3 weeks** |
| Cross-language schema discipline | Twin packages + JSON Schema repo + JCS conformance CI | **OTel semconv with `journal.*` namespace** |
| Capture storage | `journal.captures` PG table (26 cols) | **OTel Logs Bridge → ClickHouse/SigNoz** |
| Audit storage | `journal.events` PG table (Faizan's V1) | **Same** — kept verbatim, with `pg_logical_emit_message` outbox |
| Per-language SDK | Hand-written client lib per language | **40-LoC shim per language** (attaches `journal.*` to active span) |
| MCP/SQL/Kafka capture | Hand-written wrapper per language | **Beyla eBPF auto-captures all** (with ~150 LoC Go contributed upstream for MCP gap) |
| Event-type accuracy | 100% (app declares) | 100% (decorator OR shim declares) |
| Replay mode (cassette/passthrough/partial) | Same engine | Same engine (reads from SigNoz API + PG) |
| When to pick this | App teams want full control + explicit types; budget for the long build | We trust OTel + Beyla + ClickHouse + want production fast |

**Recommendation:** ship R3. R2 stays as the fallback if any of the OTel/Beyla assumptions break in production.

---

## 1. Problem statement (UNCHANGED from R2)

Today, reconstructing what a service did during a request means hand-joining three independent log surfaces: Pino service logs, OTel traces (no bodies), Kafka topic dumps. None alone answers questions like *"this `POST /publish` failed — what SQL queries did we run, what did Apollo return, what did we emit to Kafka?"* or *"reproduce this customer's bug locally with the recorded request payload."*

OTel doesn't capture bodies by default. The journal does, with explicit PII redaction + size caps + S3 spill — but **R3 captures bodies via OTel Logs Bridge API (not span events — deprecated 2026)**, stored in ClickHouse/SigNoz, not a custom PG table.

---

## 2. Capacity plan (UNCHANGED from R2)

V1 audit log = ~100k/day → 25 GB/year (Faizan §2). V2 captures = ~320k/day → ~5.5 TB/year in ClickHouse. Steady-state PG footprint stays ~25 GB/yr because captures don't live there.

R2's V2 numbers were calculated for PG. In R3, the same data lives in ClickHouse instead — bigger raw size (~1.5-2× due to OTel-attribute encoding overhead) but ClickHouse's compression brings it back to parity or better. Spilled payloads in object storage at $0.015/GB ≈ negligible.

---

## 3. Storage decision — hybrid

### 3.1 `journal.events` stays in Postgres (audit-of-record)

Faizan's V1, untouched. Transactional commit with business writes. Multi-tenant RBAC at row level. Soft-delete forever. 7-year retention via `pg_partman`. This is the system-of-record for "who did what to which entity."

**Per the industry research (Team Gamma):** every well-instrumented org keeps audit-of-record in a separate dedicated store. SigNoz is "early-experimentation" for multi-tenancy. ClickHouse is mutable. PG is the canonical answer.

### 3.2 `journal.captures` MOVES to OTel Logs Bridge → ClickHouse/SigNoz

No PG table. Captures are emitted as **OTel Logs Bridge API records** with `event.name = '<capture_kind>'` and `journal.*` attributes. The OTel Collector routes them to ClickHouse via SigNoz.

**Per the industry research (Team Alpha):** OTel formally deprecated Span Events in 2026. Use the Logs Bridge API. Payloads in `event.body`. Attributes for everything else.

### 3.3 The cross-link

Both `journal.events` rows and Logs Bridge records carry the same `traceparent` / `request_id`. Replay + query verbs query BOTH and merge by `request_id`.

```sql
-- Same journal.events PG table as Faizan's V1 — unchanged
CREATE TABLE journal.events (...)
```

```jsonc
// OTel Logs Bridge record emitted for each capture
{
  "timestamp": "...",
  "trace_id": "...",
  "span_id": "...",
  "event": { "name": "http.outbound" },          // was capture_kind
  "body": {                                       // was payload
    "method": "POST",
    "url": "...",
    "request_body": "...",
    "response": "..."
  },
  "attributes": {
    "journal.tenant_id": "...",
    "journal.actor.kind": "USER",
    "journal.actor.id": "...",
    "journal.request_id": "...",
    "journal.parent_capture_id": null,
    "journal.idempotency_key": "...",
    "journal.payload_size_bytes": 4096,
    "journal.payload_spilled_to": null,  // or "s3://..." URI
    "journal.payload_content_hash": "sha256:...",
    "journal.service": "kaarbaaz",
    "journal.status": "completed",
    "messaging.destination.name": "...",    // OTel semconv (auto)
    "db.statement": "SELECT ...",            // OTel semconv (auto)
    "http.request.method": "POST"            // OTel semconv (auto)
  }
}
```

---

## 4. The `pg_logical_emit_message` outbox (NEW — the ONE Tier 2 piece adopted)

Per Team Delta's hybrid recommendation, R3 adopts ONE element of the rejected Tier 2 path: **use `pg_logical_emit_message` as the transactional outbox implementation for `journal.events`**.

### 4.1 Why

The atomicity constraint of audit-of-record is non-negotiable: business write + audit row must commit together. Two ways to achieve this:

| Approach | Cost | Audit |
|---|---|---|
| Same-tx INSERT to `journal.events` table | Same as V1; widely-precedented | Strong |
| `SELECT pg_logical_emit_message(true, 'journal', json)` then read via Debezium WAL consumer | Slightly higher (no PG table write directly) — uses Postgres's logical replication | Strict superset — message is in WAL, can be replayed |

`pg_logical_emit_message` is **the cleanest possible outbox**: no separate outbox table to clean up, message is in the same WAL position as the row change it accompanies, atomically committed with the business transaction.

### 4.2 Implementation

```ts
// inside the @JournalEvent decorator (or middleware)
async function recordEvent(envelope: JournalEnvelope, tx: PgConnection) {
  await tx.query(
    `SELECT pg_logical_emit_message(true, 'journal', $1::text)`,
    [JSON.stringify(envelope)]
  );
  // ALSO write to journal.events table as a redundancy (the WAL consumer reads logical message and writes to journal.events; this direct write makes it visible immediately without waiting for consumer)
  await tx.query(
    `INSERT INTO journal.events (id, tenant_id, idempotency_key, occurred_at, actor_kind, actor_id, event_type, entity_type, entity_id, summary, diff, correlation_id, metadata)
     VALUES (...) ON CONFLICT (tenant_id, idempotency_key, occurred_at) DO NOTHING`,
    [...]
  );
}
```

**Why both writes:**
- The direct INSERT makes the audit row visible to queries immediately (within the same transaction)
- The `pg_logical_emit_message` provides a Kafka-routable copy for downstream consumers (replication, cross-cluster audit mirror, analytics)
- If the direct INSERT fails (UNIQUE violation), the message is still in WAL — audit consumer dedups

### 4.3 Production gotchas (from Team Delta)

- `pg_logical_emit_message(transactional=true, ...)` — the message is invisible until COMMIT (correct behavior for outbox semantics)
- Long transactions hold the WAL position; size up the `wal_keep_size` accordingly
- Backpressure: if a logical-decoding consumer falls behind, WAL grows; monitor `pg_replication_slots.confirmed_flush_lsn`

### 4.4 WAL consumer (NEW — ~500 LoC Go)

A small Go service runs as a Deployment, consumes the `journal` logical replication slot, and:
1. Optionally writes the message to ClickHouse as a Logs Bridge record (for unified query)
2. Optionally pushes to Kafka for downstream auditors
3. Updates a Prometheus metric for WAL lag

This is the Debezium pattern simplified — we don't need full Debezium for just our `journal` prefix.

```go
// pseudocode
slot := pglogrepl.StartReplication("journal_slot", ...)
for msg := range slot.Messages() {
  if msg.Prefix == "journal" {
    envelope := parseJSON(msg.Content)
    emitOtelLogsBridge(envelope)       // mirror to SigNoz
    updateMetric("journal_wal_lag", msg.LSN)
  }
}
```

---

## 5. Idempotency (UNCHANGED from R2)

Same `idempotency_key` REQUIRED, same per-source natural keys table (Faizan §7), same SHA-256 fallback formula with `tenant_id` baked in, same `INSERT ... ON CONFLICT DO NOTHING` semantic.

**Important:** the idempotency check happens at the PG layer (via `UNIQUE INDEX` on `journal.events`). The OTel Logs Bridge captures have no UNIQUE constraint — they're append-only by design. Captures dedupe is best-effort (via `payload_content_hash` for spilled blobs).

---

## 6. Actor model (UNCHANGED from R2)

Faizan's 5-way discriminated enum (USER / SERVICE / WORKFLOW / CRON / AI) + `on_behalf_of_user_id` + `actor_display`. In R3, these become OTel attributes for captures and PG columns for events.

---

## 7. Payload handling — OTel Logs Bridge + S3 spill

### 7.1 Inline cap (256 KB) + spill
- Payloads ≤ 256 KB inline as `event.body` in the Logs Bridge record
- Payloads > 256 KB written to S3/R2/Azure Blob, URI in `journal.payload_spilled_to` attribute, body NULL
- `payload_content_hash` (SHA-256) enables dedup of duplicate blobs

### 7.2 PII redaction at the OTel Collector (NOT at the SDK)

**Critical insight from Team Beta:** Beyla can see raw payloads at the eBPF level. PII redaction MUST happen in the OTel Collector pipeline BEFORE the data reaches ClickHouse / S3 / any downstream.

```yaml
# OTel Collector pipeline
processors:
  - name: journal-redact
    config:
      registry_path: /etc/journal/redaction-registry.yaml
      apply_to:
        - log_body
        - log_attribute.event.body
        - span_attribute.http.request.body
        - span_attribute.db.statement
```

Default-deny on field names: `password`, `token`, `secret`, `authorization`, `cookie`, `api_key`, `bearer`, credit-card patterns. Per-tenant overrides supported.

### 7.3 Allow-listed headers

Default-deny. Allow-list: `User-Agent`, `Content-Type`, `X-Request-Id`, `X-Tenant-Id`, `X-Correlation-Id`, `Idempotency-Key`.

---

## 8. Retention — hybrid (UNCHANGED conceptually from R2)

| Surface | Policy | Mechanism |
|---|---|---|
| `journal.events` (PG) | Soft-delete after 18 months, never hard-delete | `pg_partman` monthly, Faizan's V1 retention job |
| OTel Logs Bridge captures (ClickHouse) | TTL per `event.name` (`http.outbound` = 30d, `sql.query` = 7d, etc.) | ClickHouse TTL on `Toscope` partitioning |
| Spilled payloads (S3) | Lifecycle policy mirroring per-event TTL | S3 lifecycle config |

For audit-grade long retention beyond 30 days, the WAL consumer also writes captures to a "cold archive" S3 bucket with WORM (Write-Once-Read-Many) lock. The Logs Bridge record in ClickHouse points to the cold copy via `journal.archive_uri` attribute.

---

## 9. Replay — three modes (UNCHANGED from R2)

Same three modes (cassette / passthrough / partial). **What changes:** the replay engine reads captures from the SigNoz query API (not a custom PG table) and audit context from PG. Otherwise identical: AsyncLocalStorage replay context, UUID/Date/RNG interception, etc.

Read pattern:
```ts
async function reconstructRequest(requestId: string) {
  const events = await pg.query(
    'SELECT * FROM journal.events WHERE correlation_id = $1',
    [requestId]
  );
  const captures = await signozClient.queryLogs({
    query: `attributes['journal.request_id'] = '${requestId}'`,
    sort: { field: 'timestamp', order: 'asc' },
  });
  return mergeByTimestamp(events, captures);
}
```

The test-fixture export CLI (`pnpm journal export <request_id> --as vitest-spec`) works identically.

---

## 10. Cross-service correlation (UNCHANGED from R2)

W3C Trace Context (native OTel) propagates `traceparent` headers across HTTP/Kafka/Temporal. The `journal.originating_request_id` attribute on Logs Bridge captures chains across services. `journal flow <request_id>` follows the chain via SigNoz query API.

---

## 11. Hard problems acknowledged (DELTA additions from R2)

- **Transactional outbox** — solved via `pg_logical_emit_message` + direct `journal.events` write in same tx
- **WAL backpressure** — monitored; if consumer falls behind, alerts + `wal_keep_size` autotune
- **Pooling-mode regression** — R3 doesn't depend on connection-pooler hooks; statement-pooling-mode is safe
- **PL/pgSQL-internal INSERTs invisible to Beyla** — captured via WAL (Debezium-style row events) as a complementary signal
- **Span Events deprecated** — R3 uses Logs Bridge API, future-proof per OTel 2026 roadmap
- **OTel SDK availability** — every language we run (TS, Python, Go) has a mature SDK; non-mature edge cases (e.g., COBOL services) are out of scope

---

## 12. Phased rollout — collapsed phases A-E

R2 had 9 phases (A-I). R3 collapses to 5:

| Phase | Scope |
|---|---|
| **A — Outbox + per-language shim** | `pg_logical_emit_message` write contract in V1 client; `@pnats/journal-attrs` (~40 LoC TS) + `pnats-journal-attrs` (~40 LoC Python) shims that attach `journal.*` to the active OTel span; WAL consumer Go service (~500 LoC); kaarbaaz adopts |
| **B — Beyla MCP extension + collector pipeline** | Contribute MCP/JSON-RPC parser to OBI (~150 LoC Go); deploy OTel Collector pipeline with `journal-redact` processor + routing to SigNoz; mailer + api-gateway adopt the shim |
| **C — PII + spill + envelope** | Field redaction registry, S3 spill, synthetic user envelope (§18) production-ready |
| **D — Query layer + replay** | CLI verbs (§21), replay engine reading from SigNoz + PG, `journal repro` local-seed pattern |
| **E — Cross-service + governance** | `originating_request_id` propagation, RBAC scopes, post-hoc redaction, `journal retention` introspection |

Each phase 1-2 weeks. Total: **~8-10 weeks to production**.

---

## 13. Cross-language consumability — collapsed via OTel semconv

The ENTIRE §13 from R2 (twin packages, JSON Schema SoT, JCS RFC 8785 conformance CI, etc.) **collapses** in R3.

### 13.1 What replaces it

**OTel semantic conventions are the schema.** Every OTel SDK encodes attributes the same way (W3C-canonical strings). The `journal.*` namespace becomes part of our internal OTel semconv extension document.

### 13.2 Per-language shim — 40 LoC each

```ts
// @pnats/journal-attrs (TypeScript / NestJS)
import { trace, context } from '@opentelemetry/api';

export function recordJournalEvent(envelope: {
  type: string;
  actor: { kind: string; id: string; display?: string };
  tenant_id: string;
  entity?: { type: string; id: string };
  on_behalf_of_user_id?: string;
}) {
  const span = trace.getSpan(context.active());
  if (!span) return;
  span.setAttributes({
    'event.name': envelope.type,
    'journal.actor.kind': envelope.actor.kind,
    'journal.actor.id': envelope.actor.id,
    'journal.actor.display': envelope.actor.display,
    'journal.tenant_id': envelope.tenant_id,
    'journal.entity.type': envelope.entity?.type,
    'journal.entity.id': envelope.entity?.id,
    'journal.on_behalf_of_user_id': envelope.on_behalf_of_user_id,
  });
}
```

```python
# pnats-journal-attrs (Python / FastAPI)
from opentelemetry import trace

def record_journal_event(envelope: dict):
    span = trace.get_current_span()
    if not span.is_recording():
        return
    span.set_attribute("event.name", envelope["type"])
    span.set_attribute("journal.actor.kind", envelope["actor"]["kind"])
    span.set_attribute("journal.actor.id", envelope["actor"]["id"])
    if "display" in envelope["actor"]:
        span.set_attribute("journal.actor.display", envelope["actor"]["display"])
    span.set_attribute("journal.tenant_id", envelope["tenant_id"])
    if "entity" in envelope:
        span.set_attribute("journal.entity.type", envelope["entity"]["type"])
        span.set_attribute("journal.entity.id", envelope["entity"]["id"])
    if "on_behalf_of_user_id" in envelope:
        span.set_attribute("journal.on_behalf_of_user_id", envelope["on_behalf_of_user_id"])
```

### 13.3 Decorator on top of the shim (per-language idiom)

```ts
// NestJS
@JournalEvent({
  type: 'company.created',
  resolveActor: (ctx) => ({ kind: 'USER', id: ctx.user.id, display: ctx.user.name }),
  resolveEntity: (result) => ({ type: 'company', id: result.id }),
})
async createCompany(...) { ... }
```

```python
# FastAPI
@journal_event(
    type="company.created",
    resolve_actor=lambda ctx: {"kind": "USER", "id": ctx.user.id},
    resolve_entity=lambda result: {"type": "company", "id": result.id},
)
async def create_company(...): ...
```

Total LoC per language: ~40 for the shim + ~50 for the decorator = ~90 LoC. Both languages = ~180 LoC total.

---

## 14. CLI + REST API actions (UNCHANGED from R2 §21)

Same verb surface (list, search, stats, show, tree, flow, logs, trace, errors, rerun, record, compare, repro, export, bundle, follow, types, services, workflows, actors, redaction, retention, preflight, redact, soft-delete, restore). **Different backends:**

- Audit data → `journal.events` PG via direct query
- Capture data → SigNoz HTTP API
- Spilled payloads → S3 signed URL via attribute lookup

The CLI client is single-binary Go (per Team Beta's recommendation — language-agnostic, deployable as a tool to developer laptops).

---

## 15. Synthetic user envelope (UNCHANGED from R2 §18)

Same fields. Same daily-salt rotation. In R3, stored as OTel attributes (`journal.client.*`, `journal.auth.*`) instead of a PG column. Native fit.

---

## 16. Runtime piping (UNCHANGED from R2 §19, simplified)

- Pino logs → already auto-correlate via `traceparent` header → ClickHouse → `journal logs <request_id>` queries SigNoz
- OTel SpanProcessor → already in `@pnats/telemetry` → no change needed
- Error handler → uncaught errors become Logs Bridge records with `event.name = 'error.uncaught'`
- Kafka headers → producer auto-adds `traceparent`; consumer auto-reads it
- Temporal workflow → `journal.temporal.*` attributes; `journal follow <workflow_id>` queries SigNoz
- RUM → front-end emits to `/api/journal/rum` → OTel Logs Bridge → same pipeline (synthetic envelope intact)

---

## 17. State snapshots (UNCHANGED conceptually from R2 §20)

DB pre/post-state + cache + config snapshots emitted as OTel Logs Bridge records with `event.name = 'db.read.snapshot'` / `'db.write.snapshot'` / `'cache.snapshot'` / `'config.snapshot'`. Content-hash dedup. S3 spill for > 256 KB. Same redaction registry.

The Kysely / SQLAlchemy middleware that auto-captures pre-state on opt-in queries (`db.selectFrom(t).withSnapshot()`) is the same as R2's design.

---

## 18. What R3 collapses vs R2

| R2 component | R3 status |
|---|---|
| `journal.captures` PG table (26 cols) | **GONE** — OTel Logs Bridge records |
| Twin packages (`@pnats/journal-types` + `pnats-journal-types`) | **GONE** — OTel semconv is the schema |
| JSON Schema SoT repo + RFC 8785 JCS conformance CI | **GONE** — OTel attribute encoding is canonical |
| Hand-written client lib per language | **40-LoC shim per language** |
| Custom CLI query layer for captures | **SigNoz HTTP API** |
| Cassette assembly from `journal.captures` | **SigNoz logs query + PG join** |
| ~5,000 LoC | **~470 LoC** total |

---

## 19. What stays from R2

- `journal.events` PG table — Faizan's V1 (audit-of-record, transactional)
- Three replay modes (cassette / passthrough / partial)
- Synthetic user envelope (§18 in R2)
- Runtime piping (§19 in R2)
- State snapshot layer (§20 in R2)
- CLI verb surface (§21 in R2)
- Phased rollout philosophy (collapsed phases)

---

## 20. Sources merged into this design

- `2026-05-14-events-journal.md` (Faizan) — V1, MERGED via pnow-ats-v2 PR #5727.
- `2026-05-21-event-journal-package-design.md` (snoorullah, R1) — V2 vision.
- `2026-05-22-event-journal-package-design.md` (snoorullah, R2) — explicit-decorator + twin-package version.
- 4 Feynman research outputs at `~/work/.handoffs/event-journal/2026-05-22/`:
  - `research-audit-log-packages.md` (Team 1 — BUILD verdict)
  - `research-capture-replay-packages.md` (Team 2 — adopt MSW + VCRpy + Sinon)
  - `research-cross-language.md` (Team 3 — twin packages with JSON Schema; R2's basis)
  - `research-otel-as-journal.md` (Team Alpha — hybrid, NOT OTel-replacement)
  - `research-go-agent-ebpf.md` (Team Beta — Beyla + 40-LoC shim)
  - `research-industry-apm-audit-unified.md` (Team Gamma — industry never unifies)
  - `research-tier-2-zero-touch.md` (Team Delta — Tier 2 rejected; ONE piece adopted: `pg_logical_emit_message` outbox)

R3 represents the synthesis of Teams Alpha/Beta/Gamma/Delta — the "industry-aligned + OTel-native + ONE Tier 2 piece (outbox)" architecture.

---

## 21. Next step

When ready:
1. Invoke `superpowers:writing-plans` against this design doc (or against R2 if explicit preferred).
2. Output: `docs/superpowers/plans/<date>-event-journal-R3-phase-a.md` (Phase A: outbox + per-language shim + WAL consumer).
3. Execute via `superpowers:subagent-driven-development` in a dedicated worktree (`.worktrees/EVENT-JOURNAL-R3-A`).
4. Land Phase A as `packages/journal-attrs/` (TS) + `pnats-journal-attrs/` (Python) workspace packages + the Go WAL consumer in `services/journal-wal-consumer/`.

Total Phase A estimate: ~3 weeks. Total all-phases (A-E): ~8-10 weeks to feature-complete.

---

## 22. Honest closing note

R3 trades explicit control for radical simplicity. Pick R3 if you trust:
- OTel + Beyla + ClickHouse stay operational (Team Beta + Alpha verified)
- The OTel Logs Bridge API stabilizes per the 2026 roadmap (Team Alpha verified)
- Audit-of-record stays in PG (every industry survey agrees — Team Gamma)
- `pg_logical_emit_message` is a viable outbox mechanism (Decodable + Morling demos exist)

Pick R2 if you want:
- Full hand-control of every byte
- Don't trust OTel attribute size limits / SigNoz multi-tenancy / ClickHouse mutability
- Have the engineering capacity for 6+ months of custom-build

Both ship the same V1 audit-of-record (Faizan's events table) and the same V2 capabilities (synthetic envelope, runtime piping, state snapshots, replay, verbs). They differ in HOW the V2 capture half is implemented, not in WHAT it does.
