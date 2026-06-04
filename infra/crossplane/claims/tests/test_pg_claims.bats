#!/usr/bin/env bats

APPS="go-hello py-hello rs-hello"

@test "dev PG claims exist for all three apps with size=xs" {
  for app in $APPS; do
    f="infra/crossplane/claims/dev/${app}-pg.yaml"
    [ -f "${f}" ]
    [ "$(yq eval '.kind' "${f}")" = "PostgresClusterClaim" ]
    [ "$(yq eval '.spec.env' "${f}")" = "dev" ]
    [ "$(yq eval '.spec.size' "${f}")" = "xs" ]
  done
}

@test "staging PG claims exist for all three apps with size=s" {
  for app in $APPS; do
    f="infra/crossplane/claims/staging/${app}-pg.yaml"
    [ -f "${f}" ]
    [ "$(yq eval '.spec.size' "${f}")" = "s" ]
  done
}

@test "prod PG claims exist for all three apps with size=m" {
  for app in $APPS; do
    f="infra/crossplane/claims/prod/${app}-pg.yaml"
    [ -f "${f}" ]
    [ "$(yq eval '.spec.size' "${f}")" = "m" ]
  done
}

@test "every PG claim declares a single database with owner matching app name" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-pg.yaml"
      owner=$(yq eval '.spec.databases[0].owner' "${f}")
      [ "${owner}" = "${app//-/_}_app" ]
    done
  done
}

@test "every env kustomization references its three PG claims" {
  for env in dev staging prod; do
    for app in $APPS; do
      grep -q "^  - ${app}-pg.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
    done
  done
}

@test "parse_claims.sh accepts the PG claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
