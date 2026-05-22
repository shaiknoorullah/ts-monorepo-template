---
title: Kafka Topic Management Runbooks
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - 'https://kafka.apache.org/documentation/#topicconfigs'
  - 'https://kafka.apache.org/documentation/#operations'
  - 'https://strimzi.io/docs/operators/latest/deploying.html#con-kafka-topic-str'
  - 'https://docs.confluent.io/platform/current/installation/configuration/topic-configs.html'
  - 'https://kafka.apache.org/documentation/#log_compaction'
  - 'https://cwiki.apache.org/confluence/display/KAFKA/KIP-455%3A+Create+an+Administrative+API+for+Replica+Reassignment'
---

# Kafka Topic Management Runbooks

## Naming convention

```
<bounded-context>.<entity>.<event-type>
```

Examples:

- `orders.order.created`
- `orders.order.fulfilled`
- `inventory.stock.adjusted`
- `cdc.public.orders` — CDC stream from Postgres `public.orders`
- `audit.events` — global audit sink
- `dlq.orders.order.created` — dead-letter for the corresponding event topic

Rules:

1. All lowercase, dot-separated, no underscores.
2. Bounded context is the _first_ segment — never the entity. (`orders.order.created`, not `order.orders.created`.) This makes `--topic-pattern` filters in admin tools natural: `orders.*` lists everything for orders.
3. Past-tense verbs for events (`created`, `updated`, `deleted`, `fulfilled`).
4. DLQ topics mirror the source topic name prefixed with `dlq.`.
5. CDC topics are prefixed with `cdc.` to distinguish them from outbox-emitted events. CDC streams reflect _all_ row changes (including transient state) and are not safe to consume as domain events.

## Per-topic config standards

| Topic class            | Partitions | Replication | Retention | Cleanup policy | min.insync.replicas | Compatibility |
| ---------------------- | ---------- | ----------- | --------- | -------------- | ------------------- | ------------- |
| Domain events (outbox) | 6          | 3           | 7 days    | delete         | 2                   | BACKWARD      |
| CDC streams            | 6–12       | 3           | 3 days    | delete         | 2                   | BACKWARD      |
| Compacted state        | 6          | 3           | infinite  | compact        | 2                   | FULL          |
| Audit / immutable      | 12         | 3           | 90 days   | delete         | 2                   | BACKWARD      |
| DLQ                    | 3          | 3           | 14 days   | delete         | 2                   | NONE          |

Partition count is chosen for **target throughput** and **target consumer parallelism**. A consumer group can have at most P consumers actually doing work, where P = partition count. 6 partitions accommodates 6-way parallelism, which is enough for most domain event streams. CDC streams of large tables may need 12+. Once chosen, partition count is effectively immutable — see "increase partitions" runbook below for why.

## Runbook 1 — Create a topic

For a new domain event topic:

```bash
kafka-topics.sh --bootstrap-server kafka:9092 --create \
  --topic orders.order.created \
  --partitions 6 \
  --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000 \
  --config compression.type=producer
```

GitOps equivalent (Strimzi):

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
    min.insync.replicas: 2
    cleanup.policy: delete
    retention.ms: 604800000
```

Acceptance: `kafka-topics --describe` shows the topic with the expected config, all partitions have 3 in-sync replicas, leader is balanced.

## Runbook 2 — Delete a topic

**Pre-flight:**

- Verify no active consumer groups: `kafka-consumer-groups --bootstrap-server kafka:9092 --all-groups --describe | grep <topic>`.
- Verify no producer is writing: `kafka-log-dirs --bootstrap-server kafka:9092 --topic-list <topic>` shows segment age > 1h.
- Snapshot the topic to object storage if any consumer might still need replay (Kafka Connect S3 sink → archive).
- Open a 24-hour quarantine window: drop ACLs so nothing can write to it, but keep the topic itself. Watch metrics for any caller hitting `UNKNOWN_TOPIC_OR_PARTITION`.

**Delete:**

```bash
kafka-topics --bootstrap-server kafka:9092 --delete --topic <topic>
```

Strimzi: delete the `KafkaTopic` CR with `kubectl delete kafkatopic <name>`. The Topic Operator handles the broker-side delete.

**Verify:** `kafka-topics --list` no longer shows the topic. `kafka-log-dirs` shows the segments removed from each broker within minutes.

## Runbook 3 — Increase partitions (FORBIDDEN in most cases — read carefully)

Increasing partitions on an existing topic is technically supported:

```bash
kafka-topics --bootstrap-server kafka:9092 --alter --topic <topic> --partitions 12
```

**It is forbidden in most cases** because it silently breaks key-based ordering. Records with key `K` are placed on partition `hash(K) mod P`. When `P` changes, the _same_ key starts going to a _different_ partition. Consumers that rely on per-key order (which is most of them) will now see records for `K` arrive on two partitions, potentially out of order. This corrupts state machines downstream — and there is no error from Kafka.

Allowed cases:

- The topic has no keys (round-robin produce). Partition count change has no ordering implication.
- All consumers have been drained, paused, or upgraded to a key-aware state-rebuild that tolerates re-keying.
- The topic has just been created with low traffic and < 1h of data.

Forbidden cases:

- Any keyed topic with active consumers. Period. Either create a new topic with the higher partition count and migrate producers, or live with the original count.

The correct migration pattern: produce a one-time `*.v2` topic with the new partition count, dual-write from producers for one consumer-deploy cycle, switch consumers to the v2 topic, stop the v1 producers, then delete v1.

## Runbook 4 — Rotate Kroxylicious record-encryption keys

(Only applies if Kroxylicious record encryption is enabled — see `kroxylicious-kafka-proxy.md`.)

1. Rotate the KEK in the KMS (Vault Transit): `vault write -f transit/keys/kek-<topic>/rotate`.
2. Confirm Kroxylicious picks up the new KEK version: tail logs for `KEK rotated to version=N+1`.
3. **Do not re-encrypt existing records.** Each batch carries a wrapped DEK that references the KEK version it was wrapped with. The KMS retains old versions for decrypt indefinitely (verify with `vault read transit/keys/kek-<topic>`).
4. New produces use the new KEK; consumers transparently use the right version per batch.
5. After 90 days, audit Vault to confirm old KEK versions are still queryable. Never delete an old KEK version that any retained record could be using.

## Runbook 5 — Drain consumer lag

When `kafka-consumer-groups --describe` shows lag > 1M records (or a documented SLO breach):

1. **Diagnose** — Is the consumer slow (low throughput) or stopped (zero throughput)? `kafka-consumer-groups --members --verbose` shows assignment per member.
2. **If stopped**: restart the consumer, investigate the crash. Lag is a symptom — fix the root cause first.
3. **If slow**: scale horizontally up to the partition count. If the consumer is already at P workers, the topic is partition-bound and the only options are (a) accept the lag, (b) optimize the consumer, (c) migrate to a higher-partition topic via Runbook 3's "create v2" path.
4. **Skipping lag is forbidden** without an explicit incident sign-off. Setting `auto.offset.reset=latest` and resetting offsets to head is data loss. Document it as such if you do it.

```bash
# Inspect lag
kafka-consumer-groups --bootstrap-server kafka:9092 --group <g> --describe

# Reset offsets (only with sign-off!)
kafka-consumer-groups --bootstrap-server kafka:9092 --group <g> \
  --reset-offsets --to-latest --topic <topic> --execute
```

## Runbook 6 — Rebalance partition leadership

After a broker restart or scale, partitions may be unevenly distributed. Symptoms: one broker is 80 % CPU while others sit at 20 %.

```bash
# Inspect
kafka-topics --bootstrap-server kafka:9092 --describe --under-replicated-partitions
kafka-topics --bootstrap-server kafka:9092 --describe --at-min-isr-partitions

# Trigger preferred-leader election (cheap)
kafka-leader-election --bootstrap-server kafka:9092 --election-type preferred --all-topic-partitions
```

If still imbalanced, generate a reassignment plan:

```bash
# Plan
kafka-reassign-partitions --bootstrap-server kafka:9092 \
  --generate --topics-to-move-json-file topics.json \
  --broker-list "1,2,3,4,5" > plan.json

# Execute (throttled to avoid melting the network)
kafka-reassign-partitions --bootstrap-server kafka:9092 \
  --execute --reassignment-json-file plan.json \
  --throttle 50000000  # 50 MB/s
```

Always throttle. Unthrottled reassignment can consume the entire NIC and starve normal traffic.

## Runbook 7 — Increase retention

```bash
kafka-configs --bootstrap-server kafka:9092 --entity-type topics \
  --entity-name <topic> --alter --add-config retention.ms=2592000000
```

(30 days = 2,592,000,000 ms.) Strimzi: edit the `KafkaTopic` CR's `spec.config.retention.ms`.

**Decrease retention** is a different runbook — it triggers a one-time log-cleaner pass that can spike disk I/O. Schedule during low traffic.

## Runbook 8 — Promote a topic to compacted

(Reasonable for state topics, e.g., a "current state of order" topic backing a materialized view.)

1. Verify every record on the topic has a non-null key. (`kafka-console-consumer --property print.key=true` and sample.)
2. Apply: `kafka-configs --alter --add-config cleanup.policy=compact,delete --entity-name <topic>`. The mixed policy keeps a time-based ceiling.
3. Tune compaction: `min.cleanable.dirty.ratio=0.5` (default) is fine for most; lower for high-key-churn topics.
4. Wait for compaction to run; verify `kafka-log-dirs` shows segment count decreasing on the topic.

## Forbidden operations

| Operation                                            | Why forbidden                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--delete --topic <broad pattern>`                   | A typo deletes too many topics. Always single-topic, always with confirmation.                                                |
| Decrease partition count                             | Not supported at all by Kafka. There is no API.                                                                               |
| `auto.create.topics.enable=true`                     | Creates topics with `replication.factor=1` — silent durability violation.                                                     |
| `unclean.leader.election.enable=true`                | Promotes an out-of-sync replica → data loss. Only enable for non-durable caches.                                              |
| Drop replication factor on an existing topic         | Risk window where the topic has fewer replicas than expected. Use partition reassignment to move replicas, not config change. |
| Run `kafka-reassign-partitions` without `--throttle` | Saturates the NIC, takes the cluster down for normal traffic.                                                                 |
| Reset consumer offsets to skip data without sign-off | Data loss. Document as an incident.                                                                                           |

## Monitoring KPIs per topic

- **Lag** — `kafka_consumergroup_lag` (Kafka Exporter / JMX). Alert when lag > 1M records or > 60s of throughput.
- **Throughput** — `kafka_topic_partition_current_offset` rate. Track per-topic, alert on > 50 % drop vs 7-day baseline.
- **Replica health** — `kafka_topic_partition_under_replicated_partition` > 0 for > 5 minutes. Page.
- **ISR shrink rate** — `kafka_server_replica_manager_isr_shrinks` > 0 / s sustained means a replica is struggling.
- **Producer error rate** — `kafka_producer_record_error_rate` per app. > 0.1 % is a problem.

## References

- Kafka topic configs — https://kafka.apache.org/documentation/#topicconfigs
- Kafka operations — https://kafka.apache.org/documentation/#operations
- Log compaction — https://kafka.apache.org/documentation/#log_compaction
- Strimzi KafkaTopic — https://strimzi.io/docs/operators/latest/deploying.html#con-kafka-topic-str
- Confluent topic config reference — https://docs.confluent.io/platform/current/installation/configuration/topic-configs.html
- KIP-455 (replica reassignment API) — https://cwiki.apache.org/confluence/display/KAFKA/KIP-455
