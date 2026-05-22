---
title: Kafka (KRaft) — Single-Node to Multi-Broker Scale Path
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - 'https://kafka.apache.org/documentation/#kraft'
  - 'https://developer.confluent.io/learn/kraft/'
  - 'https://strimzi.io/docs/operators/latest/deploying.html'
  - 'https://strimzi.io/blog/2024/03/21/kraft-migration/'
  - 'https://kafka.apache.org/documentation/#configuration'
  - 'https://github.com/strimzi/strimzi-kafka-operator'
  - 'https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready'
---

# Kafka (KRaft) — Single-Node to Multi-Broker Scale Path

## Why KRaft, not ZooKeeper

ZooKeeper has been removed from Apache Kafka 4.0 (Mar 2025). KRaft (Kafka Raft metadata mode) is the only supported metadata quorum going forward. The KRaft promotion to production-ready landed in [KIP-833](https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready) and its removal of ZooKeeper was completed in [KIP-833 / KIP-866](https://kafka.apache.org/documentation/#kraft). For any deployment created in 2026, **never** stand up a ZooKeeper ensemble — there is no upgrade path forward, and the operational surface (3 ZK pods, ZK ACLs, ZK JMX, leader election) is gone.

KRaft uses Raft consensus inside the broker process itself. Metadata (topics, configs, ACLs, partition assignments) lives in an internal compacted topic `__cluster_metadata` replicated across the _controllers_ (a subset of nodes). For dev or smallest-prod this can be a single node that is both controller and broker (`process.roles=controller,broker`). For production it is at least 3 dedicated controllers + N brokers, or 3 combined nodes (combined mode is supported but not recommended above one-machine-dev — see the [Strimzi KRaft migration guide](https://strimzi.io/blog/2024/03/21/kraft-migration/)).

## Single-node KRaft for dev and smallest-prod

A single-node KRaft cluster is acceptable for:

- Local development (in `docker-compose`)
- CI integration tests
- Internal tooling clusters where data loss on node loss is tolerable

It is **not** acceptable for any workload where:

- The cluster is the source of truth for events that drive other systems (CDC, outbox).
- Consumer commits must survive a single host failure.
- `min.insync.replicas` > 1 is required by an SLO.

For all those, you need ≥ 3 brokers with `replication.factor=3` and `min.insync.replicas=2`.

## Production checklist (per-topic and per-cluster)

Cluster-level (`server.properties` / Strimzi CR):

| Setting                                    | Single-node dev     | Small prod (3 broker)  | Large prod (5+)              |
| ------------------------------------------ | ------------------- | ---------------------- | ---------------------------- |
| `process.roles`                            | `controller,broker` | `controller,broker` x3 | `controller` x3, `broker` x5 |
| `default.replication.factor`               | 1                   | 3                      | 3                            |
| `min.insync.replicas`                      | 1                   | 2                      | 2                            |
| `offsets.topic.replication.factor`         | 1                   | 3                      | 3                            |
| `transaction.state.log.replication.factor` | 1                   | 3                      | 3                            |
| `transaction.state.log.min.isr`            | 1                   | 2                      | 2                            |
| `unclean.leader.election.enable`           | false               | false                  | false                        |
| `log.retention.hours`                      | 168 (7d)            | 168                    | per-topic override           |
| `log.segment.bytes`                        | 1 GiB               | 1 GiB                  | 1 GiB                        |
| `auto.create.topics.enable`                | false               | false                  | false                        |

`auto.create.topics.enable=false` is non-negotiable in production. Auto-creation gives you topics with `replication.factor=1` and the default partition count, which silently violates your durability promises. Topics are managed via GitOps (Strimzi `KafkaTopic` CRs or a `kafka-topics.sh --create` script with explicit args).

Per-topic class defaults (see `topic-management-runbooks.md` for the full naming standard):

| Class                          | Partitions | Replication | Retention | Cleanup policy |
| ------------------------------ | ---------- | ----------- | --------- | -------------- |
| Domain events (outbox-emitted) | 6          | 3           | 7 d       | delete         |
| CDC streams (Debezium)         | 6–12       | 3           | 3 d       | delete         |
| Compacted state topics         | 6          | 3           | infinite  | compact        |
| Audit / immutable log          | 12         | 3           | 90 d      | delete         |
| DLQ                            | 3          | 3           | 14 d      | delete         |

`log.compaction` requires tombstones (null-valued records) to delete keys. Compacted topics must always have a key set on the producer side; null-keyed records on a compacted topic cause Kafka to log warnings and never compact.

## Strimzi Kafka operator (Kubernetes path)

[Strimzi](https://strimzi.io/docs/operators/latest/deploying.html) is the recommended operator for Kubernetes. Minimal KRaft `Kafka` CR for a single combined node (development):

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaNodePool
metadata:
  name: combined
  labels:
    strimzi.io/cluster: events
spec:
  replicas: 1
  roles: [controller, broker]
  storage:
    type: persistent-claim
    size: 50Gi
    deleteClaim: false
---
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: events
  annotations:
    strimzi.io/node-pools: enabled
    strimzi.io/kraft: enabled
spec:
  kafka:
    version: 3.9.0
    metadataVersion: 3.9-IV0
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
    config:
      default.replication.factor: 1
      min.insync.replicas: 1
      offsets.topic.replication.factor: 1
      transaction.state.log.replication.factor: 1
      auto.create.topics.enable: 'false'
```

For 3-broker production, change `replicas: 3`, swap the listener `tls: true`, add `authorization: { type: simple }`, and bump every replication factor to 3. `KafkaTopic` CRs are then declarative:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: orders.order.created
  labels:
    strimzi.io/cluster: events
spec:
  partitions: 6
  replicas: 3
  config:
    retention.ms: 604800000
    cleanup.policy: delete
    min.insync.replicas: 2
```

## docker-compose recipe (smallest prod-grade single-node KRaft)

See `docker/kafka.compose.yml`. It uses the `apache/kafka:3.9.0` image (the upstream image, not Confluent's), runs in combined mode, persists `/var/lib/kafka/data`, exposes 9092 internally and 19092 to the host with `advertised.listeners` split, and disables auto-create. It is intended to be paired with a `kafka-init` one-shot container that creates the topic list from a YAML.

## When to scale 1 → 3 → 5

Trigger scaling **before** any of:

- **1 → 3 brokers** when (a) Kafka becomes load-bearing for any event consumed cross-service, or (b) host-loss would violate any consumer's at-least-once contract. Concrete: outbox or CDC is wired into the cluster, or any non-test consumer commits offsets.
- **3 → 5 brokers** when (a) aggregate broker CPU exceeds 60 % at p95 for a week, (b) any single broker reaches 70 % disk usage, (c) network throughput is approaching NIC saturation (~ 70 %), or (d) the largest topic's per-partition throughput exceeds 10 MB/s sustained (rebalance becomes expensive). Adding brokers requires a partition reassignment (`kafka-reassign-partitions.sh`).
- Beyond 5 you start considering tiered storage (KIP-405) or splitting into multiple clusters by bounded context — but that is outside the scope of this template.

A single-node cluster has **no** failover. Restarts are visible to all producers and consumers. Plan a maintenance window or scale to 3 before any production traffic.

## References

- Apache Kafka KRaft docs — https://kafka.apache.org/documentation/#kraft
- Confluent KRaft learning path — https://developer.confluent.io/learn/kraft/
- KIP-833 (KRaft production-ready) — https://cwiki.apache.org/confluence/display/KAFKA/KIP-833
- Strimzi deploying docs — https://strimzi.io/docs/operators/latest/deploying.html
- Strimzi KRaft migration blog — https://strimzi.io/blog/2024/03/21/kraft-migration/
- Strimzi GitHub — https://github.com/strimzi/strimzi-kafka-operator
- Kafka config reference — https://kafka.apache.org/documentation/#configuration
