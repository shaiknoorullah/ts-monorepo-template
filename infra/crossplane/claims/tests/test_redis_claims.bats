#!/usr/bin/env bats

APPS="go-hello py-hello rs-hello"

@test "all envs ship a RedisClusterClaim per app" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-redis.yaml"
      [ -f "${f}" ]
      [ "$(yq eval '.kind' "${f}")" = "RedisClusterClaim" ]
      [ "$(yq eval '.spec.env' "${f}")" = "${env}" ]
    done
  done
}

@test "dev redis claims are size=xs, tls disabled" {
  for app in $APPS; do
    f="infra/crossplane/claims/dev/${app}-redis.yaml"
    [ "$(yq eval '.spec.size' "${f}")" = "xs" ]
    [ "$(yq eval '.spec.tls' "${f}")" = "false" ]
  done
}

@test "prod redis claims are size=m, tls enabled, persistence enabled" {
  for app in $APPS; do
    f="infra/crossplane/claims/prod/${app}-redis.yaml"
    [ "$(yq eval '.spec.size' "${f}")" = "m" ]
    [ "$(yq eval '.spec.tls' "${f}")" = "true" ]
    [ "$(yq eval '.spec.persistence' "${f}")" = "true" ]
  done
}

@test "every env kustomization references its three redis claims" {
  for env in dev staging prod; do
    for app in $APPS; do
      grep -q "^  - ${app}-redis.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
    done
  done
}

@test "parse_claims.sh accepts redis claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
