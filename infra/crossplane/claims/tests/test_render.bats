#!/usr/bin/env bats

setup() {
  command -v crossplane >/dev/null 2>&1 || skip "crossplane CLI not installed"
}

@test "render_all.sh is executable" {
  [ -x infra/crossplane/claims/tests/render_all.sh ]
}

@test "render_all.sh renders every claim in every env without error" {
  bash infra/crossplane/claims/tests/render_all.sh
}

@test "render output for dev/go-hello-pg.yaml contains a CNPG Cluster MR" {
  out=$(bash infra/crossplane/claims/tests/render_all.sh --print dev/go-hello-pg.yaml)
  echo "${out}" | grep -q 'kind: Cluster'
  echo "${out}" | grep -q 'postgresql.cnpg.io'
}
