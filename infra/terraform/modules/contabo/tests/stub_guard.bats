#!/usr/bin/env bats

# NOTE: per the Phase 10 hard rules, the contabo module substitutes a
# `terraform plan`-time provider precondition with a static
# UNDER-DEVELOPMENT sentinel that downstream tooling greps for. A real
# `terraform plan` would try to fetch shaiknoorullah/contabo from the
# registry — which is not yet published — so the third test asserts the
# external-checker script returns published=false.

setup() {
  cd "$(git rev-parse --show-toplevel)/infra/terraform/modules/contabo"
}

@test "contabo main.tf declares the UNDER DEVELOPMENT header" {
  run grep -q "^# UNDER DEVELOPMENT" main.tf
  [ "$status" -eq 0 ]
}

@test "contabo main.tf links the sibling provider repo" {
  run grep -q "github.com/shaiknoorullah/terraform-provider-contabo" main.tf
  [ "$status" -eq 0 ]
}

@test "contabo provider-check script returns published=false until v0.1.0 ships" {
  run bash scripts/check-provider-published.sh
  [ "$status" -eq 0 ]
  [[ "$output" == *'"published":"false"'* ]]
}
