#!/usr/bin/env bats

# Tests for tools/ci/budget/precheck.sh

setup() {
  export PROFILE_BUDGET_CAP_USD_DAY=2
  export HETZNER_TOKEN_CI="dummy-token-for-test"
}

@test "exits 0 when spend stub reports below cap" {
  export HETZNER_SPEND_STUB_USD=1.10
  run bash tools/ci/budget/precheck.sh --profile p-hobby --cloud hetzner --cap 2
  [ "$status" -eq 0 ]
  [[ "$output" == *"within cap"* ]]
}

@test "exits 1 when spend stub reports above cap" {
  export HETZNER_SPEND_STUB_USD=2.50
  run bash tools/ci/budget/precheck.sh --profile p-hobby --cloud hetzner --cap 2
  [ "$status" -eq 1 ]
  [[ "$output" == *"OVER CAP"* ]]
}

@test "rejects missing --cloud arg" {
  run bash tools/ci/budget/precheck.sh --profile p-hobby
  [ "$status" -eq 2 ]
}
