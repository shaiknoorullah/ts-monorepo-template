---
title: CloudEvents 1.0 + Apicurio Schema Registry
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - 'https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md'
  - 'https://www.apicur.io/registry/docs/apicurio-registry/3.x/index.html'
  - 'https://debezium.io/documentation/reference/stable/integrations/cloudevents.html'
  - 'https://github.com/Aiven-Open/karapace'
  - 'https://docs.confluent.io/platform/current/schema-registry/index.html'
  - 'https://www.apicur.io/registry/docs/apicurio-registry/3.x/getting-started/assembly-running-the-registry.html'
  - 'https://github.com/cloudevents/sdk-javascript'
---

# CloudEvents 1.0 + Apicurio Schema Registry

## Why CloudEvents

[CloudEvents 1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md) (CNCF graduated) standardizes the **envelope** of every event your system produces. The body of an event remains domain-specific, but the metadata that wraps it — `id`, `source`, `type`, `specversion`, `time`, `datacontenttype`, optionally `subject`, `dataschema`, and any custom `ce-*` headers — is uniform across producers.

The payoff is mechanical:

- A consumer in service B can deduplicate events from service A using `(source, id)` without knowing service A's internals.
- Generic infrastructure (Kroxylicious filters, OpenTelemetry tracing, audit pipelines) can introspect events without parsing the domain payload.
- Cross-protocol portability: the same event can travel over Kafka, NATS, HTTP webhook, or AWS EventBridge with a defined binding spec for each.
- Future-proof: when a new transport joins the stack, the envelope already exists; only the binding changes.

Refusing to standardize on CloudEvents leaves every team to invent its own envelope, which guarantees fragmentation between bounded contexts. The cost of adopting CloudEvents is small (a struct shape) and the cost of _not_ adopting is paid every time a new consumer needs to special-case a producer.

## Schema registry choice — Apicurio

Three serious options:

| Registry                  | License                                  | Backing storage           | Kafka-native serializers       | Notes                                                                                   |
| ------------------------- | ---------------------------------------- | ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| Apicurio Registry         | Apache 2.0                               | Postgres / Kafka / in-mem | Yes                            | Operator-managed on K8s, multi-format (Avro, JSON Schema, Protobuf, OpenAPI, AsyncAPI). |
| Karapace (Aiven)          | Apache 2.0                               | Kafka log                 | Yes (Confluent-API compatible) | Single binary in Python. Lighter than Apicurio.                                         |
| Confluent Schema Registry | Confluent CL (source-available, not OSS) | Kafka log                 | Yes                            | Reference implementation. Licence is a problem for many shops.                          |

For this template, **Apicurio Registry 3.x** is the recommendation:

1. Apache 2.0, no commercial-use licensing surprise.
2. Supports CloudEvents schema as a content type (`application/cloudevents+json`) and Avro/JSON Schema/Protobuf.
3. Operator for Kubernetes (`apicurio-registry-operator`) and a clean docker-compose path for development.
4. REST API is Confluent-Schema-Registry-compatible (so existing serializers and Debezium CloudEvents converter Just Work).

Karapace is a valid second choice if you specifically want a Confluent-API-compatible registry with minimal footprint. Confluent Schema Registry should be avoided in this repo for licence reasons.

## Compatibility modes

| Mode         | Producer can                                               | Consumer must                   |
| ------------ | ---------------------------------------------------------- | ------------------------------- |
| **BACKWARD** | add optional fields, delete fields with defaults           | use new schema to read old data |
| **FORWARD**  | delete fields, change defaults                             | use old schema to read new data |
| **FULL**     | only changes that are both backward and forward compatible | either                          |
| **NONE**     | anything                                                   | rebuild                         |

Default to **BACKWARD** for domain events. Reason: consumers are typically upgraded _after_ producers in a rolling deploy; BACKWARD allows the new producer's events to be read by the still-old consumer because old fields are preserved. Use **FULL** for high-stakes contracts (cross-team boundaries).

Document the compatibility mode per topic in `topic-management-runbooks.md`. Changing compatibility mode is itself a breaking change.

## Event naming convention

Reverse-DNS with bounded-context prefix:

```
<tld>.<org>.<bounded-context>.<entity>.<event>
```

Example: `cloud.pnats.orders.order.created`. The `tld.org` prefix is optional for in-cluster events but recommended once events leave the cluster (webhooks, EventBridge), to keep them globally unique. The Kafka topic name drops the `tld.org` for brevity: `orders.order.created`.

## Example schemas

`order.created` (JSON Schema, registered as `cloud.pnats.orders.order.created.v1` in Apicurio):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.pnats.cloud/orders/order.created.v1.json",
  "type": "object",
  "required": ["id", "customer_id", "total", "currency", "items"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "customer_id": { "type": "string", "format": "uuid" },
    "total": { "type": "string", "pattern": "^\\d+\\.\\d{2}$" },
    "currency": { "type": "string", "minLength": 3, "maxLength": 3 },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["sku", "quantity", "unit_price"],
        "properties": {
          "sku": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 },
          "unit_price": { "type": "string", "pattern": "^\\d+\\.\\d{2}$" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

The corresponding CloudEvents envelope (Kafka binary content mode, headers carry the CE attributes, value is the JSON above):

```
Headers:
  ce_specversion:     "1.0"
  ce_id:              "9f2a..."   # outbox row id
  ce_source:          "service.orders"
  ce_type:            "cloud.pnats.orders.order.created"
  ce_subject:         "order/9f2a..."
  ce_time:            "2026-05-22T10:14:33Z"
  ce_dataschema:      "https://schemas.pnats.cloud/orders/order.created.v1.json"
  content-type:       "application/json"
Key: "9f2a..."        # aggregate_id
Value: { ... JSON body ... }
```

`order.fulfilled`:

```json
{
  "$id": "https://schemas.pnats.cloud/orders/order.fulfilled.v1.json",
  "type": "object",
  "required": ["id", "fulfilled_at", "fulfilment_id"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "fulfilled_at": { "type": "string", "format": "date-time" },
    "fulfilment_id": { "type": "string", "format": "uuid" },
    "carrier": { "type": "string" },
    "tracking_url": { "type": "string", "format": "uri" }
  },
  "additionalProperties": false
}
```

## Debezium CloudEvents converter

Debezium's [`io.debezium.converters.CloudEventsConverter`](https://debezium.io/documentation/reference/stable/integrations/cloudevents.html) emits Kafka records as CloudEvents 1.0 directly from the connector. With the Outbox Event Router SMT (see `debezium-outbox-pattern.md`), the outbox row's `type` column becomes `ce_type`, `id` becomes `ce_id`, `payload` becomes the `data` body, and `aggregate_id` becomes the Kafka key. Almost no code is needed on the producer side; the outbox-row-to-CloudEvent mapping is configuration.

```properties
value.converter=io.debezium.converters.CloudEventsConverter
value.converter.serializer.type=json
value.converter.data.serializer.type=json
value.converter.schema.registry.url=http://apicurio:8080/apis/registry/v2
value.converter.json.schemas.enable=true
```

The converter looks up the schema in Apicurio by `ce_type` (or by a configured subject naming strategy) and validates the payload against it before serializing. Invalid records go to the DLQ if `errors.tolerance=all` is set.

## docker-compose recipe

`docker/apicurio.compose.yml` runs `apicurio/apicurio-registry:3.0` backed by a small Postgres (separate from the app DB). Port 8080 exposes the registry UI and REST API.

## Versioning operational rules

1. New schema version is published _before_ any code that produces it.
2. Consumers that have an SLO on the new version subscribe to the schema-changed webhook from Apicurio and re-validate on the next deploy.
3. Removing a schema is forbidden — schemas are append-only. Use a new `vN+1` and let `vN` rot.
4. The CloudEvents `dataschema` header MUST be present on every published event. Consumers MAY fail-closed if it's missing.

## References

- CloudEvents 1.0 spec — https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
- Apicurio Registry docs — https://www.apicur.io/registry/docs/apicurio-registry/3.x/index.html
- Debezium CloudEvents integration — https://debezium.io/documentation/reference/stable/integrations/cloudevents.html
- Karapace — https://github.com/Aiven-Open/karapace
- Confluent Schema Registry — https://docs.confluent.io/platform/current/schema-registry/index.html
- CloudEvents JS SDK — https://github.com/cloudevents/sdk-javascript
