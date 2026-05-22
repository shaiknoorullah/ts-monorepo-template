---
title: Platform Observability — Prometheus, Grafana, Loki, Tempo (alongside SigNoz)
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://prometheus.io/docs/practices/instrumentation/
  - https://grafana.com/docs/loki/latest/get-started/
  - https://grafana.com/docs/tempo/latest/getting-started/
  - https://vector.dev/docs/setup/quickstart/
  - https://prometheus-operator.dev/docs/operator/design/
  - https://www.brendangregg.com/usemethod.html
  - https://sre.google/sre-book/monitoring-distributed-systems/
  - https://prometheus.io/docs/alerting/latest/alertmanager/
  - https://github.com/prometheus-community/helm-charts
---

# Platform Observability — Prometheus, Grafana, Loki, Tempo

## Why layered observability (alongside SigNoz)

SigNoz owns **application-level APM**: per-request tracing, RED/USE for the app pods, per-tenant span attributes. It's terrific for "why did this request hang?"

The open trio (Prometheus + Grafana + Loki + Tempo) owns **platform observability**: node-level metrics, kubelet, etcd, CNI, NetworkPolicy drops, kernel pressure, Patroni state, MetalLB speaker leases, ingress access logs, Falco events. These signals don't fit the "request span" model and don't belong in APM. They belong in a metrics-first stack that ops can run forever, on any cluster, with or without app instrumentation.

The two stacks complement each other:

| Signal                                                                    | Owner          | Reason                                       |
| ------------------------------------------------------------------------- | -------------- | -------------------------------------------- |
| App spans, app metrics, app logs with span correlation                    | SigNoz         | OTel-native, one place to pivot              |
| Node CPU/mem/disk, kubelet, CNI, Postgres exporter                        | Prom + Grafana | Standard exporters; mature dashboards        |
| Container logs from system namespaces (kube-system, longhorn-system)      | Loki           | Cheaper than ClickHouse for bulk system logs |
| Long-tail traces for non-instrumented workloads (kube-apiserver, ingress) | Tempo          | Free traces without instrumenting upstream   |
| Per-host syslog, dmesg, journald                                          | Loki           | Compliance evidence chain                    |

A common alternative is "just send everything to SigNoz." We reject that for two reasons:

1. ClickHouse storage cost balloons when you ingest node/kubelet metrics every 15 s for every cluster.
2. The OSS Prom exporters ecosystem is irreplaceable — `node_exporter`, `kube-state-metrics`, `pg_exporter`, `kafka_exporter`, hundreds more.

So: SigNoz for traces+RED of apps; Prom/Loki/Tempo for everything else.

## RED + USE method dashboards

[RED](https://sre.google/sre-book/monitoring-distributed-systems/) (Rate / Errors / Duration) for request-driven services. [USE](https://www.brendangregg.com/usemethod.html) (Utilization / Saturation / Errors) for resources.

Every service ships:

- **RED Service Dashboard** — `service_name`, `tenant_id`, `route` as filters. Panels:
  - `rate(http_server_requests_total[5m])`
  - `rate(http_server_requests_total{status=~"5.."}[5m]) / rate(http_server_requests_total[5m])`
  - `histogram_quantile(0.95, sum by (le, route) (rate(http_server_request_duration_seconds_bucket[5m])))`
  - `histogram_quantile(0.99, ...)`

Every node + each stateful service ships:

- **USE Resource Dashboard** — Utilization (`avg(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance)`), Saturation (`node_pressure_cpu_waiting_seconds_total` rate, `node_load1 / node_load5`), Errors (`node_disk_errors_total`).

## Log shipping: Promtail vs Vector vs Fluent Bit

Recommendation: **Vector**.

Comparison:

| Concern                            | Promtail        | Fluent Bit    | Vector                      |
| ---------------------------------- | --------------- | ------------- | --------------------------- |
| Language / runtime                 | Go              | C             | Rust                        |
| RAM baseline                       | ~50 MiB         | ~30 MiB       | ~30 MiB                     |
| Throughput per core                | ~150 MB/s       | ~250 MB/s     | ~400 MB/s                   |
| Multi-sink (Loki + S3 + ES)        | Loki only       | Many          | Many                        |
| Transform language                 | Pipeline stages | Lua / parsers | VRL (Vector Remap Language) |
| Sidecar / agent / aggregator roles | Agent only      | Both          | Both                        |
| OTel logs support                  | Indirect        | OTLP exporter | OTLP source & sink          |
| K8s metadata enrichment            | Yes             | Yes           | Yes                         |

Vector wins on:

- **Multi-sink** — same agent ships system logs to Loki, app logs to SigNoz, security events to S3. Promtail can't.
- **VRL** — a small, type-checked transform language that catches bugs at parse time. Fluent Bit's Lua is dynamic; promtail pipeline stages are limited.
- **Performance** — measured wins on every benchmark we ran in 2025 on the existing OVH cluster.

References: [Vector docs](https://vector.dev/docs/setup/quickstart/), [Loki get-started](https://grafana.com/docs/loki/latest/get-started/).

### Vector config (agent on every node)

```toml
# /etc/vector/vector.toml
[api]
enabled = true
address = "127.0.0.1:8686"

[sources.k8s_logs]
type = "kubernetes_logs"
self_node_name = "${VECTOR_SELF_NODE_NAME}"

[sources.journald]
type = "journald"
current_boot_only = true

[sources.host_metrics]
type = "host_metrics"
collectors = ["cpu", "disk", "filesystem", "load", "memory", "network"]
scrape_interval_secs = 15

[transforms.parse_json]
type = "remap"
inputs = ["k8s_logs"]
source = '''
parsed, err = parse_json(.message)
if err == null && is_object(parsed) {
  . = merge(., parsed)
}
.trace_id = .trace_id || .traceId
.span_id  = .span_id  || .spanId
del(.message) if exists(.msg)
'''

[transforms.add_meta]
type = "remap"
inputs = ["parse_json", "journald"]
source = '''
.cluster = "${CLUSTER_NAME:-staging}"
.region  = "${REGION:-ap-south-1}"
'''

[sinks.loki_app]
type = "loki"
inputs = ["add_meta"]
endpoint = "http://loki:3100"
encoding.codec = "json"
labels.app = "{{ kubernetes.pod_labels.\"app.kubernetes.io/name\" }}"
labels.namespace = "{{ kubernetes.pod_namespace }}"
labels.cluster = "{{ cluster }}"
labels.level = "{{ level }}"
out_of_order_action = "rewrite_timestamp"

[sinks.prometheus_remote_write]
type = "prometheus_remote_write"
inputs = ["host_metrics"]
endpoint = "http://prometheus:9090/api/v1/write"
```

Vector runs as a **DaemonSet** in K8s (read-only mount on `/var/log/pods` and `/run/log/journal`) and as a **container** in compose with `/var/log` bind-mounted.

## ServiceMonitor / PodMonitor conventions

When `kube-prometheus-stack` is the installed flavor of Prom, scrape config is generated from CRDs ([prometheus-operator design](https://prometheus-operator.dev/docs/operator/design/)).

```yaml
# infra/k8s/prom/podmonitor-fastify.yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: fastify-apps
  namespace: monitoring
  labels: { release: kube-prom-stack }
spec:
  namespaceSelector:
    matchNames: [default, api, workers]
  selector:
    matchLabels:
      app.kubernetes.io/part-of: tsm
  podMetricsEndpoints:
    - port: metrics
      path: /metrics
      interval: 15s
      relabelings:
        - sourceLabels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
          targetLabel: service
        - sourceLabels: [__meta_kubernetes_namespace]
          targetLabel: namespace
```

Conventions:

- Every pod exposes Prom metrics on a **separate `metrics` port** (4000 by convention) — never the main HTTP port. Reduces accidental exposure.
- Metrics names follow [Prom instrumentation conventions](https://prometheus.io/docs/practices/instrumentation/): `<namespace>_<subsystem>_<name>_<unit>`. Example: `tsm_api_http_requests_total`.
- Labels are **low-cardinality**: `service`, `method`, `route_template`, `status_code` (bucketed `2xx/4xx/5xx`), `tenant_class` (free/pro/ent — not raw `tenant_id`).

## AlertManager routing

```yaml
# infra/k8s/prom/alertmanager-config.yaml
route:
  receiver: slack-warn
  group_by: ['alertname', 'cluster', 'namespace']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers: [severity="page"]
      receiver: pagerduty
      continue: false
    - matchers: [severity="info"]
      receiver: slack-info
      group_interval: 30m

receivers:
  - name: pagerduty
    pagerduty_configs:
      - service_key: ${PAGERDUTY_KEY}
        severity: '{{ if eq .CommonLabels.severity "page" }}critical{{ else }}warning{{ end }}'
  - name: slack-warn
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
        title: '{{ .Status | toUpper }} {{ .CommonLabels.alertname }}'
        text: |
          {{ range .Alerts -}}
          *{{ .Labels.severity }}* {{ .Annotations.summary }}
          Runbook: {{ .Annotations.runbook_url }}
          {{ end }}
  - name: slack-info
    slack_configs:
      - channel: '#alerts-info'
        send_resolved: false

inhibit_rules:
  - source_matchers: [severity="page"]
    target_matchers: [severity="warn"]
    equal: [alertname, cluster, namespace]
```

Pages go to PagerDuty. Warnings go to a high-volume Slack channel. Info events go to a low-volume Slack channel batched by 30 min. Resolved notifications are sent for warns but not infos. Page alerts inhibit lower-severity duplicates.

See [Prom AlertManager docs](https://prometheus.io/docs/alerting/latest/alertmanager/).

## docker-compose recipe (prom + grafana + loki + tempo + vector)

```yaml
# docker/observability/platform.yml
name: tsm-observability

services:
  prometheus:
    image: prom/prometheus:v2.55.1
    restart: unless-stopped
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=30d
      - --enable-feature=remote-write-receiver
      - --web.enable-lifecycle
    volumes:
      - ./prom/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prom/rules:/etc/prometheus/rules:ro
      - prom-data:/prometheus
    ports: ['9090:9090']
    networks: [obs]
    deploy:
      resources: { limits: { cpus: '1', memory: 1G } }

  alertmanager:
    image: prom/alertmanager:v0.27.0
    restart: unless-stopped
    volumes:
      - ./prom/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - am-data:/alertmanager
    command: ['--config.file=/etc/alertmanager/alertmanager.yml']
    ports: ['9093:9093']
    networks: [obs]

  grafana:
    image: grafana/grafana:11.3.0
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:?required}
      GF_AUTH_GENERIC_OAUTH_ENABLED: 'true'
      GF_AUTH_GENERIC_OAUTH_NAME: 'Entra ID'
      GF_AUTH_GENERIC_OAUTH_CLIENT_ID: ${ENTRA_CLIENT_ID}
      GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET: ${ENTRA_CLIENT_SECRET}
      GF_AUTH_GENERIC_OAUTH_AUTH_URL: https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/authorize
      GF_AUTH_GENERIC_OAUTH_TOKEN_URL: https://login.microsoftonline.com/${ENTRA_TENANT}/oauth2/v2.0/token
      GF_AUTH_GENERIC_OAUTH_SCOPES: openid email profile
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports: ['3000:3000']
    networks: [obs]

  loki:
    image: grafana/loki:3.2.1
    restart: unless-stopped
    command: ['-config.file=/etc/loki/config.yml']
    volumes:
      - ./loki/config.yml:/etc/loki/config.yml:ro
      - loki-data:/var/loki
    ports: ['3100:3100']
    networks: [obs]
    deploy:
      resources: { limits: { cpus: '1', memory: 1G } }

  tempo:
    image: grafana/tempo:2.6.0
    restart: unless-stopped
    command: ['-config.file=/etc/tempo/config.yml']
    volumes:
      - ./tempo/config.yml:/etc/tempo/config.yml:ro
      - tempo-data:/var/tempo
    ports:
      - '3200:3200' # query
      - '4319:4317' # OTLP gRPC (host-distinct from SigNoz collector)
    networks: [obs]

  vector:
    image: timberio/vector:0.42.0-debian
    restart: unless-stopped
    volumes:
      - ./vector/vector.toml:/etc/vector/vector.toml:ro
      - /var/log:/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      VECTOR_SELF_NODE_NAME: ${HOSTNAME}
      CLUSTER_NAME: ${CLUSTER_NAME:-staging}
    networks: [obs]
    deploy:
      resources: { limits: { cpus: '0.5', memory: 384M } }

volumes:
  prom-data:
  am-data:
  grafana-data:
  loki-data:
  tempo-data:

networks:
  obs:
    name: observability
    driver: bridge
```

Loki and Tempo run **single-binary mode** (no separate distributor/ingester/querier). That's the sweet spot for the prod-smallest profile; we split components when we cross 10 TiB ingested per month.

## `@pkg/metrics-conventions`

A tiny package shared across services that enforces naming and label discipline:

```ts
// packages/metrics-conventions/src/index.ts
import {
  Counter,
  Histogram,
  Gauge,
  Registry,
  collectDefaultMetrics,
  register as defaultRegister,
} from 'prom-client'

export const httpRequestsTotal = new Counter({
  name: 'tsm_http_requests_total',
  help: 'Total HTTP requests by service',
  labelNames: ['service', 'method', 'route_template', 'status_class'] as const,
})

export const httpRequestDuration = new Histogram({
  name: 'tsm_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['service', 'method', 'route_template', 'status_class'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const dbQueryDuration = new Histogram({
  name: 'tsm_db_query_duration_seconds',
  help: 'DB query duration',
  labelNames: ['service', 'operation', 'table'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
})

export const tenantClassActiveUsers = new Gauge({
  name: 'tsm_tenant_class_active_users',
  help: 'Active users by tenant class',
  labelNames: ['tenant_class'] as const,
})

collectDefaultMetrics({ register: defaultRegister })

export function statusClass(code: number): '2xx' | '3xx' | '4xx' | '5xx' {
  if (code < 300) return '2xx'
  if (code < 400) return '3xx'
  if (code < 500) return '4xx'
  return '5xx'
}
```

Rules enforced via TypeScript types:

- `labelNames` is `as const` — adding labels means a type change, reviewed in PR.
- No raw `tenant_id` label — only `tenant_class`. Cardinality stays bounded.
- Histogram buckets are picked from the [Prom recommended set](https://prometheus.io/docs/practices/histograms/) per metric kind.

Fastify glue:

```ts
// packages/metrics-conventions/src/fastify.ts
import fp from 'fastify-plugin'
import { httpRequestsTotal, httpRequestDuration, statusClass } from './index'

export default fp(async (app) => {
  app.addHook('onResponse', async (req, reply) => {
    const labels = {
      service: process.env.OTEL_SERVICE_NAME ?? 'unknown',
      method: req.method,
      route_template: req.routeOptions?.url ?? 'unknown',
      status_class: statusClass(reply.statusCode),
    }
    httpRequestsTotal.inc(labels)
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000)
  })

  app.get('/metrics', async (_, reply) => {
    const { register } = await import('prom-client')
    reply.type(register.contentType)
    return register.metrics()
  })
})
```

## Cross-stack pivoting in Grafana

Grafana data sources include Prom, Loki, Tempo, and **SigNoz's ClickHouse** (via the official ClickHouse data source plugin). Dashboards link across:

- **Click on a Prom panel** → Grafana "Explore" → filter Loki logs by `service="api", trace_id="<id>"`.
- **Click on a log line** → derived field links to Tempo span by `trace_id`.
- **Click on a span** → optional jump to SigNoz UI for the deep view.

Grafana's [derived fields](https://grafana.com/docs/grafana/latest/datasources/loki/configure-loki-data-source/#derived-fields) are the linchpin. Configure once per data source:

```yaml
# docker/observability/grafana/provisioning/datasources/loki.yaml
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        - name: TraceID
          matcherType: label
          matcherRegex: trace_id
          url: '${__value.raw}'
          datasourceUid: tempo
```

## Retention defaults

| Store             | Retention                                                                 | Disk @ small scale |
| ----------------- | ------------------------------------------------------------------------- | ------------------ |
| Prometheus (TSDB) | 30 d hot, then `--storage.tsdb.retention.size` cap                        | 10–20 GiB          |
| Loki              | 14 d on local FS; longer requires S3 / GCS backend                        | 30 GiB             |
| Tempo             | 7 d on local FS; we sample very little since SigNoz holds the rich traces | 10 GiB             |
| Vector buffer     | 5 min on disk per sink                                                    | 1 GiB              |

For prod, swap Loki and Tempo to S3/Blob backends. Local FS only for staging.

## Known footguns

1. **High-cardinality labels** (per-tenant, per-user) in Prometheus → memory blow-up. Use `tenant_class`, never `tenant_id`. The rare per-tenant counter lives in SigNoz (ClickHouse-backed).
2. **Loki indexes on labels only** — putting tenant_id in a label is again a cardinality bomb. Tenant goes in the **log body**, queried via `|= "tenant_id=abc"`.
3. **Time skew** between nodes silently breaks traces and metrics. Run NTP/chrony with monitoring on the offset.
4. **Loki out-of-order writes** are rejected by default. Configure `out_of_order_action = "rewrite_timestamp"` in Vector for journald (which sometimes back-dates entries) — already in the recipe above.
5. **Grafana OAuth** for Entra ID requires the `email` claim; default Entra app registration must include it explicitly.

## Open questions

- Mimir vs Cortex vs vanilla Prom remote-write for long-term metrics? Decide before we cross 100 GiB.
- Loki on Cloudflare R2 vs Azure Blob — Azure Blob already used for backups; reuse?
- Tail-sampling at the Vector layer for non-OTel sources?
