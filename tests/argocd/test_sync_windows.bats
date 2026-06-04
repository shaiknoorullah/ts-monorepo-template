#!/usr/bin/env bats

@test "staging-maint sync-window file exists" {
  [ -f infra/argocd/sync-windows/staging-maint.yaml ]
}

@test "prod-freeze sync-window file exists" {
  [ -f infra/argocd/sync-windows/prod-freeze.yaml ]
}

@test "staging-maint patches apps-staging AppProject" {
  yq -e '.metadata.name == "apps-staging"' infra/argocd/sync-windows/staging-maint.yaml
  yq -e '.kind == "AppProject"' infra/argocd/sync-windows/staging-maint.yaml
}

@test "staging-maint has allow + deny windows" {
  yq -e '.spec.syncWindows[] | select(.kind == "allow")' infra/argocd/sync-windows/staging-maint.yaml
  yq -e '.spec.syncWindows[] | select(.kind == "deny")' infra/argocd/sync-windows/staging-maint.yaml
}

@test "staging-maint allow schedule is weekday 09:00 UTC for 9h" {
  yq -e '.spec.syncWindows[] | select(.kind == "allow") | .schedule == "0 9 * * 1-5"' \
    infra/argocd/sync-windows/staging-maint.yaml
  yq -e '.spec.syncWindows[] | select(.kind == "allow") | .duration == "9h"' \
    infra/argocd/sync-windows/staging-maint.yaml
}

@test "prod-freeze patches apps-prod AppProject" {
  yq -e '.metadata.name == "apps-prod"' infra/argocd/sync-windows/prod-freeze.yaml
  yq -e '.kind == "AppProject"' infra/argocd/sync-windows/prod-freeze.yaml
}

@test "prod-freeze has Fri-Mon deny window with manualSync=false" {
  yq -e '.spec.syncWindows[] | select(.kind == "deny") | .schedule == "0 0 * * 5"' \
    infra/argocd/sync-windows/prod-freeze.yaml
  yq -e '.spec.syncWindows[] | select(.kind == "deny") | .duration == "72h"' \
    infra/argocd/sync-windows/prod-freeze.yaml
  yq -e '.spec.syncWindows[] | select(.kind == "deny") | .manualSync == false' \
    infra/argocd/sync-windows/prod-freeze.yaml
}

@test "kubeconform passes on both sync-window files" {
  for f in infra/argocd/sync-windows/staging-maint.yaml infra/argocd/sync-windows/prod-freeze.yaml; do
    kubeconform -strict -ignore-missing-schemas -schema-location default \
      -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
      "$f"
  done
}
