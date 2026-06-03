#!/usr/bin/env bats

# Tests for .github/workflows/e2e-p-solo.yml
# Spec section 14.3 p-solo row: k3d bringup + S-01..S-10 smoke + claim Ready +
# Image Updater + Kargo promotion. Always-teardown.

setup() { WF=".github/workflows/e2e-p-solo.yml"; }

@test "file exists" { [ -f "${WF}" ]; }

@test "name is e2e-p-solo" {
  run yq -r '.name' "${WF}"
  [ "$output" = "e2e-p-solo" ]
}

@test "triggers on pull_request paths profiles/p-solo + relevant infra dirs" {
  for p in 'profiles/p-solo/**' 'infra/helm/**' 'infra/crossplane/**' 'apps/**' '.github/workflows/e2e-p-solo.yml'; do
    run yq ".on.pull_request.paths[] | select(. == \"${p}\")" "${WF}"
    [ "$status" -eq 0 ]
    [ -n "$output" ]
  done
}

@test "installs k3d 5.x" {
  run grep -E 'k3d-io/k3d/.*v5\.' "${WF}"
  [ "$status" -eq 0 ]
}

@test "runs the canonical S-01..S-10 smoke pack via task ci:smoke" {
  run grep -F 'task ci:smoke PROFILE=' "${WF}"
  [ "$status" -eq 0 ]
}

@test "runs task ci:teardown in always block" {
  run grep -B5 'task ci:teardown PROFILE=' "${WF}"
  [ "$status" -eq 0 ]
  [[ "$output" == *'if: always()'* ]]
}

@test "actionlint clean" { actionlint -no-color "${WF}"; }
