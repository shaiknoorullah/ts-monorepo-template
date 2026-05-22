---
title: Kroxylicious — Kafka Proxy for Encryption, Multi-Tenancy, and Audit
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - "https://kroxylicious.io/"
  - "https://github.com/kroxylicious/kroxylicious"
  - "https://kroxylicious.io/docs/v0.10.0/"
  - "https://kroxylicious.io/docs/v0.10.0/#assembly-record-encryption"
  - "https://kroxylicious.io/docs/v0.10.0/#assembly-multi-tenancy"
  - "https://kafka.apache.org/protocol"
  - "https://github.com/kroxylicious/kroxylicious/tree/main/kroxylicious-filters"
---

# Kroxylicious — Kafka Proxy for Encryption, Multi-Tenancy, and Audit

## What it is

[Kroxylicious](https://kroxylicious.io/) is an Apache 2.0 transparent Kafka network proxy. It speaks the Kafka wire protocol on both sides (client→proxy and proxy→broker) and runs a filter chain on every request and response. Filters can mutate records, reject requests, rewrite topic names, inject headers, or terminate the connection. The project is hosted at [github.com/kroxylicious/kroxylicious](https://github.com/kroxylicious/kroxylicious) and ships first-party filters for record encryption, multi-tenancy, schema enforcement, and audit logging.

The model is "sidecar to the cluster, not the broker": deploy 1+ Kroxylicious instances in front of an existing Kafka cluster, point clients at the proxy, and Kafka is unchanged. The proxy is stateless (configuration only) and horizontally scalable.

## Why use it

The standard objection to proxies is latency. Kroxylicious adds 1-2 ms per round-trip in practice (Java + Netty, zero-copy paths for unmodified records). In return you get capabilities that **cannot be implemented inside Kafka itself**:

1. **Record encryption at rest** with envelope keys per topic, where the broker never sees the plaintext. KMS holds the data encryption keys; the proxy decrypts on the way out to clients. Compromise of the broker disk does not yield plaintext.
2. **Multi-tenancy by topic-prefix isolation** — tenant A and tenant B share one cluster, see different namespaces, can never read each other's topics or consumer groups. Without Kroxylicious, multi-tenancy on Kafka is done with ACLs, which is rule-by-rule and historically leaky.
3. **Schema enforcement at the wire** — reject any produce whose value doesn't validate against the Apicurio schema for that topic. Removes the trust-the-producer assumption.
4. **Audit log** — every produce/fetch/admin call is emitted as a structured log line with principal, topic, partition, size, and (for produce) a hash of the record. Feeds a SIEM directly.

Each is independently a reason to deploy the proxy. Combined, the proxy becomes the policy-enforcement point for the whole cluster.

## Production-relevant filters

### Record encryption (envelope encryption)

Each topic is associated with a **KEK** (key encryption key) in an external KMS (Vault Transit, AWS KMS, GCP KMS, Azure Key Vault). For each batch of records, Kroxylicious generates a **DEK** (data encryption key), encrypts records with the DEK, encrypts the DEK with the KEK, and stores the wrapped DEK as a record header. Consumers go through the proxy, which uses the KMS to unwrap the DEK and decrypt records on read. The broker only ever sees ciphertext + wrapped DEK.

```yaml
filters:
  - type: RecordEncryption
    config:
      kms: VaultKmsService
      kmsConfig:
        vaultTransitEngineUrl: "https://vault.example.com/v1/transit"
        vaultToken: "${env:VAULT_TOKEN}"
      selector: TemplateKekSelector
      selectorConfig:
        template: "kek-${topicName}"
```

The KEK can rotate at the KMS level; old records remain readable because the wrapped DEK was wrapped with the *prior* KEK version, and the KMS keeps prior versions for decrypt. This is the standard envelope-encryption pattern.

### Multi-tenancy

```yaml
filters:
  - type: MultiTenant
    config:
      prefixResourceNameStrategy:
        delimiter: "."
```

When tenant `acme` connects with credentials that carry the principal `tenant.acme.*`, the proxy rewrites all topic names so that `acme.orders` on the wire becomes `orders` to the tenant; `acme` cannot list, produce to, or consume from any topic outside its prefix. Consumer group names are prefixed the same way. The cluster itself is unaware of tenants — it sees ordinary topic names.

### Schema enforcement (produce-time validation)

A filter that, on every `Produce` request, looks up the schema for the topic from Apicurio and validates each record's value. Mismatches are returned as `INVALID_RECORD` and never reach the broker. Configuration:

```yaml
filters:
  - type: ValidateSchema
    config:
      registry:
        url: "http://apicurio:8080/apis/registry/v2"
      onValidationFailure: REJECT       # or DLQ
      cacheTtlSeconds: 60
```

### Audit log

```yaml
filters:
  - type: ApiLogging          # built-in
    config:
      includePrincipal: true
      includeBytes: false     # don't log payloads
      includeTopicPartition: true
      sink: stdout            # or kafka:audit.events
```

## Full proxy config example (4 filters wired)

```yaml
# kroxylicious-config.yaml
adminHttp:
  endpoints:
    prometheus: {}

virtualClusters:
  events:
    targetCluster:
      bootstrap_servers: kafka:9092
    clusterNetworkAddressConfigProvider:
      type: PortPerBrokerClusterNetworkAddressConfigProvider
      config:
        bootstrapAddress: localhost:9192
    logFrames: false
    filters:
      - MultiTenant
      - ValidateSchema
      - RecordEncryption
      - ApiLogging

filterDefinitions:
  - name: MultiTenant
    type: MultiTenant
    config:
      prefixResourceNameStrategy:
        delimiter: "."

  - name: ValidateSchema
    type: ValidateSchema
    config:
      registry:
        url: "http://apicurio:8080/apis/registry/v2"
      onValidationFailure: REJECT
      cacheTtlSeconds: 60

  - name: RecordEncryption
    type: RecordEncryption
    config:
      kms: VaultKmsService
      kmsConfig:
        vaultTransitEngineUrl: "${env:VAULT_TRANSIT_URL}"
        vaultToken: "${env:VAULT_TOKEN}"
      selector: TemplateKekSelector
      selectorConfig:
        template: "kek-${topicName}"

  - name: ApiLogging
    type: ApiLogging
    config:
      includePrincipal: true
      includeBytes: false
      includeTopicPartition: true
      sink: stdout
```

Filter order matters. `MultiTenant` runs first to rewrite topic names; `ValidateSchema` and `RecordEncryption` then see the *rewritten* names. Audit logs the un-rewritten principal but the rewritten topic — keep that in mind when reading audit output.

## docker-compose recipe

`docker/kroxylicious.compose.yml` runs the proxy in front of the Kafka container from `kafka.compose.yml`. The proxy exposes port 9192 (clients), 9193 (admin/metrics). Clients connect with `bootstrap.servers=kroxylicious:9192`; the proxy fans out to `kafka:9092`. In dev, only `ApiLogging` is enabled to keep moving parts low. Production manifests enable the full chain.

## When to use Kroxylicious — and when not

Use Kroxylicious when **at least one** of the following is true:

- Data-at-rest encryption at the record level is a compliance requirement (PCI, HIPAA, GDPR with strong cryptographic erasure).
- The cluster is shared by multiple tenants and per-team isolation by ACL is judged insufficient.
- Produce-time schema enforcement is required (i.e. you cannot trust producers to honour Apicurio).
- A SIEM pipeline needs a structured audit log of every broker-side action without enabling per-broker JMX scraping.

Do not use Kroxylicious when **all** of the following are true:

- Single-tenant cluster, trusted producers.
- Per-message latency budget is < 2 ms p99 (rare in event-driven systems, but real in HFT-adjacent workloads).
- Schema validation is enforced at the SDK level on every producer and that is auditable.

Adding the proxy is reversible — clients switch their bootstrap back to the broker. It is a deployable, not a one-way door. Default to deploying it in any production multi-tenant or regulated environment.

## References

- Kroxylicious site — https://kroxylicious.io/
- Kroxylicious GitHub — https://github.com/kroxylicious/kroxylicious
- v0.10 docs (latest stable) — https://kroxylicious.io/docs/v0.10.0/
- Record encryption assembly — https://kroxylicious.io/docs/v0.10.0/#assembly-record-encryption
- Multi-tenancy assembly — https://kroxylicious.io/docs/v0.10.0/#assembly-multi-tenancy
- Kafka wire protocol — https://kafka.apache.org/protocol
- Kroxylicious filters source — https://github.com/kroxylicious/kroxylicious/tree/main/kroxylicious-filters
