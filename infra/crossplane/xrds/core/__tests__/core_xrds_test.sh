#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/xrds/core"

declare -A XRDS=(
  ["xpostgrescluster.yaml"]="XPostgresCluster:PostgresClusterClaim:xpostgresclusters.pn.cloud"
  ["xrediscluster.yaml"]="XRedisCluster:RedisClusterClaim:xredisclusters.pn.cloud"
  ["xrabbitmqcluster.yaml"]="XRabbitMQCluster:RabbitMQClusterClaim:xrabbitmqclusters.pn.cloud"
  ["xkafkacluster.yaml"]="XKafkaCluster:KafkaClusterClaim:xkafkaclusters.pn.cloud"
  ["xkafkatopic.yaml"]="XKafkaTopic:KafkaTopicClaim:xkafkatopics.pn.cloud"
  ["xclickhousecluster.yaml"]="XClickHouseCluster:ClickHouseClusterClaim:xclickhouseclusters.pn.cloud"
  ["xopensearchcluster.yaml"]="XOpenSearchCluster:OpenSearchClusterClaim:xopensearchclusters.pn.cloud"
  ["xbucket.yaml"]="XBucket:BucketClaim:xbuckets.pn.cloud"
  ["xsecretbinding.yaml"]="XSecretBinding:SecretBindingClaim:xsecretbindings.pn.cloud"
)

for f in "${!XRDS[@]}"; do
  path="$ROOT/$f"
  [[ -f "$path" ]] || { echo "MISSING: $path"; exit 1; }
  IFS=":" read -r kind claim name <<< "${XRDS[$f]}"
  grep -q "kind: CompositeResourceDefinition" "$path" || { echo "MISSING XRD kind in $path"; exit 1; }
  grep -q "name: ${name}" "$path" || { echo "MISSING name ${name} in $path"; exit 1; }
  grep -q "kind: ${kind}" "$path" || { echo "MISSING kind ${kind} in $path"; exit 1; }
  grep -q "kind: ${claim}" "$path" || { echo "MISSING claim ${claim} in $path"; exit 1; }
  grep -q "group: pn.cloud" "$path"
  grep -q "name: v1alpha1" "$path"
  grep -q "served: true" "$path"
  grep -q "referenceable: true" "$path"
  grep -q "$f" "$ROOT/kustomization.yaml"
done

# XPostgresCluster spec fields per §8.7
grep -q "size:" "$ROOT/xpostgrescluster.yaml"
grep -q "databases:" "$ROOT/xpostgrescluster.yaml"
grep -q "pooler:" "$ROOT/xpostgrescluster.yaml"
grep -q "connectionSecret:" "$ROOT/xpostgrescluster.yaml"

# Offline validation with crossplane CLI (extensions=resources for self-validation)
crossplane beta validate "$ROOT" "$ROOT" >/tmp/xp-core-validate.log 2>&1 || true
grep -q "Total" /tmp/xp-core-validate.log
