---
title: Postgres HA — CloudNativePG + PgBouncer
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - "https://cloudnative-pg.io/documentation/current/"
  - "https://cloudnative-pg.io/documentation/current/architecture/"
  - "https://www.pgbouncer.org/config.html"
  - "https://patroni.readthedocs.io/en/latest/"
  - "https://github.com/wal-g/wal-g"
  - "https://www.postgresql.org/docs/current/runtime-config-replication.html"
  - "https://github.com/zalando/spilo"
  - "https://cloudnative-pg.io/documentation/current/backup_recovery/"
---

# Postgres HA — CloudNativePG + PgBouncer

## Operator choice: CloudNativePG over Spilo/Patroni in 2026

There are two viable mainstream operators for Postgres on Kubernetes:

- **Spilo + Zalando Postgres Operator** — built on Patroni, the original solution. Battle-tested. Still excellent. Container image includes wal-g, pgBackRest, Patroni, etcd integration. The architecture is mature.
- **CloudNativePG (CNPG)** — CNCF Sandbox project, built ground-up as a Kubernetes-native operator. Uses Postgres' native replication directly, talks to the Kubernetes API for leader election (no Patroni, no etcd dependency). Simpler control plane. Active development by EDB. See the [CNPG architecture doc](https://cloudnative-pg.io/documentation/current/architecture/).

For a new template in 2026, **pick CloudNativePG**. Reasons: (a) one fewer moving part (no Patroni layer to debug), (b) operator handles failover, backup, point-in-time recovery, monitoring, and PgBouncer via dedicated CRDs (`Cluster`, `Backup`, `ScheduledBackup`, `Pooler`), (c) integration with Prometheus and Grafana is built-in, (d) it ships an opinionated `Cluster` API that captures every production setting (synchronous replication, fencing, replica scaling) declaratively.

Use Spilo only if (a) the team already runs it, or (b) you need a feature CNPG hasn't shipped (e.g. logical replication slot management was historically weak in CNPG but is now solid as of 1.24+).

## 3-instance topology (1 primary + 2 sync replicas)

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: pg-app
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/postgresql:16.4
  primaryUpdateStrategy: unsupervised

  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "2GB"
      effective_cache_size: "6GB"
      wal_level: "logical"
      max_wal_senders: "10"
      max_replication_slots: "10"
      max_logical_replication_workers: "8"
      synchronous_commit: "on"
      hot_standby: "on"
      log_min_duration_statement: "200ms"
      log_lock_waits: "on"
      log_temp_files: "0"
      track_io_timing: "on"

  bootstrap:
    initdb:
      database: app
      owner: app
      secret:
        name: app-db-credentials

  storage:
    size: 50Gi
    storageClass: longhorn

  walStorage:
    size: 20Gi
    storageClass: longhorn

  replicationSlots:
    highAvailability:
      enabled: true
    updateInterval: 30

  minSyncReplicas: 1
  maxSyncReplicas: 1   # 1 sync + 1 async = quorum but bounded latency

  backup:
    barmanObjectStore:
      destinationPath: "azure://pg-tenant-ap-south-1-pitr/pg-app"
      azureCredentials:
        connectionString:
          name: azure-storage
          key: connection-string
      wal:
        compression: lz4
        maxParallel: 2
      data:
        compression: lz4
        immediateCheckpoint: false
    retentionPolicy: "30d"

  monitoring:
    enablePodMonitor: true
```

`maxSyncReplicas: 1` is deliberate. Setting `maxSyncReplicas: 2` ties commit latency to the slowest of the two replicas — if one is in a different AZ with a 50 ms RTT, every write pays that cost. 1 sync (chosen near the primary) + 1 async (in a remote AZ) gives durable commits without the long tail.

`wal_level: logical` is required for any Debezium or downstream logical replication consumer. It costs ~5–10 % WAL volume; do not set it on clusters that don't need CDC.

## Backups: wal-g + Azure blob (lz4 only)

CNPG uses **Barman Cloud** out of the box, which writes basebackups + WAL segments to S3/Azure/GCS. The settings above wire Barman to `azure://pg-tenant-ap-south-1-pitr/pg-app`. Compression is `lz4`. **Do not use zstd**: the wal-g/Spilo combo in this organisation's deployments has a [config-reference note](#) that pinned compression to `lz4` after a corruption issue. CNPG/Barman has no such known issue, but the operational rule "lz4 across all Postgres backup tooling" is kept for consistency.

Verify backups:

```bash
kubectl exec -it pg-app-1 -- barman-cloud-backup-list \
  azure://pg-tenant-ap-south-1-pitr/pg-app
```

A backup that hasn't been listed/verified for > 24h triggers paging. CNPG's `ScheduledBackup` CR emits Prometheus metrics for time-since-last-success.

## PgBouncer (transaction-level, via Pooler CRD)

CNPG provides a `Pooler` CRD that runs PgBouncer in front of the cluster. Transaction-level pooling gives the best connection multiplexing but disables some Postgres features (prepared statements, `SET LOCAL`, advisory locks tied to session). Most modern clients (Kysely, pg-node) work fine.

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Pooler
metadata:
  name: pg-app-rw
spec:
  cluster:
    name: pg-app
  instances: 2
  type: rw
  pgbouncer:
    poolMode: transaction
    parameters:
      max_client_conn: "1000"
      default_pool_size: "25"
      reserve_pool_size: "5"
      server_idle_timeout: "60"
      server_lifetime: "3600"
      query_wait_timeout: "120"
---
apiVersion: postgresql.cnpg.io/v1
kind: Pooler
metadata:
  name: pg-app-ro
spec:
  cluster:
    name: pg-app
  instances: 2
  type: ro
  pgbouncer:
    poolMode: transaction
    parameters:
      max_client_conn: "1000"
      default_pool_size: "50"
```

Two separate Services: `pg-app-rw` routes to the current primary (CNPG keeps that label synced on failover); `pg-app-ro` routes to any replica. Application connection strings:

```
DATABASE_URL=postgres://app:***@pg-app-rw:5432/app?sslmode=require
DATABASE_RO_URL=postgres://app:***@pg-app-ro:5432/app?sslmode=require
```

Reads that are tolerant of replication lag (analytics, list views) use the `_RO` URL. Anything correctness-critical uses `_RW`.

## Replication slot hygiene

Logical slots (used by Debezium) accumulate WAL on the primary if the consumer is offline. They are the single most common cause of "primary disk is full" outages on busy CDC setups. Rules:

1. Every slot has a named owner and a documented "what consumes this" in `docs/specs/data-eventing/`.
2. Decommissioning a consumer requires `pg_drop_replication_slot('name')` *in the same change* that removes the consumer.
3. Alert on `pg_replication_slots.confirmed_flush_lsn` lag > 1 GB.
4. Never use `pg_replication_slot_advance()` to silence the alert without checking that the consumer is actually done with the LSN range. That manoeuvre is data loss in slow motion.

See `debezium-outbox-pattern.md` for connector-side mitigations (heartbeats).

## docker-compose recipe

`docker/postgres-ha.compose.yml` provides a 1-primary + 1-replica setup using the upstream `postgres:16` image and `bitnami/pgbouncer:1.23`. It is *not* HA (no failover automation), but it mirrors the production topology for development. It enables `wal_level=logical`, creates the `debezium` user with `REPLICATION`, and starts a WAL archiving sidecar that writes to a local `pgwal/` volume. For production, run CloudNativePG on Kubernetes — compose is for dev only.

## References

- CloudNativePG docs — https://cloudnative-pg.io/documentation/current/
- CNPG architecture — https://cloudnative-pg.io/documentation/current/architecture/
- CNPG backup/recovery — https://cloudnative-pg.io/documentation/current/backup_recovery/
- PgBouncer config reference — https://www.pgbouncer.org/config.html
- Patroni docs (for context) — https://patroni.readthedocs.io/en/latest/
- wal-g GitHub — https://github.com/wal-g/wal-g
- Spilo (Zalando) — https://github.com/zalando/spilo
- Postgres replication config — https://www.postgresql.org/docs/current/runtime-config-replication.html
