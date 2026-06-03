#!/usr/bin/env bats

setup() { export FILE=infra/argocd/appset-platform.yaml; }

@test "appset-platform.yaml exists" {
  [ -f "$FILE" ]
}

@test "appset-platform is ApplicationSet on argoproj.io/v1alpha1" {
  yq -e '.kind == "ApplicationSet" and .apiVersion == "argoproj.io/v1alpha1"' "$FILE"
}

@test "appset-platform iterates crossplane subdirs" {
  yq -e '.spec.generators[0].matrix.generators[1].git.directories[].path' "$FILE" \
    | grep -q 'infra/crossplane/providers/\*'
  yq -e '.spec.generators[0].matrix.generators[1].git.directories[].path' "$FILE" \
    | grep -q 'infra/crossplane/functions/\*'
  yq -e '.spec.generators[0].matrix.generators[1].git.directories[].path' "$FILE" \
    | grep -q 'infra/crossplane/xrds/\*'
  yq -e '.spec.generators[0].matrix.generators[1].git.directories[].path' "$FILE" \
    | grep -q 'infra/crossplane/compositions/\*'
}

@test "appset-platform pins project=platform" {
  yq -e '.spec.template.spec.project == "platform"' "$FILE"
}

@test "appset-platform forces selfHeal=false everywhere" {
  yq -e '.spec.template.spec.syncPolicy.automated.selfHeal == false' "$FILE"
}

@test "appset-platform deploys into crossplane-system" {
  yq -e '.spec.template.spec.destination.namespace == "crossplane-system"' "$FILE"
}

@test "kubeconform passes on appset-platform" {
  kubeconform -strict -ignore-missing-schemas -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
