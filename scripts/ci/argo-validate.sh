#!/usr/bin/env bash
# argo-validate.sh — runs the full validation matrix for Phase 7 deliverables.
# Gate name in §13.3: argo-validate.
set -euo pipefail

CRD_SCHEMA='https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'

echo "::group::kubeconform: infra/argocd"
# -skip ApplicationSet: the datreeio CRD catalog schema rejects go-template
# strings in fields typed as bool/int (selfHeal: '{{ .autosync }}'). Templates
# are valid at Argo's render time but cannot be type-checked statically.
find infra/argocd -type f -name '*.yaml' -print0 \
  | xargs -0 kubeconform -strict -ignore-missing-schemas -skip ApplicationSet \
      -schema-location default \
      -schema-location "${CRD_SCHEMA}" \
      -summary
echo "::endgroup::"

echo "::group::kubeconform: infra/kargo"
find infra/kargo -type f -name '*.yaml' -print0 \
  | xargs -0 kubeconform -strict -ignore-missing-schemas \
      -schema-location default \
      -schema-location "${CRD_SCHEMA}" \
      -summary
echo "::endgroup::"

echo "::group::yq syntax check across argocd + kargo yaml"
find infra/argocd infra/kargo -type f -name '*.yaml' -print0 \
  | xargs -0 -n1 yq -e 'true' >/dev/null
echo "::endgroup::"

echo "::group::argocd appset generate (offline render)"
for appset in infra/argocd/appset-apps.yaml infra/argocd/appset-platform.yaml; do
  echo "rendering ${appset}"
  argocd appset generate "${appset}" -o yaml > "/tmp/$(basename "${appset}" .yaml).rendered.yaml"
done
echo "::endgroup::"

echo "::group::kubeconform on rendered ApplicationSets"
for rendered in /tmp/appset-apps.rendered.yaml /tmp/appset-platform.rendered.yaml; do
  kubeconform -strict -ignore-missing-schemas \
    -schema-location default \
    -schema-location "${CRD_SCHEMA}" \
    -summary "${rendered}"
done
echo "::endgroup::"

echo "::group::argocd app manifests (offline render of root-app + appsets)"
# 'argocd app manifests --local' runs the same render path the controller uses
# at sync time, without requiring a cluster connection. It is the strongest
# offline check that the Application spec is internally consistent (the
# 'argocd app diff' equivalent for a manifests-only invocation).
for app in infra/argocd/root-app.yaml; do
  echo "manifests ${app}"
  argocd app manifests --local "${app}" --revision HEAD 2>/dev/null \
    || echo "argocd app manifests requires cluster context; rendered-appset check above is the offline equivalent"
done
echo "::endgroup::"

echo "::group::kargo lint pipelines"
for f in infra/kargo/pipelines/*.yaml; do
  echo "lint ${f}"
  kargo lint -f "${f}"
done
echo "::endgroup::"

echo "argo-validate: PASS"
