#!/usr/bin/env bats

# Tests for .github/labeler.yml + .github/workflows/pr-labeler.yml
# Spec section 13.7: path-based area/* labels drive required-review routing.

@test "labeler.yml defines area labels for every profile and infra dir" {
  for label in area/p-solo area/p-hobby area/p-startup-small area/p-startup-scale area/p-enterprise area/helm area/crossplane area/terraform area/ansible area/argocd area/mcp area/profiles area/cloud-prices; do
    run yq ".[\"${label}\"]" .github/labeler.yml
    [ "$status" -eq 0 ]
    [ "$output" != "null" ]
  done
}

@test "pr-labeler.yml uses actions/labeler at pinned SHA" {
  run grep -E 'actions/labeler@[0-9a-f]{40}' .github/workflows/pr-labeler.yml
  [ "$status" -eq 0 ]
}

@test "actionlint clean" { actionlint -no-color .github/workflows/pr-labeler.yml; }
