#!/usr/bin/env bats

@test "py-hello + rs-hello pipeline files exist" {
  [ -f infra/kargo/pipelines/py-hello.yaml ]
  [ -f infra/kargo/pipelines/rs-hello.yaml ]
}

@test "py-hello Warehouse subscribes to ghcr.io/REPLACE_ORG/py-hello" {
  yq -e 'select(.kind == "Warehouse") | .spec.subscriptions[].image.repoURL' \
    infra/kargo/pipelines/py-hello.yaml | grep -q 'ghcr.io/REPLACE_ORG/py-hello'
}

@test "rs-hello Warehouse subscribes to ghcr.io/REPLACE_ORG/rs-hello" {
  yq -e 'select(.kind == "Warehouse") | .spec.subscriptions[].image.repoURL' \
    infra/kargo/pipelines/rs-hello.yaml | grep -q 'ghcr.io/REPLACE_ORG/rs-hello'
}

@test "both pipelines emit 3 Stage docs" {
  for svc in py-hello rs-hello; do
    test "$(yq 'select(.kind == "Stage")' "infra/kargo/pipelines/${svc}.yaml" | grep -c '^kind: Stage$')" = "3"
  done
}

@test "both pipelines emit smoke + slo AnalysisTemplates" {
  for svc in py-hello rs-hello; do
    yq -e 'select(.kind == "AnalysisTemplate" and .metadata.name == "smoke")' "infra/kargo/pipelines/${svc}.yaml"
    yq -e 'select(.kind == "AnalysisTemplate" and .metadata.name == "slo")' "infra/kargo/pipelines/${svc}.yaml"
  done
}

@test "kubeconform passes on both pipelines" {
  for svc in py-hello rs-hello; do
    kubeconform -strict -ignore-missing-schemas -schema-location default \
      -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
      "infra/kargo/pipelines/${svc}.yaml"
  done
}
