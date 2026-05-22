---
title: Edge + Observability + Multi-Tenancy Specs
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
---

# Edge, Observability & Multi-Tenancy

This directory holds the design specs for the edge layer (API gateway, load balancer), multi-tenancy (Postgres schema-per-tenant), observability (SigNoz APM + Prom/Loki/Tempo), and the docker-compose variants that ship them.

These are **specs**, not implementation. Code lives in `apps/`, `packages/`, `infra/`, and `docker/`. Each spec is authoritative: if code drifts from the spec, the PR must update the spec in the same change.

## Reading order

1. [`api-gateway-alternatives.md`](./api-gateway-alternatives.md) — Kong replacements, decision matrix, winner = **Envoy Gateway** (K8s) + **Traefik** (compose).
2. [`multi-tenancy-schema-based.md`](./multi-tenancy-schema-based.md) — schema-per-tenant in Postgres, `SET LOCAL search_path`, pool considerations, `@pkg/tenancy` interface.
3. [`docker-compose-variants.md`](./docker-compose-variants.md) — `compose.prod-smallest.yml`, `compose.dev.yml`, `compose.dev-tools.yml`; resource limits, healthchecks, merge patterns.
4. [`signoz-apm.md`](./signoz-apm.md) — OTel-native APM on ClickHouse, two-tier collector, `@pkg/telemetry` package, alerts.
5. [`load-balancer.md`](./load-balancer.md) — L4 vs L7, MetalLB / Cilium / HAProxy, failover topology.
6. [`observability-prom-grafana-loki-tempo.md`](./observability-prom-grafana-loki-tempo.md) — platform observability alongside SigNoz, Vector for shipping, conventions.

## Dependencies between specs

```
api-gateway-alternatives ──┐
                           ├──► docker-compose-variants
load-balancer ─────────────┘            │
                                        ▼
multi-tenancy-schema-based ──► signoz-apm ──► observability-prom-grafana-loki-tempo
```

- The chosen gateway (Envoy Gateway / Traefik) wires `x-tenant-id` headers consumed by `@pkg/tenancy`.
- `@pkg/tenancy` adds `tenant.id` span attributes consumed by SigNoz dashboards.
- SigNoz handles app APM; Prom/Loki/Tempo handle platform telemetry. They cross-pivot via Grafana derived fields.
- docker-compose variants are the runnable artifact of all the above for staging + dev.

## Status

| Spec | Status | Owner | Next step |
|---|---|---|---|
| api-gateway-alternatives | draft | @shaiknoorullah | ADR-0007 to ratify Envoy Gateway pick |
| multi-tenancy-schema-based | draft | @shaiknoorullah | Land `@pkg/tenancy` package |
| docker-compose-variants | draft | @shaiknoorullah | Wire actual files in `docker/` |
| signoz-apm | draft | @shaiknoorullah | `@pkg/telemetry` package + collector configs |
| load-balancer | draft | @shaiknoorullah | MetalLB IPPool yaml in `infra/k8s/` |
| observability-prom-grafana-loki-tempo | draft | @shaiknoorullah | `@pkg/metrics-conventions` package |

## Cross-references

- Eventing / Kafka / Schema Registry — see `../data-eventing/` (separate spec set).
- ADRs that ratify these decisions — `../../adrs/`.
- Runbooks for the alerts named here — `../../runbooks/` (to be created).

## Conventions used in these specs

- Every spec has YAML frontmatter (`title`, `status`, `last_updated`, `owners`, `references`).
- Status moves: `draft → reviewed → ratified → superseded`.
- All config snippets in specs are **real, runnable** (not pseudo-code). If you copy-paste, it works (after envs are set).
- All external URLs in `references` are checked and current as of the `last_updated` date.
- Every spec ends with a "Known footguns" or "Open questions" section.
