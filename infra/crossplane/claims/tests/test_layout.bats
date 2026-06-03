#!/usr/bin/env bats

@test "dev claims directory exists with kustomization" {
  [ -f infra/crossplane/claims/dev/kustomization.yaml ]
}

@test "staging claims directory exists with kustomization" {
  [ -f infra/crossplane/claims/staging/kustomization.yaml ]
}

@test "prod claims directory exists with kustomization" {
  [ -f infra/crossplane/claims/prod/kustomization.yaml ]
}

@test "all kustomizations declare the kustomize.config.k8s.io/v1beta1 apiVersion" {
  for env in dev staging prod; do
    grep -q '^apiVersion: kustomize.config.k8s.io/v1beta1$' \
      "infra/crossplane/claims/${env}/kustomization.yaml"
  done
}

@test "claims README exists" {
  [ -f infra/crossplane/claims/README.md ]
}
