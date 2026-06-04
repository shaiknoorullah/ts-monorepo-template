#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/functions"

declare -A EXPECT=(
  ["patch-and-transform.yaml"]="xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.7.0"
  ["go-templating.yaml"]="xpkg.upbound.io/crossplane-contrib/function-go-templating:v0.9.2"
  ["environment-configs.yaml"]="xpkg.upbound.io/crossplane-contrib/function-environment-configs:v0.4.0"
  ["auto-ready.yaml"]="xpkg.upbound.io/crossplane-contrib/function-auto-ready:v0.4.0"
  ["extra-resources.yaml"]="xpkg.upbound.io/crossplane-contrib/function-extra-resources:v0.3.0"
  ["kcl.yaml"]="xpkg.upbound.io/crossplane-contrib/function-kcl:v0.11.0"
)

for f in "${!EXPECT[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  grep -q "kind: Function" "$path"
  grep -q "package: ${EXPECT[$f]}" "$path" || { echo "BAD VERSION in $path"; exit 1; }
  grep -q "$f" "$ROOT/kustomization.yaml"
done

kubeconform -strict -ignore-missing-schemas -summary "$ROOT"/*.yaml
