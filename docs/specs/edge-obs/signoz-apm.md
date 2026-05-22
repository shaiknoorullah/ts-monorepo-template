---
title: SigNoz APM — OTel-native Tracing, Metrics, Logs on ClickHouse
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://signoz.io/docs/install/docker/
  - https://signoz.io/docs/instrumentation/nodejs/
  - https://opentelemetry.io/docs/languages/js/
  - https://github.com/open-telemetry/opentelemetry-collector-contrib
  - https://clickhouse.com/docs/en/intro
  - https://signoz.io/docs/userguide/alerts/
  - https://signoz.io/docs/userguide/manage-dashboards/
  - https://opentelemetry.io/docs/concepts/semantic-conventions/
---

# SigNoz APM

## Why SigNoz

SigNoz is the chosen APM. It ships **traces + metrics + logs** in a single product, all of them **OpenTelemetry native** (OTLP gRPC and HTTP receivers), and stores everything in **ClickHouse**. The combination buys us:

- One backend instead of three (Datadog/Honeycomb/Sentry for APM + Prom for metrics + Loki for logs).
- ClickHouse means **cheap retention**: a year of trace samples and metrics fits on commodity disk.
- OTel-native means our instrumentation isn't vendor-coupled. If SigNoz disappoints, we re-point the OTel collector exporter.
- Self-hostable. No SaaS lock-in. Apache 2.0 licensed core.

The trade-off: ClickHouse + ZooKeeper add operational surface (covered below). It's worth it because we already operate ClickHouse for our audit pipeline.

Reference: [SigNoz docker install](https://signoz.io/docs/install/docker/), [SigNoz NodeJS instrumentation](https://signoz.io/docs/instrumentation/nodejs/).

## Architecture

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ apps/api (Fastify) │    │ apps/worker        │    │ apps/web (Next)    │
│  @pkg/telemetry    │    │  @pkg/telemetry    │    │  @pkg/telemetry-rum│
└─────────┬──────────┘    └─────────┬──────────┘    └─────────┬──────────┘
          │ OTLP/gRPC                │                          │ OTLP/HTTP
          ▼                          ▼                          ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  OpenTelemetry Collector  (DaemonSet in K8s / sidecar in compose)│
   │  - tail sampling                                                  │
   │  - resource processor (env, region, version)                      │
   │  - attribute processor (drop PII)                                 │
   └──────────────────────────────┬───────────────────────────────────┘
                                  │ OTLP/gRPC
                                  ▼
                     ┌────────────────────────┐
                     │  SigNoz OTel Collector │  (gateway role)
                     └────────┬───────────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
        ┌───────────────┐           ┌────────────────┐
        │ signoz-query  │           │ ClickHouse     │
        │  -service     │◄──────────│  + ZooKeeper   │
        └───────┬───────┘           └────────────────┘
                │
                ▼
        ┌───────────────┐
        │ signoz-frontend│
        └────────────────┘
```

We run **two** OTel collectors:

1. **Edge collector** (DaemonSet / per-host sidecar). Catches host-local telemetry quickly, batches, drops high-cardinality attributes, performs head sampling decisions for "uninteresting" traces. Talks to apps via OTLP.
2. **Gateway collector** (deployment, ships with SigNoz). Performs tail sampling, fans out to ClickHouse + (optionally) other exporters.

This two-tier pattern is the [OTel reference design](https://opentelemetry.io/docs/collector/deployment/) and lets us shed load at the edge before it crosses the network.

## docker-compose recipe

```yaml
# docker/observability/signoz.yml
name: signoz

services:
  zookeeper:
    image: bitnami/zookeeper:3.9.2
    restart: unless-stopped
    environment:
      ALLOW_ANONYMOUS_LOGIN: 'yes'
      ZOO_AUTOPURGE_INTERVAL: '1'
    volumes: [zk-data:/bitnami/zookeeper]
    networks: [signoz]
    healthcheck:
      test: ['CMD-SHELL', 'echo ruok | nc -w 1 localhost 2181 | grep -q imok']
      interval: 15s
      retries: 10

  clickhouse:
    image: clickhouse/clickhouse-server:24.8.4.13-alpine
    restart: unless-stopped
    ulimits: { nofile: { soft: 262144, hard: 262144 } }
    environment:
      CLICKHOUSE_DB: signoz_traces
    depends_on:
      zookeeper: { condition: service_healthy }
    volumes:
      - ch-data:/var/lib/clickhouse
      - ./signoz/clickhouse-config.xml:/etc/clickhouse-server/config.d/cluster.xml:ro
    networks: [signoz]
    healthcheck:
      test: ['CMD-SHELL', 'wget -q -O - http://localhost:8123/ping']
      interval: 15s
      retries: 10
    deploy:
      resources:
        limits: { cpus: '2', memory: 4G }

  signoz-otel-collector:
    image: signoz/signoz-otel-collector:0.110.0
    restart: unless-stopped
    command: ['--config=/etc/otel-collector-config.yaml']
    volumes:
      - ./signoz/otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
    depends_on:
      clickhouse: { condition: service_healthy }
    ports:
      - '4317:4317' # OTLP gRPC
      - '4318:4318' # OTLP HTTP
    networks: [signoz, observability]
    deploy:
      resources:
        limits: { cpus: '1', memory: 1G }

  signoz-query:
    image: signoz/query-service:0.55.0
    restart: unless-stopped
    command:
      - --config=/root/config/prometheus.yml
    environment:
      ClickHouseUrl: tcp://clickhouse:9000
      SIGNOZ_LOCAL_DB_PATH: /var/lib/signoz/signoz.db
      DASHBOARDS_PATH: /root/config/dashboards
      ALERTMANAGER_API_PREFIX: http://signoz-alertmanager:9093/api/
    volumes:
      - signoz-data:/var/lib/signoz
      - ./signoz/dashboards:/root/config/dashboards:ro
    depends_on:
      clickhouse: { condition: service_healthy }
    networks: [signoz]
    deploy:
      resources:
        limits: { cpus: '1', memory: 1G }

  signoz-frontend:
    image: signoz/frontend:0.55.0
    restart: unless-stopped
    environment:
      FRONTEND_API_ENDPOINT: http://signoz-query:8080
    ports: ['3301:3301']
    depends_on: [signoz-query]
    networks: [signoz, edge]

  signoz-alertmanager:
    image: signoz/alertmanager:0.23.7
    restart: unless-stopped
    volumes:
      - ./signoz/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/data
    networks: [signoz]
    command:
      - --queryService.url=http://signoz-query:8080
      - --storage.path=/data

volumes:
  zk-data:
  ch-data:
  signoz-data:
  alertmanager-data:

networks:
  signoz: {}
  observability: { external: true }
  edge: { external: true }
```

## OTel collector config (signoz gateway)

```yaml
# docker/observability/signoz/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

processors:
  batch:
    send_batch_size: 8192
    timeout: 5s
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80
    spike_limit_percentage: 25
  resource/env:
    attributes:
      - { key: deployment.environment, value: ${ENV:-staging}, action: upsert }
      - { key: service.namespace, value: tsm, action: upsert }
  attributes/drop-pii:
    actions:
      - { key: http.request.header.authorization, action: delete }
      - { key: http.request.header.cookie, action: delete }
      - { key: db.statement, action: hash }   # query is hashed; preserves cardinality grouping
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 1000 }
      - name: random-5
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }

exporters:
  clickhousetraces:
    datasource: tcp://clickhouse:9000/?database=signoz_traces
  clickhousemetricswrite:
    endpoint: tcp://clickhouse:9000/?database=signoz_metrics
  clickhouselogsexporter:
    dsn: tcp://clickhouse:9000/?database=signoz_logs

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resource/env, attributes/drop-pii, tail_sampling, batch]
      exporters: [clickhousetraces]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, resource/env, batch]
      exporters: [clickhousemetricswrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resource/env, attributes/drop-pii, batch]
      exporters: [clickhouselogsexporter]
```

Tail sampling rules: **always keep errors and slow traces (>1s); 5% sample of the rest**. This is the single most important config in the whole pipeline — without it ClickHouse fills up in days.

## TypeScript wiring — `@pkg/telemetry`

A single shared package every Node service imports as **the very first thing** in its entrypoint (before any other import). This matters: OpenTelemetry's auto-instrumentations monkey-patch modules at `require`/`import` time. Late init means missing spans.

```ts
// packages/telemetry/src/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4317'
const serviceName = process.env.OTEL_SERVICE_NAME
if (!serviceName) throw new Error('OTEL_SERVICE_NAME is required')

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION ?? 'dev',
    [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
    'service.namespace': 'tsm',
    'service.instance.id': process.env.HOSTNAME ?? 'unknown',
  }),
  traceExporter: new OTLPTraceExporter({ url: endpoint }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: endpoint }),
    exportIntervalMillis: 15_000,
  }),
  logRecordProcessors: [new BatchLogRecordProcessor(new OTLPLogExporter({ url: endpoint }))],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false }, // very noisy
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-kafkajs': {},
      '@opentelemetry/instrumentation-ioredis': {},
      '@opentelemetry/instrumentation-fastify': {},
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => req.url === '/healthz',
      },
    }),
  ],
})

sdk.start()

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0))
})
```

Usage in a Fastify app:

```ts
// apps/api/src/index.ts
import '@pkg/telemetry' // MUST be the first import
import { buildApp } from './app'

const app = await buildApp()
await app.listen({ host: '0.0.0.0', port: 3000 })
```

### Why `@signoz/opentelemetry-node` is not chosen

SigNoz publishes a convenience wrapper, but it pins specific OTel package versions and lags upstream by 2-3 weeks. Using the generic `@opentelemetry/auto-instrumentations-node` plus the OTLP exporter gives us the same outcome with no SigNoz-specific code path. If we ever want to send to a second backend (Tempo for example), we just add an exporter.

### Tenancy propagation

The OTel SDK has a pluggable `TextMapPropagator`. We extend the default W3C TraceContext propagator with a tenancy attribute injector:

```ts
// packages/telemetry/src/tenant-propagator.ts
import { context, trace, type Span } from '@opentelemetry/api'

export function spanWithTenant(span: Span, tenantId: string): void {
  span.setAttribute('tenant.id', tenantId)
  span.setAttribute('enduser.scope', `tenant:${tenantId}`)
}

// In the Fastify onRequest hook:
app.addHook('onRequest', async (req) => {
  const span = trace.getSpan(context.active())
  if (span && req.tenant) spanWithTenant(span, req.tenant.tenantId)
})
```

Now every span carries `tenant.id`. SigNoz dashboards filter by this attribute; alerts can fire per-tenant.

### Logger correlation

Pino is the chosen logger. We attach the active span's `trace_id` and `span_id` to every log line so SigNoz Logs can pivot to the trace:

```ts
// packages/telemetry/src/pino-otel.ts
import pino, { type LoggerOptions } from 'pino'
import { context, trace } from '@opentelemetry/api'

export function buildLogger(opts: LoggerOptions = {}) {
  return pino({
    ...opts,
    mixin() {
      const span = trace.getSpan(context.active())
      if (!span) return {}
      const c = span.spanContext()
      return { trace_id: c.traceId, span_id: c.spanId, trace_flags: c.traceFlags }
    },
    formatters: {
      level: (label) => ({ level: label }),
    },
  })
}
```

## Dashboards we ship

Six dashboards under `docker/observability/signoz/dashboards/`, loaded at SigNoz startup:

1. **`fleet-overview.json`** — request rate / error rate / p95 latency / saturation across all services (the RED method).
2. **`fastify-per-route.json`** — top 20 slowest routes by p99, grouped by service.
3. **`database-pg.json`** — query latency, connection pool saturation, lock waits, replica lag.
4. **`kafka.json`** — broker disk, consumer lag, partition skew.
5. **`tenant-explorer.json`** — RED metrics filtered by `tenant.id`. Single-row table per tenant: req/s, errors, p95.
6. **`node-resources.json`** — host CPU/memory/disk pulled from OTel host metrics receiver.

## Alerts

Defined as YAML under `docker/observability/signoz/alerts/`, applied via SigNoz API on boot:

```yaml
# alerts/api-error-rate.yaml
alert: ApiErrorRate
expr: |
  sum(rate(signoz_calls_total{service_name="api", status_code="ERROR"}[5m]))
  /
  sum(rate(signoz_calls_total{service_name="api"}[5m]))
  > 0.05
for: 5m
labels:
  severity: page
annotations:
  summary: 'API error rate > 5% for 5m'
  runbook_url: 'https://docs.example.com/runbooks/api-error-rate'
```

```yaml
# alerts/per-tenant-saturation.yaml
alert: TenantSaturated
expr: |
  histogram_quantile(0.95, sum by (le, tenant_id)
    (rate(signoz_latency_bucket{service_name="api"}[5m]))) > 2.0
for: 10m
labels:
  severity: warn
annotations:
  summary: 'Tenant {{ $labels.tenant_id }} p95 latency > 2s'
```

The full alert list is captured in [the SigNoz alerts docs](https://signoz.io/docs/userguide/alerts/) format.

## Retention & cost

ClickHouse TTL policy (in `clickhouse-config.xml`):

| Signal  | Retention                              | Reason                                                         |
| ------- | -------------------------------------- | -------------------------------------------------------------- |
| Traces  | 15 days hot, 90 days cold (compressed) | Most debugging happens within 2 weeks                          |
| Metrics | 90 days at 15 s, 1 year at 5 min       | Capacity planning needs 1-year baselines                       |
| Logs    | 30 days                                | Compliance default; some tenants need 1 year — they pay for it |

At our scale (~10 services, ~1000 rps peak, 5% sampling) this is ~50 GiB of ClickHouse storage. Single-node ClickHouse is fine; we add a replica when we cross 200 GiB.

## Known footguns

1. **`require("@pkg/telemetry")` after another instrumented module** — instrumentations don't take effect. Use `--import` flag with Node 22 or put it as the very first line.
2. **High-cardinality attributes** (per-user-id, per-request-id) explode ClickHouse storage. We hash or drop them in the collector.
3. **ZooKeeper as SPOF** for ClickHouse — staging accepts it; prod needs ClickHouse Keeper (3 replicas) or ZK ensemble.
4. **`db.statement` PII** — set `enhancedDatabaseReporting: true` carefully; we hash via collector to avoid leaking parameters.
5. **Frontend RUM** is a separate concern (`@pkg/telemetry-rum` using `@opentelemetry/sdk-trace-web`) — out of scope here.

## Open questions

- Switch ZK → ClickHouse Keeper before any prod rollout?
- Adopt eBPF auto-instrumentation (e.g., Pixie / OpenTelemetry eBPF) for runtimes we don't control?
- Federation: do we let SigNoz scrape Prom for non-OTel workloads, or run both stacks? See `observability-prom-grafana-loki-tempo.md`.
