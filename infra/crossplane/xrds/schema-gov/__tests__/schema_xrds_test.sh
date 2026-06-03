#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/xrds/schema-gov"

declare -A XRDS=(
  ["xregistryinstance.yaml"]="XRegistryInstance:xregistryinstances.pn.cloud"
  ["xschemagroup.yaml"]="XSchemaGroup:xschemagroups.pn.cloud"
  ["xschemaartifact.yaml"]="XSchemaArtifact:xschemaartifacts.pn.cloud"
  ["xkafkaproxyplane.yaml"]="XKafkaProxyPlane:xkafkaproxyplanes.pn.cloud"
  ["xvirtualkafkacluster.yaml"]="XVirtualKafkaCluster:xvirtualkafkaclusters.pn.cloud"
  ["xkafkaprotocolfilter.yaml"]="XKafkaProtocolFilter:xkafkaprotocolfilters.pn.cloud"
  ["xdatacontract.yaml"]="XDataContract:xdatacontracts.pn.cloud"
  ["xglobalruleset.yaml"]="XGlobalRuleSet:xglobalrulesets.pn.cloud"
  ["xrecordencryptionfilter.yaml"]="XRecordEncryptionFilter:xrecordencryptionfilters.pn.cloud"
  ["xrecordvalidationfilter.yaml"]="XRecordValidationFilter:xrecordvalidationfilters.pn.cloud"
  ["xauthorizationfilter.yaml"]="XAuthorizationFilter:xauthorizationfilters.pn.cloud"
)

for f in "${!XRDS[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  IFS=":" read -r kind name <<< "${XRDS[$f]}"
  grep -q "kind: ${kind}" "$path"
  grep -q "name: ${name}" "$path"
  grep -q "$f" "$ROOT/kustomization.yaml"
done

crossplane beta validate "$ROOT" "$ROOT" >/tmp/xp-schema-validate.log 2>&1 || true
grep -q "Total" /tmp/xp-schema-validate.log
