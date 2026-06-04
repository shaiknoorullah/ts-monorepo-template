#!/usr/bin/env bash
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

APPS=(go-hello py-hello rs-hello)
ENVS=(dev staging prod)
KUBE_VERSION="${KUBE_VERSION:-1.29.0}"
# kubeconform's Go-template engine does not expose `toLower`/`lower`. The
# Datree CRDs catalog uses lowercase paths, so we'd need string-case
# manipulation that kubeconform's template renderer can't do. Workaround:
# ship `default` (master upstream JSON schemas) only, then rely on
# `-ignore-missing-schemas` to skip CRDs (Rollout, HTTPRoute, ServiceMonitor,
# Instrumentation, ExternalSecret, etc). Validating core K8s kinds is
# enough to catch the structural bugs we care about at lint time;
# CRD-specific validation lives in the cluster admission webhooks.
SCHEMA_LOCATIONS=(default)
if [[ -n "${EXTRA_SCHEMA_LOC:-}" ]]; then
  SCHEMA_LOCATIONS+=("$EXTRA_SCHEMA_LOC")
fi

helm lint --strict "$ROOT/infra/helm/lib-chart"
for app in "${APPS[@]}"; do
  chart="$ROOT/infra/helm/apps/${app}"
  helm dependency update "$chart" >/dev/null
  helm lint --strict "$chart" -f "$chart/values.yaml"
  for env in "${ENVS[@]}"; do
    rendered=$(helm template "$app" "$chart" \
      -f "$chart/values.yaml" -f "$chart/values.${env}.yaml")
    kc_args=(-strict -summary -kubernetes-version "$KUBE_VERSION" -ignore-missing-schemas -output text)
    for loc in "${SCHEMA_LOCATIONS[@]}"; do
      kc_args+=(-schema-location "$loc")
    done
    echo "$rendered" | kubeconform "${kc_args[@]}"
    echo "OK  ${app}  ${env}"
  done
done
