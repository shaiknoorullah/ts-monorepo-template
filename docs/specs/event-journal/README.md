# Event Journal — Spec Index

Two parallel architectures for the same requirements (request capture + audit log + replay). Pick ONE; do not merge them.

## R2 — Explicit-decorator + twin-package

`R2-explicit-decorator.md` — 949 lines.

The hand-rolled approach. Full control. ~5,000 LoC, 6+ months to production. Pick if you don't trust OTel + Beyla + ClickHouse for your data plane.

## R3 — OTel-native + PG outbox (RECOMMENDED for greenfield)

`R3-otel-native.md` — 475 lines.

The simpler approach. Beyla + OTel Logs Bridge + `pg_logical_emit_message` outbox + 40 LoC shim per language. ~470 LoC, 2-3 weeks to production.

## Research foundation (7 Feynman team outputs)

All 7 deep-research reports informed these specs:

1. Audit-log packages survey (TS + Python) — Team 1
2. Capture+replay packages survey — Team 2
3. Cross-language single-package patterns — Team 3
4. OTel-as-journal feasibility — Team Alpha
5. Beyla + Go agent feasibility — Team Beta
6. Industry consensus (Stripe / Coinbase / Datadog / etc.) — Team Gamma
7. Tier 2 zero-touch via PgBouncer + Debezium — Team Delta

Research outputs at: `~/work/.handoffs/event-journal/2026-05-22/` (out-of-repo).

## Decision matrix — R2 vs R3

See R3's §0 for the full comparison. TL;DR:

|                       | R2                                           | R3                                               |
| --------------------- | -------------------------------------------- | ------------------------------------------------ |
| Total LoC             | ~5,000+                                      | **~470**                                         |
| Time to production    | 6-12 mo                                      | **2-3 wk**                                       |
| Schema cross-language | Twin pkgs + JSON Schema + JCS conformance CI | **OTel semconv**                                 |
| V2 storage            | `journal.captures` PG table                  | **OTel Logs Bridge → ClickHouse/SigNoz**         |
| V1 audit storage      | `journal.events` PG (Faizan)                 | **Same** (with `pg_logical_emit_message` outbox) |
| Industry precedent    | Mixed (Sentry uses similar; most don't)      | Strong (Datadog, Coinbase, Stripe pattern)       |

## Key constraints both specs share

- V1 audit-of-record stays in Postgres (Faizan's V1)
- Three replay modes (cassette / passthrough / partial)
- Synthetic user envelope with privacy-preserving subject_hash + daily-salt rotation
- 30+ CLI verbs (list/show/rerun/repro/export/etc.) for "git log for prod requests"
- PII redaction via field-level allow/deny registry
- License-clean tooling (MIT/Apache-2.0/BSD/ISC/MPL-2.0 only)
