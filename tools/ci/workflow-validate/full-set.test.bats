#!/usr/bin/env bats

# Integration gate — asserts every workflow file introduced in commit C14
# exists and passes the actionlint + zizmor + act -n trio as a set.
# Catches silent regressions where a future commit deletes or renames a
# workflow without updating the gate. Spec section 13.3.

@test "all C14 workflow files lint/zizmor/act-dry-render clean as a set" {
  required=(
    .github/workflows/workflow-validate.yml
    .github/workflows/nightly.yml
    .github/workflows/e2e-p-solo.yml
    .github/workflows/e2e-p-hobby.yml
    .github/workflows/e2e-p-startup-small.yml
    .github/workflows/nx-cloud-warm.yml
    .github/workflows/chaos-nightly.yml
    .github/workflows/refresh-cloud-prices.yml
    .github/workflows/pr-labeler.yml
  )
  for f in "${required[@]}"; do
    [ -f "$f" ] || { echo "missing $f"; return 1; }
  done

  run bash tools/ci/workflow-validate/run.sh
  [ "$status" -eq 0 ]
  [[ "$output" == *"actionlint: ok"* ]]
  [[ "$output" == *"zizmor: ok"* ]]
  [[ "$output" == *"act dry-render: ok"* ]]
}
