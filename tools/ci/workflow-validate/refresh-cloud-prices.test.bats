#!/usr/bin/env bats

# Tests for .github/workflows/refresh-cloud-prices.yml
# Spec section 14.8: Renovate-style weekly refresh of cloud price data.

setup() { WF=".github/workflows/refresh-cloud-prices.yml"; }

@test "file exists" { [ -f "${WF}" ]; }
@test "name is refresh-cloud-prices" {
  run yq -r '.name' "${WF}"
  [ "$output" = "refresh-cloud-prices" ]
}
@test "weekly schedule at 0 6 * * 1 (Monday 06:00 UTC)" {
  run yq -r '.on.schedule[0].cron' "${WF}"
  [ "$output" = "0 6 * * 1" ]
}
@test "opens a PR via peter-evans/create-pull-request" {
  run grep -F 'peter-evans/create-pull-request@' "${WF}"
  [ "$status" -eq 0 ]
}
@test "refreshes data/cloud-prices/{hetzner,contabo,ovh,azure,aws,gcp,cloudflare,gha}.yaml" {
  for cloud in hetzner contabo ovh azure aws gcp cloudflare gha; do
    run grep -F "data/cloud-prices/${cloud}.yaml" "${WF}"
    [ "$status" -eq 0 ]
  done
}
@test "actionlint clean" { actionlint -no-color "${WF}"; }
