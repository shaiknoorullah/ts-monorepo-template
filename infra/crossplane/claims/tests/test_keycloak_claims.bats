#!/usr/bin/env bats

APPS="go-hello py-hello rs-hello"

@test "every env+app has a KeycloakClientClaim with realm=platform" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-keycloak.yaml"
      [ -f "${f}" ]
      [ "$(yq eval '.kind' "${f}")" = "KeycloakClientClaim" ]
      [ "$(yq eval '.spec.realm' "${f}")" = "platform" ]
    done
  done
}

@test "clientId equals <app>-<env>" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-keycloak.yaml"
      [ "$(yq eval '.spec.clientId' "${f}")" = "${app}-${env}" ]
    done
  done
}

@test "every redirectUri uses the env-scoped host" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-keycloak.yaml"
      first=$(yq eval '.spec.redirectUris[0]' "${f}")
      case "${env}" in
        dev)     expected="http://${app}.localtest.me/callback" ;;
        staging) expected="https://${app}.staging.pn.cloud/callback" ;;
        prod)    expected="https://${app}.pn.cloud/callback" ;;
      esac
      [ "${first}" = "${expected}" ]
    done
  done
}

@test "every keycloak claim requests openid+profile+email scopes" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-keycloak.yaml"
      scopes=$(yq eval '.spec.scopes | join(",")' "${f}")
      [ "${scopes}" = "openid,profile,email" ]
    done
  done
}

@test "every env kustomization references three keycloak claims" {
  for env in dev staging prod; do
    for app in $APPS; do
      grep -q "^  - ${app}-keycloak.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
    done
  done
}

@test "parse_claims.sh accepts keycloak claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
