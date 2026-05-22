---
title: Debezium + Transactional Outbox Pattern
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html'
  - 'https://debezium.io/documentation/reference/stable/connectors/postgresql.html'
  - 'https://microservices.io/patterns/data/transactional-outbox.html'
  - 'https://www.postgresql.org/docs/current/logicaldecoding-explanation.html'
  - 'https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/'
  - 'https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-property-publication-name'
  - 'https://www.postgresql.org/docs/current/sql-createpublication.html'
---

# Debezium + Transactional Outbox

## Why outbox over dual-write

A service that needs to publish a domain event after committing a database write has two correctness options:

1. **Transactional Outbox** — insert the event row inside the same DB transaction as the business write. A separate process (Debezium) reads the WAL and publishes to Kafka. The DB commit _is_ the publish.
2. **Two-phase / XA** — distributed transactions across DB and broker. Not practical with Kafka (no XA coordinator).

Everything else is "dual-write": write the row, then publish to Kafka, hope both succeed. That hope is misplaced. If the process crashes between the two writes, you have a row with no event, or an event with no row, depending on ordering. There is no retry that fixes this: retrying the publish risks duplicates _if_ the original succeeded but the ACK was lost; not retrying risks loss. The outbox pattern resolves this by reducing the problem to a single atomic database commit, then letting a log-tailing process (Debezium) deliver at-least-once to Kafka. Idempotent consumers handle the duplicates that at-least-once permits. See Chris Richardson's [microservices.io article](https://microservices.io/patterns/data/transactional-outbox.html) for the canonical write-up and the [Debezium blog](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/) for the original Debezium-specific design.

## Outbox table schema

```sql
CREATE TABLE outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  text NOT NULL,    -- e.g. 'order'
  aggregate_id    text NOT NULL,    -- e.g. order PK
  type            text NOT NULL,    -- e.g. 'order.created'
  payload         jsonb NOT NULL,
  headers         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_aggregate_idx ON outbox(aggregate_type, aggregate_id);
CREATE INDEX outbox_created_at_idx ON outbox(created_at);

-- Ensure the table is in the publication Debezium reads.
ALTER PUBLICATION dbz_publication ADD TABLE outbox;
```

`aggregate_id` becomes the Kafka **key** (so all events for one aggregate land in one partition, preserving per-aggregate order). `type` becomes the event type header, and routes to a per-event topic via Debezium's Outbox Event Router SMT. `payload` is the actual event JSON (CloudEvents-shaped — see `cloudevents-schema-registry.md`).

The application never _reads_ the outbox at runtime, only writes. The cleanup of old rows is decoupled (see TTL section).

## Debezium PostgresConnector config

```json
{
  "name": "outbox-pg",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "${file:/run/secrets/dbz_pw:dbz_pw}",
    "database.dbname": "app",
    "topic.prefix": "app",
    "plugin.name": "pgoutput",
    "publication.name": "dbz_publication",
    "publication.autocreate.mode": "filtered",
    "slot.name": "debezium_outbox",
    "slot.drop.on.stop": "false",
    "table.include.list": "public.outbox",
    "tombstones.on.delete": "false",
    "heartbeat.interval.ms": "10000",
    "heartbeat.action.query": "INSERT INTO debezium_heartbeat (ts) VALUES (now()) ON CONFLICT (id) DO UPDATE SET ts=excluded.ts",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.field.event.id": "id",
    "transforms.outbox.table.field.event.key": "aggregate_id",
    "transforms.outbox.table.field.event.type": "type",
    "transforms.outbox.table.field.event.timestamp": "created_at",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.table.fields.additional.placement": "headers:header,aggregate_type:header:aggregateType",
    "transforms.outbox.route.by.field": "aggregate_type",
    "transforms.outbox.route.topic.replacement": "${routedByValue}.events",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "io.debezium.converters.CloudEventsConverter",
    "value.converter.serializer.type": "json",
    "value.converter.data.serializer.type": "json"
  }
}
```

Key points:

- `plugin.name=pgoutput` is the built-in Postgres logical decoding plugin (no `wal2json` install). Required `wal_level=logical` (see `postgres-ha-patroni-pgbouncer.md`).
- `publication.autocreate.mode=filtered` makes Debezium create the publication for _only_ `public.outbox`, not for the whole DB. Required for least privilege.
- `slot.drop.on.stop=false` — never drop the slot on stop. A dropped slot will lose WAL position, and on restart Debezium will skip everything that happened in between. The safe operational stance is to _delete_ the slot manually after fully draining and decommissioning the connector, and never automatically.
- `heartbeat.interval.ms=10000` + `heartbeat.action.query` writes to a separate heartbeat table inside the publication, which advances the slot's `confirmed_flush_lsn` even when the outbox is idle. **Without this, an idle outbox table on a busy database will wedge the replication slot** and WAL will accumulate indefinitely on the primary disk. This is the failure mode described in the cluster's chi-audit-cdc forensic — see `~/work/ovh/docs/incidents/` for postmortem detail.
- `tombstones.on.delete=false` because we delete outbox rows on TTL cleanup and do not want Kafka to ingest tombstones for routed event topics.
- `value.converter=CloudEventsConverter` produces CloudEvents 1.0 JSON envelopes (see `cloudevents-schema-registry.md`).

## Outbox row TTL

Two viable strategies:

**A. Periodic cleanup CronJob (recommended for clarity).** A `pg-cron` or external job deletes rows older than N days, in batches with `LIMIT`, with `DELETE … WHERE created_at < now() - interval '7 days' RETURNING 1` to keep transactions small.

```sql
-- Run hourly. Keep 7 days of outbox history for replay debugging.
DELETE FROM outbox
WHERE id IN (
  SELECT id FROM outbox
  WHERE created_at < now() - interval '7 days'
  ORDER BY created_at
  LIMIT 10000
);
```

**B. Debezium's drop-after-read** is not safe with Postgres logical replication: there is no callback from Debezium to delete the row. People emulate it with a trigger that deletes after `INSERT` but this defeats the entire purpose (the WAL record for the DELETE is what Debezium reads, so if the insert→delete happens before WAL is flushed, fine; but `synchronous_commit=off` + crash recovery makes this unsafe). Don't.

7 days is the recommended retention because it allows reprocessing during incident response without bloating the table. Tune to your replay needs.

## TypeScript producer-side library (`@pkg/outbox`)

Tiny Kysely-aware helper. The whole package is < 50 lines. It composes with `db.transaction()`.

```ts
// packages/outbox/src/index.ts
import type { Kysely, Transaction } from 'kysely'
import { randomUUID } from 'node:crypto'

export interface OutboxRow {
  id: string
  aggregate_type: string
  aggregate_id: string
  type: string
  payload: Record<string, unknown>
  headers: Record<string, string>
}

export interface OutboxTable {
  outbox: {
    id: string
    aggregate_type: string
    aggregate_id: string
    type: string
    payload: unknown
    headers: unknown
    created_at: Date
  }
}

export async function emit<DB extends OutboxTable>(
  trx: Transaction<DB> | Kysely<DB>,
  event: Omit<OutboxRow, 'id'> & { id?: string },
): Promise<string> {
  const id = event.id ?? randomUUID()
  await trx
    .insertInto('outbox' as never)
    .values({
      id,
      aggregate_type: event.aggregate_type,
      aggregate_id: event.aggregate_id,
      type: event.type,
      payload: event.payload as never,
      headers: event.headers as never,
    } as never)
    .execute()
  return id
}
```

Used as:

```ts
await db.transaction().execute(async (trx) => {
  const order = await trx
    .insertInto('orders')
    .values(input)
    .returning('id')
    .executeTakeFirstOrThrow()
  await emit(trx, {
    aggregate_type: 'order',
    aggregate_id: order.id,
    type: 'order.created',
    payload: { id: order.id, total: input.total },
    headers: { 'ce-source': 'service.orders' },
  })
})
```

If the business `INSERT` fails, the outbox row is rolled back with it. Atomicity preserved.

## Failure modes and recovery

**Slot wedge.** Replication slot `confirmed_flush_lsn` stops advancing → WAL accumulates → `pg_wal/` fills disk. Causes: (a) connector down for hours, (b) outbox is idle and no heartbeat configured, (c) connector throwing on a poison message and not committing. Symptom: `pg_replication_slots.confirmed_flush_lsn` lags behind `pg_current_wal_lsn()` by GB. Recovery: bring the connector back; if the slot is unrecoverable (corrupt or removed table), `pg_drop_replication_slot('debezium_outbox')` + accept loss of un-emitted events + reseed downstream from a snapshot.

**Connector wedge.** Connector running but not advancing. Causes: poison message (deserialization error) or `tasks.max=1` with a stuck thread. Recovery: `DELETE /connectors/outbox-pg/` then re-create; the slot persists and replays from `confirmed_flush_lsn`. Add a `errors.tolerance=all` + `errors.deadletterqueue.topic.name=dlq.outbox` to capture poison messages instead of wedging the whole connector.

**Duplicates.** Debezium delivers at-least-once. Consumers must be idempotent — key on `ce-id` (the CloudEvents event ID, which is the outbox `id`) and `INSERT … ON CONFLICT DO NOTHING` on the consumer's processed-events table.

## References

- Outbox Event Router SMT — https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html
- Debezium Postgres connector — https://debezium.io/documentation/reference/stable/connectors/postgresql.html
- microservices.io Transactional Outbox — https://microservices.io/patterns/data/transactional-outbox.html
- Postgres logical decoding — https://www.postgresql.org/docs/current/logicaldecoding-explanation.html
- Debezium outbox pattern blog — https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/
- Postgres CREATE PUBLICATION — https://www.postgresql.org/docs/current/sql-createpublication.html
