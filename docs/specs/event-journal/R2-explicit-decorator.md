# `@pnats/event-journal` — Service-Event Capture + Replay (Extension of events-journal V1)

> **Status:** Design doc — REVISION 2 (2026-05-22).
>
> **Supersedes:** `2026-05-21-event-journal-package-design.md`.
>
> **Extends:** `2026-05-14-events-journal.md` (Faizan's plan, MERGED via PR #5727). This document is positioned as the **forward-compatible super-set** of that plan, not a replacement. Everything Faizan landed in V1 holds; this design adds the request-capture + replay capability that V1 explicitly deferred.
>
> **Not a plan.** When ready to start, convert via `superpowers:writing-plans` → `superpowers:subagent-driven-development`.

---

## 0. Relationship to V1 (Faizan's plan)

V1 shipped a **business-action audit log** — soft-deleted-forever, queryable by actor, ~100k/day capacity, MAILER as the live producer. That is `journal.events`.

V2 (this design) adds a **request-flow capture + replay system** — TTL'd, payload-bearing, replayable. That is `journal.captures` (new table) alongside `journal.events` (Faizan's).

**Why two tables, one schema:**

- Same `journal` schema → preserves transactional outbox semantics for PG-backed producers (single COMMIT covers business row + audit row + capture rows).
- Different lifecycle: audit rows live forever (soft-delete); capture rows TTL out at 7-30 days per event class.
- Different shape: audit rows are small (`summary` + `diff`, ≤4 KB); capture rows hold full payloads (256 KB inline + S3 spill).
- Different read patterns: audit = actor-filter pagination; capture = request_id tree reconstruction.
- Cross-link via `correlation_id` (Faizan's name) ≡ `request_id` (this spec's name). Same UUID, same column type, same semantic meaning. They are synonyms.

**One client package, two record APIs:**

```ts
// Faizan's audit log (V1 — shipped)
await journal.record({
  actor: { kind: 'USER', id: userId, display: userName },
  event_type: 'company.created',
  entity: { type: 'company', id: companyId },
  summary: 'Created company "Acme Corp"',
  diff: { name: { from: null, to: 'Acme Corp' } },
  idempotency_key: `${userId}:company.created:${companyId}`,
})

// V2 capture (this design)
await journal.capture({
  request_id: ctx.requestId,
  parent_event_id: ctx.currentEventId,
  event_type: 'http.outbound',
  payload: { method: 'POST', url: '...', body: '...', response: '...' },
  trace_context: { trace_id, span_id },
})
```

Both APIs route through one `@pnats/journal-client` package. Cross-language equivalent in Python (see §13 for the cross-language killer-question research).

---

## 1. Problem statement (unchanged from R1)

Today, reconstructing what a service did during a request means hand-joining three independent log surfaces: Pino service logs, OTel traces (no bodies), Kafka topic dumps. None alone answers questions like _"this `POST /publish` failed — what SQL queries did we run, what did Apollo return, what did we emit to Kafka?"_ or _"reproduce this customer's bug locally with the recorded request payload"_.

OTel doesn't capture bodies by design. The journal does, with explicit PII redaction + size caps + S3 spill.

---

## 2. Capacity plan — capture half (NEW SECTION, adopting Faizan's discipline)

V1 audit log is ~100k/day → 25 GB/year (per Faizan's §2). The capture half is heavier because every outbound boundary call gets a row.

| Producer                  | Captures/req (avg)                           | Captures/day           | Notes                    |
| ------------------------- | -------------------------------------------- | ---------------------- | ------------------------ |
| `kaarbaaz` POST /publish  | ~12 (1 inbound + 2 SQL + 6 Apollo + 3 Kafka) | ~150k/day              | Highest-fan-out endpoint |
| `mailer` send-email       | ~6 (1 inbound + 3 MS Graph + 2 SQL)          | ~50k/day               |                          |
| Other NestJS services     | ~4 avg                                       | ~80k/day combined      |                          |
| Python (FastAPI) services | ~4 avg                                       | ~40k/day combined      |                          |
| **Total day-1**           |                                              | **~320k captures/day** | 3× the audit log         |

Row size: **~2 KB metadata + payload (256 KB inline cap or S3-spilled)**. At 90% inline / 10% spill, average row in PG ≈ 50 KB; total PG growth ≈ **15 GB/day → 105 GB/week → ~5.5 TB/year** at the V2 capture half alone.

**This is why captures need different retention than audit:**

- 30 days for `http.outbound`, `kafka.emit`, `mcp.call`
- 7 days for `sql.query` (highest volume, lowest forensic value per row)
- 24h for `internal.boundary` (debugging only)

Steady-state PG footprint: ~75-150 GB (vs Faizan's audit log at ~25 GB/year). Operationally fine on shared PG. Spilled payloads on R2 / Azure Blob: ~50 GB/month at $0.015/GB ≈ ~$0.75/mo. Negligible.

**Postgres headroom (write-side):** 320k/day = ~4/sec average, ~40/sec peak. Modern PG handles 5,000–15,000 single-row INSERTs/sec on a 4-core node. Three orders of magnitude under capacity. Verified by Faizan's §2 analysis.

**Escape valve at 10× (3M captures/day):** mirror to ClickHouse via Debezium. PG keeps the last 7 days (point-lookups by request_id); CH absorbs anything older. Same pattern Faizan documented for the audit log.

---

## 3. Storage decision — Postgres + S3 spill

Same backend as V1. Same instance. Same `journal` schema. Same `journal_writer`/`journal_reader` DB users + pgbouncer pools (adopted from Faizan §3).

### Why NOT ClickHouse as primary

Faizan's table in §3 says it cleanly: at our scale, CH is over-engineering. Its strengths (OLAP scans) don't apply to the OLTP read shape of "filter by actor, paginate" OR "reconstruct request by request_id". CH lacks row-level locks + atomic updates needed for soft-delete and PII redaction in place. **Same logic applies to captures.** Reaffirmed.

### Why NOT a time-series database

Discussed in the 2026-05-22 conversation: the journal's reads are equality-filtered (request_id, actor_id) then time-sorted, not time-range-scanned. TSDB superpowers (columnar compression on repetitive time-stamped data, drop-old-shard retention) don't apply because (a) data isn't repetitive — every payload differs, (b) we don't drop, we soft-delete the audit half and TTL the capture half, (c) reads aren't time-range-scans. TimescaleDB extension remains a viable late-stage optimization (drop-in on existing PG) if compression becomes worthwhile.

---

## 4. Schema — extending V1, not replacing it

### 4.1 Adopt Faizan's `journal.events` unchanged

V1's table is the audit log of record. Don't touch it. Every column, index, constraint, retention rule stays.

```sql
-- (Faizan's plan §5 — unchanged, here for reference)
CREATE SCHEMA journal;

CREATE TYPE journal.actor_kind AS ENUM (
  'USER', 'SERVICE', 'WORKFLOW', 'CRON', 'AI'
);

CREATE TABLE journal.events (
  id                    uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  idempotency_key       text NOT NULL,
  occurred_at           timestamptz NOT NULL,
  recorded_at           timestamptz NOT NULL DEFAULT now(),
  actor_kind            journal.actor_kind NOT NULL,
  actor_id              text NOT NULL,
  actor_display         text,
  on_behalf_of_user_id  uuid,
  event_type            text NOT NULL,
  entity_type           text,
  entity_id             uuid,
  summary               text,
  diff                  jsonb,
  correlation_id        uuid,
  causation_id          uuid,
  metadata              jsonb,
  deleted_at            timestamptz,
  deleted_reason        text,
  PRIMARY KEY (occurred_at, id)
) PARTITION BY RANGE (occurred_at);
```

Plus Faizan's 7 indexes (6 partial `WHERE deleted_at IS NULL` + 1 BRIN), per-month partitioning, idempotency uniqueness, etc.

### 4.2 Add `journal.captures` for V2

New table for request-flow capture. Different lifecycle, different retention, different read shape.

```sql
CREATE TYPE journal.capture_kind AS ENUM (
  'http.inbound',
  'http.outbound',
  'sql.query',
  'kafka.emit',
  'kafka.consume',
  'mcp.call',
  'internal.boundary',
  'cron.tick',
  'workflow.activity'
);

CREATE TABLE journal.captures (
  -- Identity
  capture_id            uuid NOT NULL DEFAULT gen_random_uuid(),  -- UUIDv7 in app code
  tenant_id             uuid NOT NULL,                            -- multi-tenant gate (first index column, per Faizan's discipline)

  -- Request tree
  request_id            uuid NOT NULL,                            -- ≡ Faizan's correlation_id
  parent_capture_id     uuid REFERENCES journal.captures(capture_id) ON DELETE CASCADE,
  originating_request_id uuid,                                    -- upstream service's request_id (cross-service)

  -- Idempotency (adopted from Faizan §7 — REQUIRED, never null)
  idempotency_key       text NOT NULL,                            -- per-source natural key or SHA-256 fallback

  -- Time (adopted from Faizan §5 — occurred_at vs recorded_at distinction)
  occurred_at           timestamptz NOT NULL,                     -- when the boundary call happened
  recorded_at           timestamptz NOT NULL DEFAULT now(),       -- when the journal received it
  duration_ms           int,                                      -- for operations that wrap a span

  -- WHO (adopted from Faizan §4 — discriminated actor model)
  actor_kind            journal.actor_kind NOT NULL,
  actor_id              text NOT NULL,
  actor_display         text,
  on_behalf_of_user_id  uuid,

  -- WHAT
  capture_kind          journal.capture_kind NOT NULL,            -- typed enum
  service               text NOT NULL,                            -- emitting service
  subject_ref           jsonb,                                    -- what this capture is "about" (entity_kind + id)

  -- PAYLOAD (V2-specific, deliberately not in V1)
  payload               jsonb,                                    -- inline if < 256 KB
  payload_size_bytes    int NOT NULL,
  payload_spilled_to    text,                                     -- S3/R2 URI when payload > inline cap
  payload_content_hash  text,                                     -- sha256 of canonical payload, for dedup + cassette assertions

  -- Status (V2-specific)
  status                text,                                     -- 'started' | 'completed' | 'failed'
  error                 jsonb,                                    -- populated when status='failed'

  -- Cross-system links (V2-specific)
  trace_context         jsonb,                                    -- one-way link into OTel: { trace_id, span_id }
  kafka_envelope_ref    jsonb,                                    -- one-way link into Kafka: { topic, partition, offset }

  -- Soft-delete (NOT used for retention — TTL via partition drop instead; here for tenant offboarding only)
  deleted_at            timestamptz,
  deleted_reason        text,

  PRIMARY KEY (occurred_at, capture_id)
) PARTITION BY RANGE (occurred_at);
```

### 4.3 Indexes on `journal.captures` (synthesized from BOTH designs)

```sql
-- 1. Idempotency. Full index (not partial) so dup checks work even after soft-delete.
CREATE UNIQUE INDEX captures_idempotency_idx
  ON journal.captures (tenant_id, idempotency_key, occurred_at);

-- 2. Request reconstruction — the load-bearing read pattern of V2.
CREATE INDEX captures_request_idx
  ON journal.captures (tenant_id, request_id, occurred_at)
  WHERE deleted_at IS NULL;

-- 3. Parent-child tree (within a request).
CREATE INDEX captures_parent_idx
  ON journal.captures (parent_capture_id)
  WHERE parent_capture_id IS NOT NULL AND deleted_at IS NULL;

-- 4. Filter by actor (admin/forensic UI).
CREATE INDEX captures_actor_idx
  ON journal.captures (tenant_id, actor_kind, actor_id, occurred_at DESC)
  WHERE deleted_at IS NULL;

-- 5. Filter by service + capture_kind (per-service drill-downs).
CREATE INDEX captures_service_kind_idx
  ON journal.captures (tenant_id, service, capture_kind, occurred_at DESC)
  WHERE deleted_at IS NULL;

-- 6. Content-hash dedup (payload-spill GC + cassette matching).
CREATE INDEX captures_content_hash_idx
  ON journal.captures (payload_content_hash)
  WHERE payload_content_hash IS NOT NULL AND deleted_at IS NULL;

-- 7. "On behalf of this user" lineage.
CREATE INDEX captures_on_behalf_idx
  ON journal.captures (tenant_id, on_behalf_of_user_id, occurred_at DESC)
  WHERE on_behalf_of_user_id IS NOT NULL AND deleted_at IS NULL;

-- 8. BRIN for ad-hoc time-range scans.
CREATE INDEX captures_brin_idx
  ON journal.captures USING brin (occurred_at);
```

All hot-path indexes are partial-on-`deleted_at IS NULL` per Faizan's discipline. Soft-delete is reserved for tenant offboarding (not retention — captures use partition drop).

### 4.4 Cross-link to V1 `journal.events`

A business action recorded in `journal.events` and the captures it triggered in `journal.captures` share a `correlation_id` ≡ `request_id`. Add this view for cross-table reconstruction:

```sql
CREATE VIEW journal.request_full AS
SELECT
  'event' AS row_kind, id, occurred_at, actor_kind, actor_id, event_type, summary,
  NULL::uuid AS request_id, NULL::uuid AS parent_capture_id,
  NULL::jsonb AS payload, NULL::int AS payload_size_bytes
FROM journal.events
UNION ALL
SELECT
  'capture' AS row_kind, capture_id, occurred_at, actor_kind, actor_id, capture_kind::text, NULL,
  request_id, parent_capture_id,
  payload, payload_size_bytes
FROM journal.captures;
```

Query pattern: `SELECT * FROM journal.request_full WHERE correlation_id = $1 OR request_id = $1 ORDER BY occurred_at;`

---

## 5. Idempotency (FROM Faizan §7 — adopted in full)

`idempotency_key` is **required** on both `journal.events` (Faizan) AND `journal.captures` (V2). Same per-source natural-key table. Same SHA-256 fallback formula with `tenant_id` baked into the hash. Same `INSERT … ON CONFLICT DO NOTHING` semantic.

Capture-specific additions:

| Capture source  | Natural key                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `http.inbound`  | `tenant_id:request_id` (one per request)                                      |
| `http.outbound` | `request_id:capture_kind:sequence` (sequence = monotonic per-request counter) |
| `sql.query`     | `request_id:sql.query:hash(sql + params)`                                     |
| `kafka.emit`    | `topic:partition:offset` (uniquely identifies a produced message)             |
| `kafka.consume` | `topic:partition:offset` (uniquely identifies a consumed message)             |
| `mcp.call`      | `request_id:server:tool:sequence`                                             |

If a producer fails mid-request and retries, captures already written are no-ops. Same correctness guarantee as Faizan's V1.

---

## 6. Actor model (FROM Faizan §4 — adopted with extension)

Same 5-way discriminated enum: USER / SERVICE / WORKFLOW / CRON / AI. Same `actor_kind` + `actor_id` + `actor_display` shape. Same `on_behalf_of_user_id` for workflow-acting-for-user. **Same source-of-truth `shared/journal-types` package** with the canonical list of legal `actor_id` values + CI lint rule on producers.

V1's actor model is correct. V2 reuses it verbatim.

---

## 7. Payload handling — V2-specific, NOT a regression from V1

Faizan's V1 says "not a payload archive" — this is correct **for events**. V2's captures table is the payload archive, but it's a separate table with separate retention. V1's discipline is preserved for the events table.

### 7.1 Inline cap + spill (256 KB threshold)

- Payloads ≤ 256 KB stored inline as JSONB in `payload` column.
- Payloads > 256 KB written to S3/R2/Azure Blob, URI stored in `payload_spilled_to`, JSONB column NULL.
- Spilled payloads gzip-compressed; bucket lifecycle policy mirrors per-capture-kind TTL.
- `payload_content_hash` (SHA-256 of canonical JSON) enables dedup: same SQL string sent 1000× stores one blob, references it 1000×.

### 7.2 PII redaction registry

- Default-deny on field names: `password`, `token`, `secret`, `authorization`, `cookie`, `api_key`, `bearer`, credit-card patterns (regex).
- Per-`capture_kind` + per-`tenant_id` overrides.
- Redaction happens **before** writing — the journal never sees raw secrets.
- Registry shape: YAML (decided per Faizan's enum discipline — single SoT, version-controlled).

### 7.3 Allow-listed headers

- Default-deny on headers — only allow-listed entries go to the journal.
- Allow-list: `User-Agent`, `Content-Type`, `X-Request-Id`, `X-Tenant-Id`, `X-Correlation-Id`, `Idempotency-Key`.
- Authorization-family headers (`Authorization`, `Cookie`, `Proxy-Authorization`) are categorically blocked.

---

## 8. Retention — hybrid (audit forever + captures TTL)

| Table              | Policy                                             | Mechanism                                                |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| `journal.events`   | Soft-delete after 18 months, **never hard-delete** | Faizan's nightly job; partial indexes                    |
| `journal.captures` | TTL per `capture_kind`, **partition drop**         | `pg_partman` weekly partitions, retention varies by kind |

Per-capture-kind retention:

- `http.inbound`: 30 days
- `http.outbound`: 30 days
- `sql.query`: 7 days
- `kafka.emit`: 30 days
- `kafka.consume`: 7 days
- `mcp.call`: 30 days
- `internal.boundary`: 24 hours
- `cron.tick`: 7 days
- `workflow.activity`: 30 days

Spilled payloads in object storage subject to lifecycle policy mirroring the same TTL.

---

## 9. Replay — three modes (UNCHANGED FROM R1 §"Three modes of replay")

**Mode A: Full cassette.** Reconstruct + re-execute inbound handler locally. Monkey-patch HTTP/SQL/Kafka/MCP clients to return recorded responses in order. Assert outbound response matches recorded.

**Mode B: Passthrough with annotation.** Re-execute against live external deps. For each outbound, record live response alongside recorded, surface diffs.

**Mode C: Partial replay.** Cassette up to checkpoint event_id, live after.

Replay determinism: AsyncLocalStorage-scoped "replay context" intercepts `crypto.randomUUID()`, `Date.now()`, `pg_random_uuid()`. Captured values replayed in order. No prod-runtime cost (only active when replay context is entered).

**Test-fixture export CLI** (`pnpm journal export <request_id> --as vitest-spec > test/regression-<id>.spec.ts`) — turn prod incidents into regression tests in one command. **Killer feature.**

---

## 10. Cross-service correlation (FROM R1 §"Cross-service correlation" + extension)

- Inbound HTTP request from `api-gateway` to `kaarbaaz` carries `x-request-id` (UUIDv7, set by api-gateway if absent).
- `kaarbaaz` records both its own local `request_id` AND `originating_request_id = <api-gateway's request_id>` (new column in V2 schema).
- Query layer stitches across services by following `originating_request_id` chains.
- Same propagation for Kafka: producer puts `x-request-id` in message headers; consumer captures it as `originating_request_id`.
- Same propagation for Temporal: scheduling input includes `parent_request_id`; activity records it.

---

## 11. Hard problems acknowledged (FROM R1 — kept verbatim, plus additions)

- Payload size + PII → §7
- Outbound interception breadth → undici Dispatcher (Node fetch), axios interceptor, Kysely `.execute()` wrap, kafkajs `instrument()` API, MCP per-client adapter, `pg` raw driver wrapping
- Replay determinism → AsyncLocalStorage replay context
- State isolation in replay → cassette doesn't touch real DB; passthrough uses snapshotted test DB
- Async/parallel/cross-process → siblings under same parent_capture_id; consumers get new request_id with parent_request_id linking back
- **NEW** Same-transaction write contract — for PG-backed producers, V1 audit row + V2 capture rows + business row commit atomically via the dedicated `journal_writer` connection. Free transactional outbox.
- **NEW** Backpressure — if V2 capture writes lag, **fail the producer's request** rather than dropping captures. Audit + capture must be consistent with business state.

---

## 12. Phased rollout (FROM R1 §"Phased rollout" — re-grounded against V1)

Faizan's V1 = "events shipped, mailer adopting." V2 phases build on top:

| Phase                                      | Scope                                                                                                                                                                                                 | Build on                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **A — Substrate**                          | `journal.captures` table, partition scaffold, twin packages (`@pnats/journal` + `pnats-journal`) generated from `pnats-journal-schemas` repo, JCS conformance CI green, kaarbaaz-only inbound capture | V1's `journal_client.record()` already exists |
| **B — Outbound capture**                   | undici/axios wrapper + httpx wrapper, Kysely wrapper + SQLAlchemy wrapper, kafkajs + aiokafka instrumentation, inline payloads only                                                                   | A                                             |
| **C — PII + spill + envelope**             | Field redaction registry (§7.2), S3 spill, per-capture-kind TTL (§8), synthetic user envelope (§18) — production-ready                                                                                | B                                             |
| **D — Query layer + observability piping** | REST endpoints (events + captures unified via `journal.request_full` view), live tail, Scalar-mounted trace browser, Pino mixin + OTel SpanProcessor + error-handler hooks (§19)                      | C                                             |
| **E — Replay Mode A (cassette)**           | Replay engine + AsyncLocalStorage replay context + UUID/Date/RNG interception, CLI `journal rerun --mode cassette`, `journal repro` (§21)                                                             | D                                             |
| **F — Replay Modes B + C**                 | Diff renderer, checkpoint-based partial replay, `journal compare`, state-snapshot seeding (§20)                                                                                                       | E                                             |
| **G — Test-fixture export**                | `journal export <request_id> --as vitest\|pytest\|playwright` CLI; `journal bundle` ZIP                                                                                                               | E or F                                        |
| **H — Cross-service correlation**          | `originating_request_id` propagation across HTTP/Kafka/Temporal headers; unified cross-service tree query via `journal flow` and `journal follow` (§21)                                               | D                                             |
| **I — Governance + UI polish**             | RBAC scopes (§21.4), post-hoc `journal redact` + `journal soft-delete` + `journal restore`, `journal retention` + `journal preflight`, full Scalar-mounted browser polish                             | H                                             |

Each phase independently shippable. A-C are production-ready capture half; D is observability piping + query UX; E-G are replay; H-I are cross-service + governance.

---

## 13. Cross-language consumability — RESOLVED (Team 3 research, 2026-05-22)

V1 client is TypeScript-only. V2 must work for both NestJS (TS) AND FastAPI/Python services. Research output: `~/work/.handoffs/event-journal/2026-05-22/research-cross-language.md` (6,110 words, 38 citations).

### 13.1 The shareable kernel — carve carefully

| Component                                                       | Cross-language behavior required?                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Schema definitions (event types, capture kinds, envelope shape) | NO — declarative; codegens from JSON Schema                                            |
| Validation rules                                                | NO — declarative; codegens to Zod (TS) + Pydantic (Python)                             |
| Allow/deny redaction registry                                   | NO — declarative YAML                                                                  |
| **Canonical JSON serializer (JCS RFC 8785)**                    | **YES** — bit-identical output across languages required for idempotency-key stability |
| **SHA-256 idempotency-key generation**                          | **YES** — same input → same key, regardless of language                                |

Only TWO components demand shared _behavior_. Everything else is declarative.

### 13.2 The verdict — Tier E + A4 hybrid

**Twin packages backed by a shared JSON Schema artifact + RFC 8785 conformance suite in CI.**

```
pnats-journal-schemas/             ← single repo, source of truth (separate GitHub repo)
├── schemas/
│   ├── envelope.schema.json
│   ├── actor.schema.json
│   ├── capture-kind.schema.json
│   ├── client-envelope.schema.json
│   └── redaction-registry.schema.yaml
├── test-vectors/
│   ├── rfc8785/                   ← vendored from cyberphone/json-canonicalization
│   └── pnats/                     ← +30 of our own (multi-tenant edge cases, UTF-8 NFC normalization)
└── conformance-spec.md

# Generated client packages

@pnats/journal-types (npm)         ← generated TS types via json-schema-to-typescript
                                     consumes pnats-journal-schemas via git submodule + Renovate

pnats-journal-types (PyPI)         ← generated Pydantic models via datamodel-code-generator
                                     consumes pnats-journal-schemas via git submodule + Renovate

# Client libraries (hand-written, depend on the generated types + canonical-JSON impls)

@pnats/journal (npm)               ← TS client (NestJS adapter)
   ├── deps:
   │   ├── @pnats/journal-types
   │   └── canonicalize (npm, MIT, RFC 8785 impl)
   └── crypto.createHash for SHA-256

pnats-journal (PyPI)               ← Python client (FastAPI adapter)
   ├── deps:
   │   ├── pnats-journal-types
   │   └── rfc8785 (PyPI, Apache-2.0, Trail of Bits impl)
   └── hashlib.sha256
```

### 13.3 The non-negotiable: JCS conformance CI

Without this, the twin-package approach is unsafe (silent idempotency-key drift = duplicate journal rows on cross-language retry = real production bug).

A CI job runs on every PR to either client lib:

1. Load 100+ canonical inputs (RFC 8785 test vectors + 30 pnats-specific)
2. Run JCS canonicalization in TS impl → bytes A
3. Run JCS canonicalization in Python impl → bytes B
4. Run SHA-256 in both → hashes A' and B'
5. Assert `A == B` AND `A' == B'` for every vector

The conformance suite is the contract.

### 13.4 Why NOT the seductive alternatives

| Rejected approach                                          | Why                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **napi-rs + PyO3 hybrid** (Rust core, two native bindings) | Polars (the canonical citation) is **not** a single annotated crate — has separate `py-polars` (PyO3) and `nodejs-polars` (napi-rs) crates with idiomatic per-language code. Bindings are written TWICE. ~14 binary artifacts per release. Earns its keep at 50k+ LOC of perf-critical compute; our kernel is ~200 LOC. Toolchain tax > maintenance saving. |
| **WASM core**                                              | Marshalling overhead for sub-10 KB JSON inputs exceeds compute time (per Fermyon / Bytecode Alliance benchmarks). Wrong tool for small hot-path functions.                                                                                                                                                                                                  |
| **uniffi (Mozilla)**                                       | No first-class Node.js binding — only WASM or React Native paths. Disqualified.                                                                                                                                                                                                                                                                             |
| **TypeSpec → codegen**                                     | Strong schema lang but no JCS+SHA-256 behavior — still needs separate behavior libs. JSON Schema is industry-default and equivalent for declarative shape.                                                                                                                                                                                                  |
| **Connect-RPC / Protobuf**                                 | Heavier, requires runtime codecs, less idiomatic for declarative event envelopes. JSON Schema simpler for our use case.                                                                                                                                                                                                                                     |
| **Stainless / Speakeasy SDK gen**                          | Best-in-class for client SDKs from OpenAPI; our journal isn't a public API. Overkill.                                                                                                                                                                                                                                                                       |

### 13.5 Industry validation

- **Sentry** (`sentry-data-schemas` repo) operates this exact pattern at production scale — JSON Schema SoT consumed via git submodule + Dependabot + `json-schema-to-typescript` + `datamodel-code-generator`.
- **Stripe / OpenAI / Anthropic** ship N parallel client packages from one OpenAPI spec via **Stainless** (which Anthropic acquired May 2026). Different mechanism (OpenAPI codegen vs JSON Schema codegen) but same principle: one schema, N idiomatic clients.
- **No major polyglot SDK** uses napi-rs + PyO3 dual bindings for cross-language _behavior_ sharing.

### 13.6 Counter-recommendation

If Python consumers stay at 1 (`audit-api-service`) AND the schema freezes after Phase A → hand-write both client packages with NO codegen. Codegen earns its keep at N≥2 consumers per language.

Our roadmap has 6+ Python consumers (audit-api-service + audit-activity-timeline-service + pi-mail + pi-analysis + pi-scrape + pi-intel) → codegen wins.

### 13.7 Concrete next-step for Phase A

Build pipeline in CI:

```bash
# In pnats-journal-schemas repo on push:
npm run validate-schemas       # ajv-cli against schema metaschema
npm run gen-test-vectors       # produce conformance test bundle

# In @pnats/journal-types repo (via Renovate-bumped submodule):
npx json-schema-to-typescript --schema 'schemas/**/*.json' --output src/types.ts
npm publish

# In pnats-journal-types repo (via Renovate-bumped submodule):
datamodel-codegen --input schemas --output src/types.py --output-model-type pydantic_v2.BaseModel
python -m build && twine upload

# In @pnats/journal repo (TS client):
npm install @pnats/journal-types canonicalize
# Hand-written src/, tests pull conformance vectors
npm run test:conformance        # the JCS+SHA-256 assertion suite
npm publish

# In pnats-journal repo (Python client):
pip install pnats-journal-types rfc8785
# Hand-written src/, tests pull conformance vectors
pytest tests/test_conformance.py
python -m build && twine upload
```

Renovate watches `pnats-journal-schemas` and bumps both `*-types` packages automatically.

---

## 14. What this design deliberately does NOT decide

- Whether the package is `@pnats/event-journal` or `@pnats/journal` or `@pnats/service-journal`
- Exact NestJS module structure
- Exact `@JournalBoundary()` decorator API
- Whether to use Effect / Result types or throw/try-catch
- Exact CLI command syntax (verb surface §21 is opinionated, but option flags + table formatting punt)
- Test framework + harness for replay
- Whether the Scalar-mounted UI is built in-house or adopts an OSS browser

All deferred to plan-writing. Note: §13.7 builds, §18 envelope, §19 piping, §20 snapshots, §21 verbs are now DECIDED — they were "open" in R1 and are now load-bearing parts of R2.

---

## 15. Adoption sequence

1. **kaarbaaz** ships its small `RequestContextInterceptor` (already on the table; forward-compatible with this design). ~50 LOC.
2. **`@pnats/journal-client` v2** ships `journal.capture()` API alongside the existing `journal.record()`. Both share the same `journal_writer` connection.
3. **mailer** (already a V1 producer of `journal.events`) becomes the first V2 capture producer too.
4. **Python clients**: `pnats-journal` (PyPI) ships with the same dual-API surface. First Python adoption: `audit-api-service` (synergy with its OpenTelemetry middleware).
5. Wave 2/3 NestJS umbrella migrations adopt V2 capture as part of the umbrella default (one of `pnats-nestjs`'s standard env / config block).
6. Cross-service correlation (Phase H) lights up after kaarbaaz + api-gateway + mailer are all on V2 capture.

---

## 15a. Build-vs-adopt summary (from Feynman research teams 1+2+3)

| Component                                                | Verdict                                                                                                                          | Source    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `journal.events` table + writer + actor enum + retention | **BUILD** (no candidate fits 14-col shape; all framework-coupled or copyleft)                                                    | Team 1    |
| `journal.captures` table + writer                        | **BUILD** (no OSS has captures shape at all)                                                                                     | Team 1+2  |
| HTTP capture (interceptor + cassette)                    | **ADOPT** MSW (TS) + VCRpy (Python)                                                                                              | Team 2    |
| Clock determinism                                        | **ADOPT** `@sinonjs/fake-timers` + Python `time-machine`                                                                         | Team 2    |
| UUID/RNG/SQL replay                                      | **BUILD** (~20 LoC monkey-patch; cross-I/O orchestrator is novel IP)                                                             | Team 2    |
| SQL/Kafka/MCP capture                                    | **BUILD** (no OSS extends VCR to these — only `snowflake-vcrpy` proof-of-concept for one DB driver)                              | Team 2    |
| Cross-language schema + JCS+SHA-256                      | **TWIN PACKAGES** generated from one JSON Schema repo + CI conformance                                                           | Team 3    |
| JCS implementations                                      | **ADOPT** `canonicalize` (npm) + `rfc8785` (PyPI, Trail of Bits)                                                                 | Team 3    |
| Type generation                                          | **ADOPT** `json-schema-to-typescript` + `datamodel-code-generator` (Pydantic)                                                    | Team 3    |
| Partition manager                                        | **ADOPT** `pg_partman` (already in cluster)                                                                                      | Faizan §5 |
| OTel link                                                | **ADOPT** `@opentelemetry/api` (already in `@pnats/telemetry`)                                                                   | §19       |
| Replay model                                             | **ADAPT** Polly.js's mode-state-machine (record/replay/passthrough/recordIfMissing) — borrow design, don't take dep (12mo stale) | Team 2    |

License watch-list rejected (do NOT depend on these): GoReplay (LGPL-3.0), Tracetest (NOASSERTION), OpenReplay (Elastic 2.0), Emmett (planned AGPL/SSPL), django-easy-audit (GPL-3.0), django-reversion-compare (GPL-3.0).

Rough split: **~30% adopt, ~70% build of novel IP.** The novel parts are the differentiators (cross-I/O orchestrator, snapshot layer, twin-package conformance, synthetic envelope).

---

## 16. Sources merged into this design

- `2026-05-14-events-journal.md` (Faizan) — V1 plan, MERGED via pnow-ats-v2 PR #5727. Audit log discipline.
- `2026-05-21-event-journal-package-design.md` (snoorullah, R1) — V2 vision. Capture + replay.
- Conversation 2026-05-22 (session `b8c5053a-...`) — reconciliation + TSDB rejection + verb surface design + AI-assist removal.
- `~/work/.handoffs/event-journal/2026-05-22/research-audit-log-packages.md` (Team 1) — audit log packages survey, BUILD verdict.
- `~/work/.handoffs/event-journal/2026-05-22/research-capture-replay-packages.md` (Team 2) — VCR-family + cassette packages, ADAPT/BUILD split.
- `~/work/.handoffs/event-journal/2026-05-22/research-cross-language.md` (Team 3) — cross-language patterns deep-dive. Twin-packages-with-JSON-Schema-SoT verdict.

---

## 17. Next step

When ready:

1. Invoke `superpowers:writing-plans` against this design doc.
2. Output: `docs/superpowers/plans/<date>-event-journal-phase-a.md` (just Phase A; subsequent phases get their own plans).
3. Execute via `superpowers:subagent-driven-development` in a dedicated worktree (`.worktrees/EVENT-JOURNAL-A`).
4. Land Phase A as `packages/event-journal/` workspace package in pnow-ats-v2, plus `pnats-journal` published to PyPI (per §13 research: twin packages + shared JSON Schema + RFC 8785 CI conformance).

Until then, this document is the canonical reference.

---

## 18. User-side correlation envelope (synthetic, NO PII)

To reproduce a bug exactly, we need the user's environment — NOT the user's identity. Capture an opt-in **synthetic envelope** that reconstructs the request context without storing anything that ties to a person.

### 18.1 What's IN the envelope

| Field                       | Source                                   | Use in repro                                                                                     |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `client.kind`               | parsed UA                                | `browser` / `mobile-ios` / `mobile-android` / `server-curl`                                      |
| `client.browser_family`     | parsed UA                                | `chrome` / `safari` / `firefox` (no version unless > 1 major behind current)                     |
| `client.os_family`          | parsed UA                                | `macos` / `windows` / `linux` / `ios` / `android`                                                |
| `client.device_kind`        | UA + viewport                            | `desktop` / `mobile` / `tablet`                                                                  |
| `client.viewport_bucket`    | viewport rounded to bucket               | `1920×1080` → `desktop-large`; `390×844` → `mobile-medium`                                       |
| `client.locale`             | `Accept-Language` first 2 chars          | `en` / `hi` / `ar` (NOT `en-US-CA` — too specific)                                               |
| `client.tz_offset_min`      | client-set `X-Timezone-Offset` header    | `-300` / `+330`                                                                                  |
| `client.network_rtt_bucket` | Server Timing / synthetic ping           | `fast` (<50ms) / `normal` (50-200ms) / `slow` (>200ms)                                           |
| `auth.scopes`               | JWT `scope` claim                        | `["read:companies", "write:tasks"]` — required for permission-bug repro                          |
| `auth.role`                 | JWT `role` claim                         | `admin` / `tenant_owner` / `member` (NO user id)                                                 |
| `auth.tenant_id`            | JWT `tenant_id` claim                    | UUID — multi-tenant gate                                                                         |
| `auth.subject_hash`         | sha256(user_id + tenant_id + daily_salt) | Stable per-user-per-day; can correlate same-user actions in a 24h window WITHOUT storing user_id |
| `feature_flags`             | Unleash + OpenFeature snapshot           | exact flag set this user saw                                                                     |
| `ab_buckets`                | experimentation framework                | `{ pricing_v2: "B", onboarding_v3: "control" }`                                                  |
| `request.idempotency_key`   | client header                            | already in spec §5                                                                               |
| `request.causation_chain`   | upstream `X-Request-Id`s                 | how this request was triggered                                                                   |

### 18.2 What's explicitly NOT in the envelope

- `client.ip_address` — privacy bomb. Use rough geo bucket if needed: `auth.country_code` (2-char ISO, derived server-side from IP at edge, not stored)
- `auth.user_id` / `auth.email` / `auth.name` — use `subject_hash` instead
- `auth.token` / `auth.bearer` — never
- `User-Agent` raw string — parse + drop. Raw UA fingerprints.
- Cookies / session IDs — never
- Form field VALUES (in payload-spilled bodies, the redaction registry handles this — see §7.2)
- Anything matching the default-deny PII regex set

### 18.3 Schema integration

Add to `journal.captures` table:

```sql
ALTER TABLE journal.captures
  ADD COLUMN client_envelope jsonb;  -- structured per §18.1; ~500 bytes typical
```

Only set on `capture_kind = 'http.inbound'` rows (one per request). All child captures (sql.query, kafka.emit, etc.) inherit via `request_id` join.

### 18.4 Subject-hash daily-salt rotation

To enable same-day-same-user correlation without storing identity:

```
subject_hash = sha256(user_id || ':' || tenant_id || ':' || daily_salt)
```

Where `daily_salt` rotates at 00:00 UTC and is stored encrypted in the cluster (Azure Key Vault). The salt is destroyed at 30 days (per Faizan's retention discipline for the audit half). After salt destruction, all `subject_hash` values are permanently un-correlatable to a user — even with the user_id in hand.

This is **the privacy property**: same-day correlation works; cross-day correlation requires consent + ESO-fetched salt; post-30-days correlation is mathematically impossible.

---

## 19. Runtime piping — every layer of observability links to the journal

The journal isn't a separate silo. It LINKS BIDIRECTIONALLY with the existing observability stack so cross-tool jumps work.

### 19.1 Pino logger ⇄ Journal

```ts
// Every Pino log line auto-injects request_id + capture_id from AsyncLocalStorage
import { logger } from '@pnats/logger'

// inside a journal-instrumented request
logger.info({ companyId }, 'created company')
// → JSON line includes: request_id, capture_id, trace_id, span_id, tenant_id
```

Implementation: a Pino mixin that reads from `@pnats/journal-client`'s `AsyncLocalStorage` and adds the IDs to every log entry.

**Reverse direction:** `journal logs <request_id>` queries Loki (or Pino's destination) with `request_id="<uuid>"` filter. The journal's `recorded_at` and the log entry's `time` are the same monotonic clock, so they sort together.

### 19.2 OpenTelemetry ⇄ Journal

```ts
// Every OTel span auto-adds attributes from journal context
import { tracer } from '@pnats/telemetry'

tracer.startActiveSpan('compute-discount', (span) => {
  // span automatically has: journal.request_id, journal.capture_id, journal.actor_kind
  // ...
})
```

Implementation: a SpanProcessor in `@pnats/telemetry` that, on every span start, copies the current `AsyncLocalStorage`'s journal context into span attributes. Bidirectional:

- **Journal → OTel**: capture row stores `trace_context: { trace_id, span_id }` (already in spec §4.2)
- **OTel → Journal**: span attributes include `journal.request_id` and `journal.capture_id` — Jaeger / SigNoz lets you click a span and "open in journal"

### 19.3 Error handler (NestJS / FastAPI) ⇄ Journal

Uncaught errors become a journal capture row with `status = 'failed'` + `error` populated + stack trace + the AsyncLocalStorage context at the throw point.

```ts
// NestJS
@Catch()
export class JournalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    journal.capture({
      capture_kind: 'error.uncaught',
      payload: { name, message, stack: redactedStack },
      status: 'failed',
      error: { type, code, message },
    })
    // ...continue with normal NestJS error handling
  }
}
```

Same shape for FastAPI via middleware exception hook.

### 19.4 SigNoz error correlation

SigNoz error events (from OTel exception spans) carry the journal's `request_id` and `capture_id` in span attributes. The reverse is automatic: `journal show <request_id> --include-errors` queries the `journal.captures` table directly for `capture_kind = 'error.uncaught'` rows — no external system needed. Errors live in the journal alongside the captures that surrounded them, with the full payload context preserved.

### 19.5 Kafka headers ⇄ Journal

Every Kafka message produced inside a journaled request carries:

- `x-request-id: <uuid>` — journal's request_id
- `x-causation-id: <uuid>` — journal's parent capture_id
- `x-tenant-id: <uuid>` — multi-tenant

Consumers extract these headers, set them in their AsyncLocalStorage, and downstream captures inherit. Cross-service journal trees follow these headers via `originating_request_id`.

### 19.6 Temporal workflow ⇄ Journal

Every Temporal workflow execution starts with a journal `workflow.activity` capture. Activity inputs/outputs are captures. Workflow signals are captures. Workflow IDs and Run IDs are recorded in `metadata.temporal`:

```json
{
  "temporal": {
    "workflow_id": "mailer.opportunity-to-email-19c0e2",
    "run_id": "01HJ4N...",
    "activity_id": "send-email-attempt-1",
    "attempt": 3
  }
}
```

`journal follow <workflow_id>` shows every captured request related to that Temporal workflow execution.

### 19.7 RUM (browser) ⇄ Journal

Front-end emits `journal.client_event` to `/api/journal/rum` with a smaller envelope (anonymized via §18). These captures have `capture_kind = 'rum.event'` and `actor_kind = 'USER'`. They cross-link to server-side captures via `request_id` carried in the API call's headers.

This is the killer: clicking a server-side journal request shows the front-end interaction that triggered it (button click, navigation, etc.) WITHOUT any DOM session-replay (privacy-preserving by design).

---

## 20. State snapshot layer (for "exact reproduction" mode)

For cassette-mode replay to truly reproduce a bug, we need to recreate the DB state that the request observed. The journal can opt-in to **state snapshots** at key points.

### 20.1 What gets snapshotted

- **DB pre-state**: rows the request READ (via SELECT) snapshotted before any writes
- **DB post-state**: rows the request WROTE (via INSERT/UPDATE/DELETE) snapshotted after the transaction commits
- **Cache state**: Redis keys read during the request (key + value at read time)
- **External service state**: response bodies from Apollo, MS Graph, AI APIs — already captured via §4.2 payloads
- **Process state at boundaries**: feature-flag snapshot, config snapshot, env-var snapshot (one-time per process, hashed for dedup)

### 20.2 Implementation: tagged read/write logging

Kysely + SQLAlchemy plugins decorate every `SELECT` with a comment containing the `capture_id`. A background process reads `pg_stat_statements` (or logical replication slot for richer data) and joins to journal captures.

For HEAVIER snapshotting (entire row pre-state for forensic reproducibility):

- Kysely middleware: before SELECT, fetch the row's full state (with `SELECT * FROM <table> WHERE id IN (...)`) and store as a separate `capture_kind = 'db.read.snapshot'` row.
- Opt-in per query via `db.selectFrom(t).withSnapshot().where(...).execute()` — NOT default (would 2x query cost).
- For UPDATE/DELETE: use Postgres `OLD.*` triggers OR Debezium CDC to capture before-state.

### 20.3 Storage strategy

Snapshots are payloads — they go in the regular `journal.captures` table with `capture_kind = 'db.read.snapshot'` / `db.write.snapshot' / 'cache.snapshot' / 'config.snapshot'`. Each is subject to the same 256 KB inline + S3 spill rule.

Content-hash dedup is critical here: the same row read 1000× per day stores ONE blob, referenced 1000×.

### 20.4 Replay mode integration

Cassette mode (per §9 Mode A) seeds a local Postgres from snapshots before re-executing. Steps:

1. Spin up local PG (via `repo dev up` from opsbench's CLI? Or testcontainers).
2. Restore from snapshots in `db.read.snapshot` / `db.write.snapshot` captures.
3. Replay request handler with HTTP/SQL/Kafka/MCP cassettes wired.
4. Compare final DB state to recorded `db.write.snapshot` to verify deterministic outcome.

### 20.5 Privacy: snapshots respect the redaction registry

Same field-level redaction (§7.2) applies. A snapshot row of `users` table with `email`, `phone`, `address` is sanitized before storage. The PII never enters the journal.

---

## 21. CLI + REST API actions — the verb surface

The user should be able to operate on every service via uniform commands. The package ships a `journal` CLI (TS + Python implementations are functional twins — see §13) plus a REST API mounted on each service.

### 21.1 The verbs (CLI form)

```
LIST + DISCOVERY
  journal list                         List recent activity, filtered
    --service <name>                   Filter by emitting service
    --actor-kind <USER|SERVICE|WORKFLOW|CRON|AI>
    --actor-id <id>
    --entity <type>:<id>               Filter by entity touched
    --request-id <uuid>                Specific request
    --workflow-id <id>                 All requests in a Temporal workflow
    --correlation-id <id>              Chain of related events
    --since <duration>                 1h / 24h / 7d
    --status <success|error|in-progress>
    --tenant <id>
    --limit <n>
    --format <table|json|tsv>
  journal search <query>               Full-text across event_type + summary
  journal stats <subject>              Aggregate counts per actor / event_type / service

RETRIEVE
  journal show <request_id>            Full event tree for a request
    --include-captures                 Include captures (default: events only)
    --include-payloads                 Include captured payloads (large)
    --include-logs                     Include correlated Pino logs
    --include-trace                    Include OTel trace
    --include-snapshots                Include state snapshots
    --format <tree|flat|json|tui>
  journal tree <request_id>            Visual tree of the request's events
  journal flow <correlation_id>        Cross-service flow follow originating_request_id chain

LOGS + TRACES + ERRORS
  journal logs <request_id>            All Pino logs for this request_id
    --service <name>
    --level <debug|info|warn|error>
    --since <ts>
  journal trace <request_id>           OTel trace bundle (Jaeger-compatible JSON)
    --export-to <file>
  journal errors <request_id>          Error captures + stack traces (queries journal.captures for error.uncaught rows)

REPLAY — the killer feature
  journal rerun <request_id>           Replay the request
    --mode cassette|passthrough|partial
    --checkpoint <event_id>            Partial-mode only
    --target dev|staging|local         Where to replay (cassette = pure local)
    --diff                             Show diff against original output
    --dry-run                          Show what would replay
  journal record <request_id>          Re-record a passthrough as new cassette
  journal compare <id1> <id2>          Side-by-side diff of two requests
  journal repro <request_id>           One-shot local repro setup
    --open-debugger                    Attach VSCode / Cursor debugger
    --seed-db                          Seed dev DB from snapshots
    --print-env                        Show synthetic user envelope

EXPORT
  journal export <request_id>          Export cassette bundle
    --as <vitest|jest|pytest|playwright>
    --output <path>
  journal bundle <request_id>          Export ALL artifacts as ZIP
                                       (events + captures + logs + trace +
                                        snapshots + RUM events)

FOLLOW (live tail)
  journal follow                       Live tail of journal activity
    --service <name>
    --actor-id <id>
    --workflow-id <id>
    --tenant <id>
    --error-only

INTROSPECT
  journal types                        List all event_types + capture_kinds
  journal services                     List all services emitting to journal
  journal workflows                    List all known workflow actor_ids
  journal actors --kind WORKFLOW       List registered actor_ids by kind
  journal redaction --show             Print active redaction registry
  journal retention                    Show retention status per capture_kind

DEBUG
  journal preflight <service>          Verify journal integration is correct
                                       in a service (capture interceptors live,
                                       Pino mixin loaded, OTel span attribs set)

GOVERNANCE
  journal redact <request_id> --field <path>   Post-hoc redaction
  journal soft-delete <request_id> --reason <text>
  journal restore <request_id>         Undo soft-delete (audit half only)
```

### 21.2 REST API surface (mounted per service at `/api/journal`)

Same verbs, HTTP-shaped. Authed via service-to-service mTLS or an admin OAuth scope.

```
GET    /api/journal/requests                  list (query params per §21.1)
GET    /api/journal/requests/:id              show
GET    /api/journal/requests/:id/captures     captures for a request
GET    /api/journal/requests/:id/logs         correlated Pino logs (proxied from Loki)
GET    /api/journal/requests/:id/trace        OTel trace bundle (proxied from SigNoz / Jaeger)
GET    /api/journal/requests/:id/errors       error captures
GET    /api/journal/requests/:id/bundle       full ZIP bundle (signed URL → S3)
POST   /api/journal/replay                    rerun (body: { request_id, mode, target })
POST   /api/journal/export                    export to test fixture
GET    /api/journal/stream                    Server-Sent Events live tail
WS     /api/journal/live                      richer live tail (with payloads)
POST   /api/journal/redact                    post-hoc redaction
DELETE /api/journal/requests/:id              soft-delete (audit half stays)
GET    /api/journal/types                     event_types + capture_kinds
GET    /api/journal/actors                    registered actor_ids by kind
GET    /api/journal/preflight                 self-check
```

All REST endpoints support `?format=json|tsv|tree|ndjson` per `Accept` header.

### 21.3 Cross-service action routing

`journal show <request_id>` works regardless of which service the request originated in. The CLI resolves which service owns the `request_id` (via the journal registry — a tiny PG view of `service ↔ request_id` mappings) and routes to that service's `/api/journal` endpoint.

For requests that span multiple services (cross-service tree via `originating_request_id`), the CLI fans out and merges results client-side.

### 21.4 Permissions (governance)

The journal contains payloads + synthetic user context. Access must be controlled.

- `journal:read:own-tenant` — read your own tenant's data (default for tenant admins)
- `journal:read:all-tenants` — cross-tenant (internal SRE only)
- `journal:replay:any-target` — replay against staging/dev (anyone)
- `journal:replay:against-prod` — passthrough replay against prod (admin only, audit-logged itself)
- `journal:export` — bundle export (sensitive — has payloads)
- `journal:redact` — post-hoc redaction (compliance team)
- `journal:soft-delete` — soft-delete a request (compliance team)

Scopes are JWT claims. The journal client checks them before serving any endpoint. Same Ory Kratos / Keycloak issuer as the rest of the cluster.

### 21.5 Phased delivery

These actions split across the phases in §12:

| Verb family                                       | Phase                                                    |
| ------------------------------------------------- | -------------------------------------------------------- |
| list, show, tree, search, types, services, actors | **Phase D** (Query layer + UI)                           |
| logs, trace, errors                               | **Phase D'** (Observability piping — requires §19 hooks) |
| rerun (cassette), repro                           | **Phase E** (Replay Mode A)                              |
| rerun (passthrough, partial), compare, diff       | **Phase F** (Modes B + C)                                |
| export, bundle                                    | **Phase G** (Test-fixture export)                        |
| flow, follow (cross-service)                      | **Phase H** (Cross-service correlation)                  |
| preflight, redaction, retention                   | **Phase I** (Governance + UI polish)                     |
