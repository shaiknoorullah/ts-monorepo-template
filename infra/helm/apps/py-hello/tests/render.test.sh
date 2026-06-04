#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
app=infra/helm/apps/py-hello
helm dependency update "$app" >/dev/null
for env in dev staging prod; do
  out=$(helm template py-hello "$app" -f "$app/values.yaml" -f "$app/values.${env}.yaml")
  grep -q 'kind: Instrumentation' <<<"$out" || { echo "$env: no Instrumentation"; exit 1; }
  grep -q 'autoinstrumentation-python' <<<"$out" || { echo "$env: not python autoinstr"; exit 1; }
  ! grep -q 'kind: OpenTelemetryCollector' <<<"$out" || { echo "$env: sidecar leaked"; exit 1; }
done
prod=$(helm template py-hello "$app" -f "$app/values.yaml" -f "$app/values.prod.yaml")
grep -q 'replicas: 4' <<<"$prod" || { echo "prod: replicas wrong"; exit 1; }
echo OK
