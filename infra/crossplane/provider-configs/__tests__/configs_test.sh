#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/provider-configs"

# Every external ProviderConfig must reference an ExternalSecret in same file (per §8.3 pattern)
for f in azure.yaml azuread.yaml aws.yaml gcp.yaml cloudflare.yaml grafana.yaml vault.yaml keycloak.yaml github.yaml http-apicurio.yaml; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  grep -q "kind: ExternalSecret" "$path" || { echo "MISSING ExternalSecret in $path"; exit 1; }
  grep -q "kind: ProviderConfig" "$path" || { echo "MISSING ProviderConfig in $path"; exit 1; }
  grep -q "name: platform-store" "$path" || { echo "MISSING platform-store ref in $path"; exit 1; }
  grep -q "kind: ClusterSecretStore" "$path" || { echo "MISSING ClusterSecretStore kind in $path"; exit 1; }
  grep -q "namespace: crossplane-system" "$path" || { echo "MISSING crossplane-system ns in $path"; exit 1; }
done

# Spec §8.3 secret-key table
grep -q "key: crossplane/azure-sp-json" "$ROOT/azure.yaml"
grep -q "key: crossplane/azure-sp-json" "$ROOT/azuread.yaml"
grep -q "key: crossplane/aws-creds" "$ROOT/aws.yaml"
grep -q "key: crossplane/gcp-sa-json" "$ROOT/gcp.yaml"
grep -q "key: crossplane/cloudflare-api-token" "$ROOT/cloudflare.yaml"
grep -q "key: crossplane/grafana-api-key" "$ROOT/grafana.yaml"
grep -q "key: crossplane/vault-token" "$ROOT/vault.yaml"
grep -q "key: crossplane/keycloak-admin" "$ROOT/keycloak.yaml"
grep -q "key: crossplane/github-pat" "$ROOT/github.yaml"
grep -q "key: crossplane/apicurio-basic" "$ROOT/http-apicurio.yaml"

# kubernetes + helm use InjectedIdentity (no secret)
grep -q "source: InjectedIdentity" "$ROOT/kubernetes-incluster.yaml"
grep -q "source: InjectedIdentity" "$ROOT/helm-incluster.yaml"

# All files referenced in kustomization
for f in azure.yaml azuread.yaml aws.yaml gcp.yaml cloudflare.yaml grafana.yaml vault.yaml keycloak.yaml github.yaml http-apicurio.yaml kubernetes-incluster.yaml helm-incluster.yaml; do
  grep -q "$f" "$ROOT/kustomization.yaml" || { echo "MISSING kustomization entry: $f"; exit 1; }
done
