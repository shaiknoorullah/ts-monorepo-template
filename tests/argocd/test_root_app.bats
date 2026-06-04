#!/usr/bin/env bats

setup() {
  export FILE=infra/argocd/root-app.yaml
}

@test "root-app.yaml exists" {
  [ -f "$FILE" ]
}

@test "root-app is Application kind on argoproj.io/v1alpha1" {
  yq -e '.kind == "Application" and .apiVersion == "argoproj.io/v1alpha1"' "$FILE"
}

@test "root-app is named root in argocd namespace" {
  yq -e '.metadata.name == "root" and .metadata.namespace == "argocd"' "$FILE"
}

@test "root-app has resources-finalizer" {
  yq -e '.metadata.finalizers[] | select(. == "resources-finalizer.argocd.argoproj.io")' "$FILE"
}

@test "root-app source.path is infra/argocd" {
  yq -e '.spec.source.path == "infra/argocd"' "$FILE"
}

@test "root-app directory.recurse is true" {
  yq -e '.spec.source.directory.recurse == true' "$FILE"
}

@test "root-app include glob matches appprojects + appsets + sync-windows + notifications" {
  yq -e '.spec.source.directory.include' "$FILE" | grep -q 'appprojects/\*.yaml'
  yq -e '.spec.source.directory.include' "$FILE" | grep -q 'appset-\*.yaml'
  yq -e '.spec.source.directory.include' "$FILE" | grep -q 'sync-windows/\*.yaml'
  yq -e '.spec.source.directory.include' "$FILE" | grep -q 'notifications.yaml'
}

@test "root-app has ServerSideApply" {
  yq -e '.spec.syncPolicy.syncOptions[] | select(. == "ServerSideApply=true")' "$FILE"
}

@test "kubeconform passes on root-app" {
  kubeconform -strict -ignore-missing-schemas -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
