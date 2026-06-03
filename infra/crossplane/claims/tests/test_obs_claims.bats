#!/usr/bin/env bats

APPS="go-hello py-hello rs-hello"

@test "every env+app has a ServiceObservabilityClaim" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-obs.yaml"
      [ -f "${f}" ]
      [ "$(yq eval '.kind' "${f}")" = "ServiceObservabilityClaim" ]
      [ "$(yq eval '.spec.env' "${f}")" = "${env}" ]
      [ "$(yq eval '.spec.metricsPath' "${f}")" = "/metrics" ]
      [ "$(yq eval '.spec.selector.matchLabels."app.kubernetes.io/name"' "${f}")" = "${app}" ]
    done
  done
}

@test "dev alertingTo=null; staging alertingTo=pager-default; prod alertingTo=pager-default" {
  for app in $APPS; do
    [ "$(yq eval '.spec.alertingTo' "infra/crossplane/claims/dev/${app}-obs.yaml")" = "null" ]
    [ "$(yq eval '.spec.alertingTo' "infra/crossplane/claims/staging/${app}-obs.yaml")" = "pager-default" ]
    [ "$(yq eval '.spec.alertingTo' "infra/crossplane/claims/prod/${app}-obs.yaml")" = "pager-default" ]
  done
}

@test "every claim has the three SLOs (availability, latency, error-rate)" {
  for env in dev staging prod; do
    for app in $APPS; do
      f="infra/crossplane/claims/${env}/${app}-obs.yaml"
      [ "$(yq eval '.spec.slos | length' "${f}")" = "3" ]
    done
  done
}

@test "every env kustomization references three obs claims" {
  for env in dev staging prod; do
    for app in $APPS; do
      grep -q "^  - ${app}-obs.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
    done
  done
}

@test "parse_claims.sh accepts obs claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
