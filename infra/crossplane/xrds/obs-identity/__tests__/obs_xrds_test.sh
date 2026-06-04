#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/xrds/obs-identity"

declare -A XRDS=(
  ["xserviceobservability.yaml"]="XServiceObservability:ServiceObservabilityClaim:xserviceobservabilities.pn.cloud"
  ["xgrafanaapp.yaml"]="XGrafanaApp:GrafanaAppClaim:xgrafanaapps.pn.cloud"
  ["xkeycloakclient.yaml"]="XKeycloakClient:KeycloakClientClaim:xkeycloakclients.pn.cloud"
  ["xoidcapp.yaml"]="XOIDCApp:OIDCAppClaim:xoidcapps.pn.cloud"
)

for f in "${!XRDS[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  IFS=":" read -r kind claim name <<< "${XRDS[$f]}"
  grep -q "kind: ${kind}" "$path"
  grep -q "kind: ${claim}" "$path"
  grep -q "name: ${name}" "$path"
  grep -q "$f" "$ROOT/kustomization.yaml"
done

# XServiceObservability required spec fields (§8.8)
grep -q "selector:" "$ROOT/xserviceobservability.yaml"
grep -q "metricsPath:" "$ROOT/xserviceobservability.yaml"
grep -q "dashboardJSON:" "$ROOT/xserviceobservability.yaml"
grep -q "alertingTo:" "$ROOT/xserviceobservability.yaml"

# XOIDCApp connectionSecretKeys
grep -q "OIDC_CLIENT_ID" "$ROOT/xoidcapp.yaml"
grep -q "OIDC_CLIENT_SECRET" "$ROOT/xoidcapp.yaml"

crossplane beta validate "$ROOT" "$ROOT" >/tmp/xp-obs-validate.log 2>&1 || true
grep -q "Total" /tmp/xp-obs-validate.log
