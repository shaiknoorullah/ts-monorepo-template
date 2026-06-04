#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/environment-configs"

for env in dev staging prod; do
  path="$ROOT/env-${env}.yaml"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  grep -q "kind: EnvironmentConfig" "$path"
  grep -q "name: env-${env}" "$path"
  grep -q "env: ${env}" "$path"
  for component in pg redis kafka clickhouse opensearch defaults; do
    grep -q "${component}:" "$path" || { echo "MISSING ${component} in $path"; exit 1; }
  done
done

# Prod sizing per spec §8.5 table
grep -q "instances: 3" "$ROOT/env-prod.yaml"
grep -q "storageGi: 100" "$ROOT/env-prod.yaml"
grep -q "brokers: 3" "$ROOT/env-prod.yaml"
grep -q "retentionHours: 168" "$ROOT/env-prod.yaml"
grep -q "keepers: 3" "$ROOT/env-prod.yaml"

# Staging/dev: replicas reduced to 1, storage to 10Gi, backups off
grep -q "enabled: false" "$ROOT/env-dev.yaml"
grep -q "instances: 1" "$ROOT/env-dev.yaml"

# Kustomization lists all three
for env in dev staging prod; do
  grep -q "env-${env}.yaml" "$ROOT/kustomization.yaml"
done
