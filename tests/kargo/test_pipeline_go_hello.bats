#!/usr/bin/env bats

setup() { export FILE=infra/kargo/pipelines/go-hello.yaml; }

@test "go-hello pipeline file exists" {
  [ -f "$FILE" ]
}

@test "go-hello has Project, Warehouse, 3 Stages, 2 AnalysisTemplates" {
  test "$(yq 'select(.kind == "Project") | .metadata.name' "$FILE" | grep -c '^go-hello$')" = "1"
  test "$(yq 'select(.kind == "Warehouse") | .metadata.name' "$FILE" | grep -c '^go-hello$')" = "1"
  test "$(yq 'select(.kind == "Stage")' "$FILE" | grep -c '^kind: Stage$')" = "3"
  test "$(yq 'select(.kind == "AnalysisTemplate") | .metadata.name' "$FILE" | grep -c '^smoke$')" = "1"
  test "$(yq 'select(.kind == "AnalysisTemplate") | .metadata.name' "$FILE" | grep -c '^slo$')" = "1"
}

@test "go-hello Warehouse subscribes to ghcr.io/REPLACE_ORG/go-hello" {
  yq -e 'select(.kind == "Warehouse") | .spec.subscriptions[].image.repoURL' "$FILE" \
    | grep -q 'ghcr.io/REPLACE_ORG/go-hello'
}

@test "go-hello dev stage updates values.dev.yaml" {
  yq 'select(.kind == "Stage" and .metadata.name == "dev")' "$FILE" \
    | grep -q 'infra/helm/apps/go-hello/values.dev.yaml'
}

@test "go-hello staging stage takes freight from dev" {
  yq -e 'select(.kind == "Stage" and .metadata.name == "staging") | .spec.requestedFreight[].sources.stages[] | select(. == "dev")' "$FILE"
}

@test "go-hello prod stage takes freight from staging" {
  yq -e 'select(.kind == "Stage" and .metadata.name == "prod") | .spec.requestedFreight[].sources.stages[] | select(. == "staging")' "$FILE"
}

@test "go-hello staging + prod reference smoke and slo AnalysisTemplates" {
  yq -e 'select(.kind == "Stage" and .metadata.name == "staging") | .spec.verification.analysisTemplates[] | select(.name == "smoke")' "$FILE"
  yq -e 'select(.kind == "Stage" and .metadata.name == "staging") | .spec.verification.analysisTemplates[] | select(.name == "slo")' "$FILE"
  yq -e 'select(.kind == "Stage" and .metadata.name == "prod") | .spec.verification.analysisTemplates[] | select(.name == "smoke")' "$FILE"
  yq -e 'select(.kind == "Stage" and .metadata.name == "prod") | .spec.verification.analysisTemplates[] | select(.name == "slo")' "$FILE"
}

@test "smoke AnalysisTemplate hits /healthz on the env service" {
  yq -e 'select(.kind == "AnalysisTemplate" and .metadata.name == "smoke") | .spec.metrics[].provider.web.url' "$FILE" \
    | grep -q '/healthz'
}

@test "slo AnalysisTemplate queries Prometheus" {
  yq -e 'select(.kind == "AnalysisTemplate" and .metadata.name == "slo") | .spec.metrics[].provider.prometheus.address' "$FILE" \
    | grep -q 'kube-prometheus-stack-prometheus.observability:9090'
}

@test "kubeconform passes on go-hello pipeline" {
  kubeconform -strict -ignore-missing-schemas -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
