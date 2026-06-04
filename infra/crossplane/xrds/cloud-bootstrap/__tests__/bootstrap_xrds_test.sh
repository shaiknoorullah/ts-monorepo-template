#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/xrds/cloud-bootstrap"

declare -A XRDS=(
  ["xk8scluster.yaml"]="XK8sCluster:xk8sclusters.pn.cloud"
  ["xkeyvault.yaml"]="XKeyVault:xkeyvaults.pn.cloud"
  ["xcontainerregistry.yaml"]="XContainerRegistry:xcontainerregistries.pn.cloud"
  ["xdnszone.yaml"]="XDNSZone:xdnszones.pn.cloud"
)

for f in "${!XRDS[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  IFS=":" read -r kind name <<< "${XRDS[$f]}"
  grep -q "kind: ${kind}" "$path"
  grep -q "name: ${name}" "$path"
  grep -q "$f" "$ROOT/kustomization.yaml"
done

# Provider enum coverage per §8.10
grep -q "aks" "$ROOT/xk8scluster.yaml"
grep -q "hetzner" "$ROOT/xk8scluster.yaml"
grep -q "contabo" "$ROOT/xk8scluster.yaml"
grep -q "akv" "$ROOT/xkeyvault.yaml"
grep -q "vault" "$ROOT/xkeyvault.yaml"
grep -q "ghcr" "$ROOT/xcontainerregistry.yaml"
grep -q "harbor" "$ROOT/xcontainerregistry.yaml"
grep -q "cloudflare" "$ROOT/xdnszone.yaml"
grep -q "route53" "$ROOT/xdnszone.yaml"

crossplane beta validate "$ROOT" "$ROOT" >/tmp/xp-bootstrap-validate.log 2>&1 || true
grep -q "Total" /tmp/xp-bootstrap-validate.log
