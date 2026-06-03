#!/usr/bin/env bats

# Tests for tools/ci/nightly-summary.sh

setup() {
  TMPDIR_TEST="$(mktemp -d)"
  mkdir -p "${TMPDIR_TEST}/.ci/evidence/p-solo" \
           "${TMPDIR_TEST}/.ci/evidence/p-hobby" \
           "${TMPDIR_TEST}/.ci/evidence/p-startup-small"
  printf '{"verdict":"pass","profile":"p-solo"}' > "${TMPDIR_TEST}/.ci/evidence/p-solo/catalog.json"
  printf '{"verdict":"pass","profile":"p-hobby"}' > "${TMPDIR_TEST}/.ci/evidence/p-hobby/catalog.json"
  printf '{"verdict":"fail","profile":"p-startup-small"}' > "${TMPDIR_TEST}/.ci/evidence/p-startup-small/catalog.json"
}

teardown() { rm -rf "${TMPDIR_TEST}"; }

@test "summary aggregates verdicts across the matrix and writes summary.json" {
  run bash tools/ci/nightly-summary.sh --root "${TMPDIR_TEST}"
  [ "$status" -eq 0 ]
  [ -f "${TMPDIR_TEST}/.ci/evidence/summary.json" ]
  pass_count=$(jq -r '.pass_count' "${TMPDIR_TEST}/.ci/evidence/summary.json")
  fail_count=$(jq -r '.fail_count' "${TMPDIR_TEST}/.ci/evidence/summary.json")
  [ "${pass_count}" -eq 2 ]
  [ "${fail_count}" -eq 1 ]
}

@test "exits 1 when at least one profile failed and --strict is passed" {
  run bash tools/ci/nightly-summary.sh --root "${TMPDIR_TEST}" --strict
  [ "$status" -eq 1 ]
}
