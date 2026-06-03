#!/usr/bin/env bats

@test "5 AppProject files exist" {
  for p in platform infra apps-dev apps-staging apps-prod; do
    [ -f "infra/argocd/appprojects/${p}.yaml" ]
  done
}

@test "every AppProject is AppProject kind" {
  for p in platform infra apps-dev apps-staging apps-prod; do
    yq -e '.kind == "AppProject"' "infra/argocd/appprojects/${p}.yaml"
  done
}

@test "apps-dev destination namespaces are *-dev" {
  yq -e '.spec.destinations[] | select(.namespace == "*-dev")' \
    infra/argocd/appprojects/apps-dev.yaml
}

@test "apps-staging destination namespaces are *-staging" {
  yq -e '.spec.destinations[] | select(.namespace == "*-staging")' \
    infra/argocd/appprojects/apps-staging.yaml
}

@test "apps-prod destination namespaces are *-prod" {
  yq -e '.spec.destinations[] | select(.namespace == "*-prod")' \
    infra/argocd/appprojects/apps-prod.yaml
}

@test "platform whitelists CRDs and ClusterRoles" {
  yq -e '.spec.clusterResourceWhitelist[] | select(.kind == "*")' \
    infra/argocd/appprojects/platform.yaml
}

@test "infra whitelists CRD/ClusterRole/StorageClass" {
  yq -e '.spec.clusterResourceWhitelist[] | select(.kind == "CustomResourceDefinition")' \
    infra/argocd/appprojects/infra.yaml
  yq -e '.spec.clusterResourceWhitelist[] | select(.kind == "ClusterRole")' \
    infra/argocd/appprojects/infra.yaml
  yq -e '.spec.clusterResourceWhitelist[] | select(.kind == "StorageClass")' \
    infra/argocd/appprojects/infra.yaml
}

@test "apps-prod has manual-only signal label" {
  yq -e '.metadata.labels."argocd.argoproj.io/self-heal" == "false"' \
    infra/argocd/appprojects/apps-prod.yaml
}

@test "kubeconform passes on every appproject" {
  for p in platform infra apps-dev apps-staging apps-prod; do
    kubeconform -strict -ignore-missing-schemas -schema-location default \
      -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
      "infra/argocd/appprojects/${p}.yaml"
  done
}
