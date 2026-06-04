#!/usr/bin/env bats

@test "every env has a shared-topics.yaml with topic user.events.v1" {
  for env in dev staging prod; do
    f="infra/crossplane/claims/${env}/shared-topics.yaml"
    [ -f "${f}" ]
    [ "$(yq eval '.kind' "${f}")" = "KafkaTopicClaim" ]
    [ "$(yq eval '.metadata.name' "${f}")" = "user-events-v1" ]
    [ "$(yq eval '.spec.topic' "${f}")" = "user.events.v1" ]
  done
}

@test "dev topic: 1 partition, replicas=1, retention 24h" {
  f="infra/crossplane/claims/dev/shared-topics.yaml"
  [ "$(yq eval '.spec.partitions' "${f}")" = "1" ]
  [ "$(yq eval '.spec.replicas' "${f}")" = "1" ]
  [ "$(yq eval '.spec.retentionMs' "${f}")" = "86400000" ]
}

@test "staging topic: 3 partitions, replicas=2, retention 72h" {
  f="infra/crossplane/claims/staging/shared-topics.yaml"
  [ "$(yq eval '.spec.partitions' "${f}")" = "3" ]
  [ "$(yq eval '.spec.replicas' "${f}")" = "2" ]
  [ "$(yq eval '.spec.retentionMs' "${f}")" = "259200000" ]
}

@test "prod topic: 6 partitions, replicas=3, retention 168h" {
  f="infra/crossplane/claims/prod/shared-topics.yaml"
  [ "$(yq eval '.spec.partitions' "${f}")" = "6" ]
  [ "$(yq eval '.spec.replicas' "${f}")" = "3" ]
  [ "$(yq eval '.spec.retentionMs' "${f}")" = "604800000" ]
}

@test "every env kustomization references shared-topics.yaml" {
  for env in dev staging prod; do
    grep -q "^  - shared-topics.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
  done
}

@test "parse_claims.sh accepts topic claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
