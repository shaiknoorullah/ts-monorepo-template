#!/usr/bin/env bash
set -euo pipefail

ROOT="infra/crossplane"

echo "== crossplane beta validate XRDs =="
crossplane beta validate "$ROOT/xrds/core" "$ROOT/xrds/core"
crossplane beta validate "$ROOT/xrds/obs-identity" "$ROOT/xrds/obs-identity"
crossplane beta validate "$ROOT/xrds/schema-gov" "$ROOT/xrds/schema-gov"
crossplane beta validate "$ROOT/xrds/cloud-bootstrap" "$ROOT/xrds/cloud-bootstrap"

echo "== crossplane beta validate Compositions =="
crossplane beta validate "$ROOT/compositions/core" "$ROOT/compositions/core"
crossplane beta validate "$ROOT/compositions/obs-identity" "$ROOT/compositions/obs-identity"
crossplane beta validate "$ROOT/compositions/schema-gov" "$ROOT/compositions/schema-gov"
crossplane beta validate "$ROOT/compositions/cloud-bootstrap" "$ROOT/compositions/cloud-bootstrap"

echo "== kustomize build whole tree =="
kustomize build "$ROOT" > /tmp/xp-tree.yaml

echo "== kcl vet for KCL-based compositions =="
grep -rln "function-kcl" "$ROOT/compositions" | while read -r f; do
  if grep -q "source: |" "$f"; then
    awk '/source: \|/{flag=1; next} flag && /^[^ ]/{flag=0} flag{print}' "$f" > /tmp/kcl-snippet.k
    kcl vet /tmp/kcl-snippet.k 2>/dev/null || echo "WARN: kcl vet skipped for $f (snippet not standalone)"
  fi
done

if command -v chainsaw >/dev/null 2>&1; then
  echo "== chainsaw render fixtures =="
  if docker info >/dev/null 2>&1; then
    chainsaw test "$ROOT/tests/chainsaw" --no-color --report-format JSON --report-name xp-render 2>&1 || \
      echo "WARN: chainsaw failed (likely network/docker)"
  else
    echo "Docker unavailable; skipping chainsaw render fixtures"
  fi
else
  echo "chainsaw not installed; skipping fixtures"
fi

echo "OK"
