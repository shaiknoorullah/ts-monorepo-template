#!/usr/bin/env bats

# Tests for .github/workflows/nx-cloud-warm.yml
# Spec section 3.4: push-to-main + nightly drift refresh, write-token gated.

setup() { WF=".github/workflows/nx-cloud-warm.yml"; }

@test "file exists" { [ -f "${WF}" ]; }

@test "triggers on push to main" {
  run yq -r '.on.push.branches[0]' "${WF}"
  [ "$output" = "main" ]
}

@test "supports workflow_dispatch" {
  run yq '.on.workflow_dispatch' "${WF}"
  [[ "$output" != "null" ]]
}

@test "schedule cron exists for nightly drift refresh" {
  run yq -r '.on.schedule[0].cron' "${WF}"
  [ -n "$output" ]
  [ "$output" != "null" ]
}

@test "push-trigger run uses HEAD~1 base" {
  run grep -F -- 'nx affected -t build test lint type-check container --base=HEAD~1 --head=HEAD' "${WF}"
  [ "$status" -eq 0 ]
}

@test "nightly drift run uses origin/main~7 base" {
  run grep -F -- '--base=origin/main~7 --head=HEAD' "${WF}"
  [ "$status" -eq 0 ]
}

@test "uses write token only on push event" {
  run grep -F "NX_CLOUD_ACCESS_TOKEN: \${{ secrets.NX_CLOUD_ACCESS_TOKEN_RW }}" "${WF}"
  [ "$status" -eq 0 ]
}

@test "actionlint clean" { actionlint -no-color "${WF}"; }
