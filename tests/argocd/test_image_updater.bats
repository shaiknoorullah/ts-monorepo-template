#!/usr/bin/env bats

setup() { export FILE=infra/argocd/image-updater-config.yaml; }

@test "image-updater-config.yaml exists" {
  [ -f "$FILE" ]
}

@test "it is the argocd-image-updater-config ConfigMap" {
  yq -e '.kind == "ConfigMap"' "$FILE"
  yq -e '.metadata.name == "argocd-image-updater-config"' "$FILE"
  yq -e '.metadata.namespace == "argocd"' "$FILE"
}

@test "registries.conf points to ghcr.io" {
  yq -e '.data["registries.conf"]' "$FILE" | grep -q 'api_url: https://ghcr.io'
  yq -e '.data["registries.conf"]' "$FILE" | grep -q 'prefix: ghcr.io'
}

@test "applications.conf scopes write-back to helmvalues:./values.dev.yaml" {
  yq -e '.data["applications.conf"]' "$FILE" | grep -q 'write-back-target: helmvalues:./values.dev.yaml'
  yq -e '.data["applications.conf"]' "$FILE" | grep -q 'write-back-method: git'
}

@test "applications.conf restricts to apps-dev project" {
  yq -e '.data["applications.conf"]' "$FILE" | grep -q 'apps-dev'
}

@test "kubeconform passes on image-updater-config" {
  kubeconform -strict -ignore-missing-schemas -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
