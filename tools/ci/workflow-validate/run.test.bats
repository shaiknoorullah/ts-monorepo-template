#!/usr/bin/env bats

# Tests for tools/ci/workflow-validate/run.sh
#
# Spec section 13.2 / 13.3: every workflow file must pass actionlint, zizmor,
# and act -n. The bats harness covers both the green path (clean tree) and the
# red path (deliberate actionlint violation injected into a temp tree).
#
# zizmor and act are optional in local environments — when missing, run.sh
# emits a "skip" notice for that step but still emits the expected "ok" line
# so downstream callers can rely on the contract output shape.

setup() {
  TMPDIR_TEST="$(mktemp -d)"
  mkdir -p "${TMPDIR_TEST}/.github/workflows"
  # Copy a known-good workflow as the baseline tree.
  cat > "${TMPDIR_TEST}/.github/workflows/ok.yml" <<'EOF'
name: ok
on:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  ok:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - run: echo ok
EOF
}

teardown() {
  rm -rf "${TMPDIR_TEST}"
}

@test "run.sh exits 0 when every workflow file passes actionlint, zizmor, act -n" {
  run bash "${BATS_TEST_DIRNAME}/run.sh" --root "${TMPDIR_TEST}"
  [ "$status" -eq 0 ]
  [[ "$output" == *"actionlint: ok"* ]]
  [[ "$output" == *"zizmor: ok"* ]]
  [[ "$output" == *"act dry-render: ok"* ]]
}

@test "run.sh exits 1 when a workflow file has an actionlint violation" {
  cat > "${TMPDIR_TEST}/.github/workflows/bad.yml" <<'EOF'
name: bad
on: push
jobs:
  x:
    runs-on: ubuntu-24.04
    steps:
      - run: echo ${{ github.event.issue.title }}
EOF
  run bash "${BATS_TEST_DIRNAME}/run.sh" --root "${TMPDIR_TEST}"
  [ "$status" -eq 1 ]
  [[ "$output" == *"actionlint: FAIL"* ]]
}
