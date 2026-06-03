#!/usr/bin/env bats

@test "argo-validate workflow exists" {
  [ -f .github/workflows/argo-validate.yml ]
}

@test "workflow has argo-validate job (job name from §13.3)" {
  yq -e '.jobs."argo-validate"' .github/workflows/argo-validate.yml
}

@test "workflow installs kubeconform" {
  grep -q 'kubeconform' .github/workflows/argo-validate.yml
}

@test "workflow installs kargo CLI" {
  grep -q 'kargo' .github/workflows/argo-validate.yml
}

@test "workflow installs argocd CLI" {
  grep -q 'argocd' .github/workflows/argo-validate.yml
}

@test "workflow runs scripts/ci/argo-validate.sh" {
  grep -q 'scripts/ci/argo-validate.sh' .github/workflows/argo-validate.yml
}

@test "argo-validate.sh is executable" {
  [ -x scripts/ci/argo-validate.sh ]
}

@test "argo-validate.sh runs kubeconform across infra/argocd + infra/kargo" {
  grep -q 'infra/argocd' scripts/ci/argo-validate.sh
  grep -q 'infra/kargo' scripts/ci/argo-validate.sh
}

@test "argo-validate.sh invokes argocd app-validation render" {
  grep -q 'argocd appset generate' scripts/ci/argo-validate.sh
  grep -q 'argocd app diff\|argocd app manifests' scripts/ci/argo-validate.sh
}

@test "argo-validate.sh invokes kargo lint" {
  grep -q 'kargo' scripts/ci/argo-validate.sh
  grep -q 'lint\|validate' scripts/ci/argo-validate.sh
}

@test "actionlint passes on workflow" {
  actionlint .github/workflows/argo-validate.yml
}
