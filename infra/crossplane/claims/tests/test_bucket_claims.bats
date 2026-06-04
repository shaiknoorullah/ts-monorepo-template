#!/usr/bin/env bats

@test "every env ships a shared-bucket.yaml BucketClaim" {
  for env in dev staging prod; do
    f="infra/crossplane/claims/${env}/shared-bucket.yaml"
    [ -f "${f}" ]
    [ "$(yq eval '.kind' "${f}")" = "BucketClaim" ]
    [ "$(yq eval '.metadata.name' "${f}")" = "shared-assets" ]
    [ "$(yq eval '.spec.env' "${f}")" = "${env}" ]
  done
}

@test "bucket provider defaults to azureblob and publicRead is false everywhere" {
  for env in dev staging prod; do
    f="infra/crossplane/claims/${env}/shared-bucket.yaml"
    [ "$(yq eval '.spec.provider' "${f}")" = "azureblob" ]
    [ "$(yq eval '.spec.publicRead' "${f}")" = "false" ]
  done
}

@test "dev bucket: versioning off; prod bucket: versioning on with lifecycle" {
  [ "$(yq eval '.spec.versioning' infra/crossplane/claims/dev/shared-bucket.yaml)" = "false" ]
  [ "$(yq eval '.spec.versioning' infra/crossplane/claims/prod/shared-bucket.yaml)" = "true" ]
  [ "$(yq eval '.spec.lifecycle.expirationDays' infra/crossplane/claims/prod/shared-bucket.yaml)" = "365" ]
}

@test "every env kustomization references shared-bucket.yaml" {
  for env in dev staging prod; do
    grep -q "^  - shared-bucket.yaml$" "infra/crossplane/claims/${env}/kustomization.yaml"
  done
}

@test "parse_claims.sh accepts bucket claims" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}
