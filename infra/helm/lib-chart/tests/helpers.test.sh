#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# Build a tiny probe chart that includes the partials and prints them.
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
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1.2.3 }
service: { port: 8080 }
YAML
cat > "$work/probe/templates/dump.yaml" <<'TPL'
apiVersion: v1
kind: ConfigMap
metadata:
  name: dump
data:
  fullname: {{ include "lib-chart.fullname" . | quote }}
  imageRef: {{ include "lib-chart.imageRef" . | quote }}
  labels: |
{{ include "lib-chart.labels" . | indent 4 }}
TPL
out=$(helm template probe "$work/probe" 2>&1) || { echo "$out"; exit 1; }
grep -q 'fullname: "probe-lib-chart"' <<<"$out" || { echo "fullname wrong"; echo "$out"; exit 1; }
grep -q 'imageRef: "ghcr.io/org/app:v1.2.3"' <<<"$out" || { echo "imageRef wrong"; echo "$out"; exit 1; }
grep -q 'app.kubernetes.io/managed-by: argocd' <<<"$out" || { echo "labels wrong"; echo "$out"; exit 1; }
echo OK
