#!/usr/bin/env bats

WF=.github/workflows/terraform.yml

@test "workflow file exists" {
  [ -f "$WF" ]
}

@test "workflow runs on pull_request" {
  run grep -E "^[[:space:]]*pull_request:" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow has workflow_dispatch trigger for apply" {
  run grep -E "^[[:space:]]*workflow_dispatch:" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow runs terraform fmt -check" {
  run grep -E "terraform fmt -check|terraform[[:space:]]+fmt[[:space:]]+-check" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow runs terraform validate" {
  run grep "terraform validate" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow runs tflint" {
  run grep -E "tflint( |$)" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow runs tfsec" {
  run grep -E "tfsec" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow runs conftest test against the policy bundle" {
  run grep "conftest test" "$WF"
  [ "$status" -eq 0 ]
}

@test "workflow gates apply on main + workflow_dispatch" {
  run grep -E "if:.*github.event_name == 'workflow_dispatch'" "$WF"
  [ "$status" -eq 0 ]
}

@test "actionlint accepts the workflow" {
  run actionlint "$WF"
  [ "$status" -eq 0 ]
}
