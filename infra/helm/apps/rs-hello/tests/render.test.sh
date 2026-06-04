#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
app=infra/helm/apps/rs-hello
helm dependency update "$app" >/dev/null
for env in dev staging prod; do
  out=$(helm template rs-hello "$app" -f "$app/values.yaml" -f "$app/values.${env}.yaml")
  grep -q 'kind: OpenTelemetryCollector' <<<"$out" || { echo "$env: no OTelCol sidecar"; exit 1; }
  ! grep -q 'kind: Instrumentation'      <<<"$out" || { echo "$env: Instrumentation leaked"; exit 1; }
  grep -q 'kind: PodMonitor'             <<<"$out" || { echo "$env: no PodMonitor"; exit 1; }
done
echo OK
