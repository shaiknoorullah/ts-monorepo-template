#!/usr/bin/env bats

# Tests for .github/workflows/chaos-nightly.yml
# Spec section 14.8 — pumba pod-kill + netem partition scenarios on
# persistent k3d cluster.

setup() { WF=".github/workflows/chaos-nightly.yml"; }

@test "file exists" { [ -f "${WF}" ]; }

@test "name is chaos-nightly" {
  run yq -r '.name' "${WF}"
  [ "$output" = "chaos-nightly" ]
}

@test "runs on schedule at 0 5 * * *" {
  run yq -r '.on.schedule[0].cron' "${WF}"
  [ "$output" = "0 5 * * *" ]
}

@test "guarded by CHAOS=1 input or weekly p-startup-scale" {
  run grep -F 'CHAOS:' "${WF}"
  [ "$status" -eq 0 ]
}

@test "invokes pumba pod-kill scenario" {
  run grep -F 'pumba kill' "${WF}"
  [ "$status" -eq 0 ]
}

@test "invokes pumba netem loss partition" {
  run grep -F 'pumba netem' "${WF}"
  [ "$status" -eq 0 ]
}

@test "emits chaos-report.json artifact" {
  run grep -F 'chaos-report.json' "${WF}"
  [ "$status" -eq 0 ]
}

@test "actionlint clean" { actionlint -no-color "${WF}"; }
