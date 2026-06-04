#!/usr/bin/env bats

@test "claim-envelope JSON Schema is valid JSON" {
  jq empty infra/crossplane/claims/schemas/claim-envelope.schema.json
}

@test "parse_claims.sh exits 0 on the empty claim set" {
  bash infra/crossplane/claims/tests/parse_claims.sh
}

@test "parse_claims.sh rejects a malformed claim" {
  tmp=$(mktemp -d)
  trap "rm -rf ${tmp}" EXIT
  cp -r infra/crossplane/claims/dev "${tmp}/dev"
  echo "not: [valid yaml" > "${tmp}/dev/broken.yaml"
  run bash infra/crossplane/claims/tests/parse_claims.sh "${tmp}"
  [ "$status" -ne 0 ]
}
