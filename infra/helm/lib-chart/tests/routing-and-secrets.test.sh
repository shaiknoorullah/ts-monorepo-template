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
cat > "$work/probe/templates/all.yaml" <<'TPL'
{{- include "lib-chart.httpRoute" . }}
{{- include "lib-chart.virtualService" . }}
{{- include "lib-chart.ingress" . }}
{{- include "lib-chart.networkPolicy" . }}
{{- include "lib-chart.externalSecret" . }}
TPL
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
service: { port: 8080, name: http }
route:
  kind: HTTPRoute
  hostnames: ["app.example.com"]
  parentRefs:
    - { name: platform-gateway, namespace: gateway-system }
networkPolicy:
  enabled: true
  ingress:
    fromGateway: true
    fromNamespaces: ["observability"]
  egress:
    dns: true
    platformDeps: ["postgres"]
    external:
      - { host: api.stripe.com, port: 443 }
externalSecret:
  enabled: true
  refreshInterval: 1h
  store: { name: cluster-secret-store, kind: ClusterSecretStore }
  data:
    - secretKey: DATABASE_URL
      remoteRef: { key: app/db, property: url }
YAML
out=$(helm template probe "$work/probe")
grep -q 'kind: HTTPRoute'                       <<<"$out" || { echo "no HTTPRoute"; exit 1; }
grep -q 'kind: NetworkPolicy'                   <<<"$out" || { echo "no NetworkPolicy"; exit 1; }
grep -q 'name: probe-lib-chart-deny-all'        <<<"$out" || { echo "no deny-all"; exit 1; }
grep -q 'name: probe-lib-chart-allow'           <<<"$out" || { echo "no allow"; exit 1; }
grep -q 'kind: ExternalSecret'                  <<<"$out" || { echo "no ExternalSecret"; exit 1; }
grep -q 'api.stripe.com'                        <<<"$out" || { echo "external host missing"; exit 1; }
# Negative case: 0.0.0.0/0 must hard fail
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
service: { port: 8080 }
networkPolicy:
  enabled: true
  egress:
    external:
      - { host: "0.0.0.0/0", port: 443 }
YAML
if helm template probe "$work/probe" >/dev/null 2>&1; then
  echo "0.0.0.0/0 was not rejected"; exit 1
fi
echo OK
