#!/usr/bin/env bats

# Tests for .github/workflows/nightly.yml
#
# Spec section 14.2: per-profile bringup matrix on cron schedule.
# Five profiles declared in strategy.matrix.include with schedule= tag
# (nightly | weekly | manual). Non-nightly rows are guarded out on cron.
# Each row runs the documented eight Taskfile verbs.

setup() {
  WF=".github/workflows/nightly.yml"
}

@test "nightly.yml declares matrix.profile p-solo p-hobby p-startup-small p-startup-scale p-enterprise" {
  for p in p-solo p-hobby p-startup-small p-startup-scale p-enterprise; do
    run yq ".jobs.bringup.strategy.matrix.include[] | select(.profile == \"${p}\")" "${WF}"
    [ "$status" -eq 0 ]
    [ -n "$output" ]
  done
}

@test "nightly.yml schedule is 0 2 * * *" {
  run yq -r '.on.schedule[0].cron' "${WF}"
  [ "$status" -eq 0 ]
  [ "$output" = "0 2 * * *" ]
}

@test "nightly.yml has weekly guard step for non-nightly profiles" {
  # Routed through MATRIX_SCHEDULE env var per CodeQL injection-safe pattern.
  run grep -F 'MATRIX_SCHEDULE' "${WF}"
  [ "$status" -eq 0 ]
  run grep -F 'matrix.schedule' "${WF}"
  [ "$status" -eq 0 ]
}

@test "nightly.yml calls task profile:select profile:validate ci:bringup ci:smoke ci:observability:assert ci:cost:simulate ci:evidence:collect ci:teardown" {
  for verb in "profile:select" "profile:validate" "ci:bringup" "ci:smoke" "ci:observability:assert" "ci:cost:simulate" "ci:evidence:collect" "ci:teardown"; do
    run grep -F "task ${verb}" "${WF}"
    [ "$status" -eq 0 ]
  done
}

@test "nightly.yml uploads evidence with name evidence-PROFILE-RUNID" {
  run grep -F 'name: evidence-${{ matrix.profile }}-${{ github.run_id }}' "${WF}"
  [ "$status" -eq 0 ]
}

@test "nightly.yml runs actionlint clean" {
  run actionlint -no-color "${WF}"
  [ "$status" -eq 0 ]
}
