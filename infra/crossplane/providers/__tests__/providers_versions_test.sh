#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/providers"

# Table: file -> expected package + version (spec §8.2)
declare -A EXPECT=(
  ["kubernetes.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.14.1"
  ["helm.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-helm:v0.19.0"
  ["http.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-http:v0.27.0"
  ["family-azure.yaml"]="xpkg.upbound.io/upbound/provider-family-azure:v1.5.0"
  ["family-aws.yaml"]="xpkg.upbound.io/upbound/provider-family-aws:v1.10.0"
  ["family-gcp.yaml"]="xpkg.upbound.io/upbound/provider-family-gcp:v1.5.0"
  ["cloudflare.yaml"]="xpkg.upbound.io/milkpirate/provider-cloudflare:v0.4.0"
  ["grafana.yaml"]="xpkg.upbound.io/grafana/provider-grafana:v0.18.0"
  ["vault.yaml"]="xpkg.upbound.io/upbound/provider-vault:v1.0.0"
  ["keycloak.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-keycloak:v2.4.0"
  ["azuread.yaml"]="xpkg.upbound.io/upbound/provider-azuread:v1.1.0"
  ["github.yaml"]="xpkg.upbound.io/coopnorge/provider-github:v0.20.0"
  ["sql.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-sql:v0.10.0"
  ["clickhousedbops.yaml"]="xpkg.upbound.io/altinity/provider-clickhousedbops:v0.3.0"
  ["argocd.yaml"]="xpkg.upbound.io/crossplane-contrib/provider-argocd:v0.10.0"
)

for f in "${!EXPECT[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  grep -q "package: ${EXPECT[$f]}" "$path" || { echo "BAD VERSION in $path (expected ${EXPECT[$f]})"; exit 1; }
  grep -q "kind: Provider" "$path"
done

# Family-Azure subpackages: keyvault, storage, containerregistry @ v1.5.0
for sub in provider-azure-keyvault provider-azure-storage provider-azure-containerregistry; do
  grep -q "package: xpkg.upbound.io/upbound/${sub}:v1.5.0" "$ROOT/family-azure.yaml" || { echo "MISSING azure sub: $sub"; exit 1; }
done

# Family-AWS subpackages: s3, secretsmanager, ecr @ v1.10.0
for sub in provider-aws-s3 provider-aws-secretsmanager provider-aws-ecr; do
  grep -q "package: xpkg.upbound.io/upbound/${sub}:v1.10.0" "$ROOT/family-aws.yaml" || { echo "MISSING aws sub: $sub"; exit 1; }
done

# Family-GCP subpackages: storage, secretmanager, artifactregistry @ v1.5.0
for sub in provider-gcp-storage provider-gcp-secretmanager provider-gcp-artifactregistry; do
  grep -q "package: xpkg.upbound.io/upbound/${sub}:v1.5.0" "$ROOT/family-gcp.yaml" || { echo "MISSING gcp sub: $sub"; exit 1; }
done

# Kustomization lists all 15 base files
for f in "${!EXPECT[@]}"; do
  grep -q "$f" "$ROOT/kustomization.yaml" || { echo "MISSING kustomization entry: $f"; exit 1; }
done

kubeconform -strict -ignore-missing-schemas -summary "$ROOT"/*.yaml
