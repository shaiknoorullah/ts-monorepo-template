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
{{- include "lib-chart.presyncMigration" . }}
TPL
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
service: { port: 8080 }
migrations:
  enabled: true
  command: ["/app/bin/migrate", "up"]
  backoffLimit: 0
  envFromSecret: "probe-lib-chart-env"
  hookDeletePolicy: BeforeHookCreation
YAML
out=$(helm template probe "$work/probe")
grep -q 'kind: Job'                                          <<<"$out" || { echo "no Job"; exit 1; }
grep -q 'argocd.argoproj.io/hook: PreSync'                   <<<"$out" || { echo "no PreSync hook"; exit 1; }
grep -q 'argocd.argoproj.io/hook-delete-policy: BeforeHookCreation' <<<"$out" || { echo "no delete policy"; exit 1; }
grep -q '/app/bin/migrate'                                   <<<"$out" || { echo "migrate command missing"; exit 1; }
echo OK
