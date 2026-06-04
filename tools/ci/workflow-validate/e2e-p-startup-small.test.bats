#!/usr/bin/env bats

# Tests for .github/workflows/e2e-p-startup-small.yml
# Spec section 14.3 p-startup-small row: 3-VPS Hetzner + ansible cluster +
# ArgoCD bootstrap + ApplicationSet render across envs.

setup() { WF=".github/workflows/e2e-p-startup-small.yml"; }

@test "file exists" { [ -f "${WF}" ]; }

@test "name is e2e-p-startup-small" {
  run yq -r '.name' "${WF}"
  [ "$output" = "e2e-p-startup-small" ]
}

@test "provisions 3 nodes via terraform" {
  run grep -F 'apply' "${WF}"
  [ "$status" -eq 0 ]
  run grep -F 'profile=p-startup-small' "${WF}"
  [ "$status" -eq 0 ]
  run grep -E 'node_count.*3' "${WF}"
  [ "$status" -eq 0 ]
}

@test "runs ansible/cluster.yml (k3s + Calico + Longhorn + wg-mesh)" {
  run grep -F 'ansible-playbook ansible/cluster.yml' "${WF}"
  [ "$status" -eq 0 ]
}

@test "renders ApplicationSet for envs dev staging prod" {
  run grep -F 'task ci:appset:render PROFILE=p-startup-small ENVS=dev,staging,prod' "${WF}"
  [ "$status" -eq 0 ]
}

@test "timeout-minutes is 90" {
  run yq -r '.jobs.bringup.timeout-minutes' "${WF}"
  [ "$output" = "90" ]
}

@test "actionlint clean" { actionlint -no-color "${WF}"; }
