#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
app=infra/helm/apps/go-hello
helm dependency update "$app" >/dev/null
# Dev: 1 replica, Deployment, no HPA, no Rollout
dev=$(helm template go-hello "$app" -f "$app/values.yaml" -f "$app/values.dev.yaml")
grep -q 'kind: Deployment'   <<<"$dev" || { echo "dev: no Deployment"; exit 1; }
grep -q 'replicas: 1'        <<<"$dev" || { echo "dev: replicas wrong"; exit 1; }
! grep -q 'kind: HorizontalPodAutoscaler' <<<"$dev" || { echo "dev: HPA leaked"; exit 1; }
# Staging: 2 replicas, Deployment, HPA on
stg=$(helm template go-hello "$app" -f "$app/values.yaml" -f "$app/values.staging.yaml")
grep -q 'kind: Deployment'                <<<"$stg" || { echo "staging: no Deployment"; exit 1; }
grep -q 'replicas: 2'                     <<<"$stg" || { echo "staging: replicas wrong"; exit 1; }
grep -q 'kind: HorizontalPodAutoscaler'   <<<"$stg" || { echo "staging: no HPA"; exit 1; }
# Prod: Rollout, replicas 6, priorityClass
prod=$(helm template go-hello "$app" -f "$app/values.yaml" -f "$app/values.prod.yaml")
grep -q 'kind: Rollout'           <<<"$prod" || { echo "prod: no Rollout"; exit 1; }
grep -q 'replicas: 6'             <<<"$prod" || { echo "prod: replicas wrong"; exit 1; }
grep -q 'priorityClassName: prod-critical' <<<"$prod" || { echo "prod: no priorityClass"; exit 1; }
echo OK
