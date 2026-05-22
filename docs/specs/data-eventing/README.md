---
title: Data & Eventing Layer — Specs Index
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
---

# Data & Eventing Layer

Specifications for the data-plane and eventing infrastructure shipped with this template. Each spec is independently consumable; together they describe the recommended stack for a 2026 event-driven TypeScript monorepo.

## Stack overview

```
        ┌──────────────────────────────────────────────────────────┐
        │                       App services                       │
        │  (NestJS / Fastify / Next.js, using @pkg/db + @pkg/outbox)│
        └─────────────┬─────────────────────────┬──────────────────┘
                      │                         │
                      ▼                         ▼
              ┌──────────────┐         ┌──────────────────┐
              │  Postgres    │         │  Redis Cluster   │
              │ (CloudNativePG)         │ (3 master+3 rep) │
              │ + pgBouncer   │         └──────────────────┘
              │ + outbox tbl  │
              └──────┬───────┘
                     │ WAL
                     ▼
              ┌──────────────┐    schema    ┌──────────────────┐
              │  Debezium    │◀────────────▶│  Apicurio        │
              │  Connect     │              │  Schema Registry │
              └──────┬───────┘              └──────────────────┘
                     │ CloudEvents 1.0
                     ▼
              ┌──────────────┐
              │ Kroxylicious │  (encryption, multi-tenancy, audit)
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │  Kafka       │
              │  (KRaft)     │
              └──────────────┘
```

## Specs

| # | Spec | Topic |
|---|---|---|
| 1 | [kafka-single-node-kraft.md](./kafka-single-node-kraft.md) | Kafka with KRaft — single-node to multi-broker scale path |
| 2 | [kroxylicious-kafka-proxy.md](./kroxylicious-kafka-proxy.md) | Kroxylicious proxy — encryption, multi-tenancy, audit |
| 3 | [cloudevents-schema-registry.md](./cloudevents-schema-registry.md) | CloudEvents 1.0 + Apicurio schema registry |
| 4 | [debezium-outbox-pattern.md](./debezium-outbox-pattern.md) | Debezium + transactional outbox pattern |
| 5 | [postgres-ha-patroni-pgbouncer.md](./postgres-ha-patroni-pgbouncer.md) | Postgres HA — CloudNativePG + PgBouncer |
| 6 | [redis-cluster.md](./redis-cluster.md) | Redis Cluster — 3 master + 3 replica |
| 7 | [kysely-db-package.md](./kysely-db-package.md) | `@pkg/db-client` — typed Kysely instance + Atlas migrations |
| 8 | [topic-management-runbooks.md](./topic-management-runbooks.md) | Kafka topic management runbooks |

## Companion docker-compose files

All compose files live in [`docker/`](../../../docker/) and share named networks (`events`, `data`, `cache`, `obs`) so they can be composed together.

| File | Purpose |
|---|---|
| `docker/kafka.compose.yml` | Single-node KRaft Kafka + topic bootstrap |
| `docker/kroxylicious.compose.yml` | Kroxylicious proxy in front of Kafka |
| `docker/apicurio.compose.yml` | Apicurio Registry 3 + Postgres backing store |
| `docker/debezium.compose.yml` | Debezium Connect with CloudEvents converter |
| `docker/postgres-ha.compose.yml` | Postgres primary + replica + pgBouncer (rw, ro) |
| `docker/redis-cluster.compose.yml` | 6-node Redis Cluster (3 master + 3 replica) |
| `docker/observability-deps.compose.yml` | Prometheus, Grafana, OTel Collector, exporters |

Bring the whole stack up:

```bash
docker compose \
  -f docker/kafka.compose.yml \
  -f docker/postgres-ha.compose.yml \
  -f docker/redis-cluster.compose.yml \
  -f docker/apicurio.compose.yml \
  -f docker/debezium.compose.yml \
  -f docker/kroxylicious.compose.yml \
  -f docker/observability-deps.compose.yml \
  up -d
```

The `kysely-db-package` and `topic-management-runbooks` specs are pure documentation and do not have compose files.

## Reading order

If you are new to the stack, read in this order:

1. **postgres-ha-patroni-pgbouncer** — the storage substrate.
2. **kysely-db-package** — how app code talks to the database.
3. **debezium-outbox-pattern** — how events leave the database safely.
4. **cloudevents-schema-registry** — the wire format and contract enforcement.
5. **kafka-single-node-kraft** — the transport.
6. **topic-management-runbooks** — day-2 operations on Kafka.
7. **kroxylicious-kafka-proxy** — the optional policy layer.
8. **redis-cluster** — the cache substrate.

## Status

All specs are `status: draft` as of 2026-05-22. Implementation is gated on consolidation review.
