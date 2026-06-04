#!/usr/bin/env bats

# NOTE: env stacks are validated structurally (grep for module composition)
# and the backend template is checked for envsubst rendering. Full
# `terraform init -backend=false && terraform validate` requires provider
# plugin downloads — exercised by the dedicated tf-validate CI workflow
# (where the runner has internet); not run in this offline bats sweep.

ENVS=(dev staging prod)

@test "every env stack declares the same module composition" {
  for e in "${ENVS[@]}"; do
    run grep -q 'module "hetzner_cloud"' "infra/terraform/envs/$e/main.tf"
    [ "$status" -eq 0 ] || { echo "env $e missing hetzner_cloud module"; return 1; }
    run grep -q 'module "cloudflare"' "infra/terraform/envs/$e/main.tf"
    [ "$status" -eq 0 ] || { echo "env $e missing cloudflare module"; return 1; }
  done
}

@test "every env stack declares the env literal correctly" {
  for e in "${ENVS[@]}"; do
    run grep -qE "env[[:space:]]*=[[:space:]]*\"$e\"" "infra/terraform/envs/$e/main.tf"
    [ "$status" -eq 0 ] || { echo "env $e main.tf does not pin env=\"$e\""; return 1; }
  done
}

@test "backend template renders without literal placeholders for azurerm" {
  run bash -c 'TF_BACKEND_TYPE=azurerm TF_BACKEND_RG=rg TF_BACKEND_SA=sa TF_BACKEND_CONTAINER=c TF_BACKEND_KEY=k envsubst < infra/terraform/envs/_backend.tf.tmpl'
  [ "$status" -eq 0 ]
  [[ "$output" != *'${'* ]]
}
