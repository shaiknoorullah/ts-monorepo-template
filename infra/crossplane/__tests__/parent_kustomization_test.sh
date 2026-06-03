#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane"

# Top-level kustomization aggregates all subtrees in the right order
EXPECTED=(
  "./core"
  "./providers"
  "./provider-configs"
  "./functions"
  "./environment-configs"
  "./xrds"
  "./compositions/core"
  "./compositions/obs-identity"
  "./compositions/schema-gov"
  "./compositions/cloud-bootstrap"
)
for r in "${EXPECTED[@]}"; do
  grep -q "$r" "$ROOT/kustomization.yaml" || { echo "MISSING resource: $r"; exit 1; }
done

# xrds/ is itself a multi-bundle kustomization
for b in core obs-identity schema-gov cloud-bootstrap; do
  grep -q "./$b" "$ROOT/xrds/kustomization.yaml" || { echo "MISSING bundle: $b"; exit 1; }
done

# Whole tree builds offline with kustomize
kustomize build "$ROOT" > /tmp/xp-tree-build.yaml
yamllint -d '{rules: {indentation: disable, line-length: disable, trailing-spaces: disable, document-start: disable}}' /tmp/xp-tree-build.yaml
test "$(grep -c '^kind: ' /tmp/xp-tree-build.yaml)" -ge 90
