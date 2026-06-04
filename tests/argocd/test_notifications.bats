#!/usr/bin/env bats

setup() { export FILE=infra/argocd/notifications.yaml; }

@test "notifications.yaml exists" {
  [ -f "$FILE" ]
}

@test "notifications.yaml is ConfigMap named argocd-notifications-cm" {
  yq -e 'select(documentIndex == 0) | .kind == "ConfigMap"' "$FILE"
  yq -e 'select(documentIndex == 0) | .metadata.name == "argocd-notifications-cm"' "$FILE"
}

@test "ConfigMap declares slack service" {
  yq -e 'select(documentIndex == 0) | .data["service.slack"]' "$FILE" | grep -q token
}

@test "trigger on-sync-failed is declared" {
  yq -e 'select(documentIndex == 0) | .data["trigger.on-sync-failed"]' "$FILE" | grep -q 'sync.status\|operationState'
}

@test "trigger on-out-of-sync is declared" {
  yq -e 'select(documentIndex == 0) | .data["trigger.on-out-of-sync"]' "$FILE" | grep -q OutOfSync
}

@test "trigger on-health-degraded is declared" {
  yq -e 'select(documentIndex == 0) | .data["trigger.on-health-degraded"]' "$FILE" | grep -q Degraded
}

@test "trigger on-promotion-failed is declared" {
  yq -e 'select(documentIndex == 0) | .data["trigger.on-promotion-failed"]' "$FILE" | grep -q Failed
}

@test "template app-sync-failed mentions Slack message field" {
  yq -e 'select(documentIndex == 0) | .data["template.app-sync-failed"]' "$FILE" | grep -q message
}

@test "ExternalSecret for slack webhook is declared" {
  yq -e 'select(documentIndex == 1) | .kind == "ExternalSecret"' "$FILE"
  yq -e 'select(documentIndex == 1) | .metadata.name == "argocd-notifications-secret"' "$FILE"
}

@test "kubeconform passes on notifications.yaml" {
  kubeconform -strict -ignore-missing-schemas -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
