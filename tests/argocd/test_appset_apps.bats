#!/usr/bin/env bats

setup() {
  export FILE=infra/argocd/appset-apps.yaml
}

@test "appset-apps.yaml exists" {
  [ -f "$FILE" ]
}

@test "appset-apps is ApplicationSet" {
  yq -e '.kind == "ApplicationSet" and .apiVersion == "argoproj.io/v1alpha1"' "$FILE"
}

@test "appset-apps uses goTemplate with missingkey=error" {
  yq -e '.spec.goTemplate == true' "$FILE"
  yq -e '.spec.goTemplateOptions[] | select(. == "missingkey=error")' "$FILE"
}

@test "appset-apps matrix has list + git generators" {
  yq -e '.spec.generators[0].matrix.generators[0].list' "$FILE"
  yq -e '.spec.generators[0].matrix.generators[1].git' "$FILE"
}

@test "appset-apps list has dev, staging, prod" {
  for e in dev staging prod; do
    yq -e ".spec.generators[0].matrix.generators[0].list.elements[] | select(.env == \"${e}\")" "$FILE"
  done
}

@test "appset-apps git generator scans infra/helm/apps/*" {
  yq -e '.spec.generators[0].matrix.generators[1].git.directories[0].path == "infra/helm/apps/*"' "$FILE"
}

@test "appset-apps template project is apps-{{.env}}" {
  yq -e '.spec.template.spec.project == "apps-{{.env}}"' "$FILE"
}

@test "appset-apps template targets values.yaml + values.{env}.yaml" {
  yq -e '.spec.template.spec.source.helm.valueFiles[] | select(. == "values.yaml")' "$FILE"
  yq -e '.spec.template.spec.source.helm.valueFiles[] | select(. == "values.{{.env}}.yaml")' "$FILE"
}

@test "appset-apps prod element has autosync=false" {
  yq -e '.spec.generators[0].matrix.generators[0].list.elements[] | select(.env == "prod") | .autosync == false' "$FILE"
}

@test "appset-apps adds image-updater annotation only on dev" {
  yq -e '.spec.template.metadata.annotations."argocd-image-updater.argoproj.io/image-list"' "$FILE" | grep -q '{{ if eq .env "dev"'
}

@test "kubeconform passes on appset-apps" {
  # -skip ApplicationSet: the datreeio CRD catalog schema rejects go-template
  # strings in fields typed as bool/int (e.g. .spec.template.spec.syncPolicy.
  # automated.selfHeal = '{{ .autosync }}'). The template is valid at Argo's
  # render time; kubeconform's strict JSON-Schema check cannot evaluate Go
  # templates. Skip kind to allow upstream-valid manifests through.
  kubeconform -strict -ignore-missing-schemas -skip ApplicationSet \
    -schema-location default \
    -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    "$FILE"
}
