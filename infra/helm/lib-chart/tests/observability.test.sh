#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
mkdir -p "$work/probe/charts" "$work/probe/templates"
cp -r infra/helm/lib-chart "$work/probe/charts/lib-chart"
cat > "$work/probe/Chart.yaml" <<YAML
apiVersion: v2
name: probe
version: 0.1.0
dependencies:
  - name: lib-chart
    version: 0.1.0
YAML

# Case A: Go runtime → Instrumentation CR, no sidecar
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
service: { port: 8080 }
observability:
  metrics: { port: 9090, path: /metrics, serviceMonitor: { enabled: true, interval: 30s } }
  alerts:
    enabled: true
    rules:
      - { alert: AppHighErrorRate, expr: "vector(0)", for: 10m, severity: page }
  tracing: { runtime: go, sampler: parentbased_traceidratio, samplerArg: "0.1" }
  dashboards: { enabled: true, json: "{}" }
YAML
cat > "$work/probe/templates/all.yaml" <<'TPL'
{{- include "lib-chart.serviceMonitor" . }}
{{- include "lib-chart.podMonitor" . }}
{{- include "lib-chart.prometheusRule" . }}
{{- include "lib-chart.grafanaDashboardCM" . }}
{{- include "lib-chart.instrumentation" . }}
{{- include "lib-chart.otelColSidecar" . }}
TPL
out=$(helm template probe "$work/probe")
grep -q 'kind: ServiceMonitor'    <<<"$out" || { echo "no ServiceMonitor"; exit 1; }
grep -q 'release: kube-prometheus-stack' <<<"$out" || { echo "release label missing"; exit 1; }
grep -q 'kind: PrometheusRule'    <<<"$out" || { echo "no PrometheusRule"; exit 1; }
grep -q 'kind: Instrumentation'   <<<"$out" || { echo "no Instrumentation"; exit 1; }
grep -q 'grafana_dashboard: "1"'  <<<"$out" || { echo "dashboard label missing"; exit 1; }

# Case B: Rust runtime → OTelCol sidecar enabled, no Instrumentation
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
service: { port: 8080 }
observability:
  metrics: { port: 9090, path: /metrics }
  tracing: { runtime: rust }
YAML
out2=$(helm template probe "$work/probe")
grep -q 'kind: OpenTelemetryCollector' <<<"$out2" || { echo "no OTelCol sidecar for rust"; exit 1; }
! grep -q 'kind: Instrumentation'      <<<"$out2" || { echo "Instrumentation leaked for rust"; exit 1; }
echo OK
