#!/usr/bin/env bats

# Tests for .github/workflows/e2e-p-hobby.yml
# Spec section 14.3 p-hobby row: ephemeral Hetzner project bringup,
# budget precheck, single-node ansible playbook, always-on terraform destroy.

setup() { WF=".github/workflows/e2e-p-hobby.yml"; }

@test "file exists" { [ -f "${WF}" ]; }

@test "name is e2e-p-hobby" {
  run yq -r '.name' "${WF}"
  [ "$output" = "e2e-p-hobby" ]
}

@test "guards on HETZNER_TOKEN_CI presence" {
  run grep -F 'HETZNER_TOKEN_CI' "${WF}"
  [ "$status" -eq 0 ]
}

@test "runs terraform -chdir=bootstrap/terraform/hetzner apply with profile var" {
  run grep -F 'terraform -chdir=bootstrap/terraform/hetzner apply -var profile=p-hobby' "${WF}"
  [ "$status" -eq 0 ]
}

@test "runs ansible-playbook ansible/single-node.yml" {
  run grep -F 'ansible-playbook ansible/single-node.yml' "${WF}"
  [ "$status" -eq 0 ]
}

@test "pre-checks Hetzner spend cap before apply" {
  run grep -F 'task ci:budget:precheck' "${WF}"
  [ "$status" -eq 0 ]
}

@test "teardown always runs and calls terraform destroy" {
  run grep -B5 'terraform -chdir=bootstrap/terraform/hetzner destroy' "${WF}"
  [[ "$output" == *'if: always()'* ]]
}

@test "actionlint clean" { actionlint -no-color "${WF}"; }
