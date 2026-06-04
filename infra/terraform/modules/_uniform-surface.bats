#!/usr/bin/env bats

REQUIRED_VARS=(name_prefix region env private_network_cidr node_pools firewall_rules load_balancer managed_k8s managed_db tags)
REQUIRED_OUTPUTS=(nodes kubeconfig lb_endpoint private_network_id state_inputs)
MODULES=(hetzner-cloud ovh azure aws gcp cloudflare proxmox)

@test "every module declares the uniform variable set" {
  for m in "${MODULES[@]}"; do
    for v in "${REQUIRED_VARS[@]}"; do
      run grep -q "variable \"$v\"" "infra/terraform/modules/$m/variables.tf"
      [ "$status" -eq 0 ] || { echo "module $m missing variable $v"; return 1; }
    done
  done
}

@test "every module declares the uniform output set" {
  for m in "${MODULES[@]}"; do
    for o in "${REQUIRED_OUTPUTS[@]}"; do
      run grep -q "output \"$o\"" "infra/terraform/modules/$m/outputs.tf"
      [ "$status" -eq 0 ] || { echo "module $m missing output $o"; return 1; }
    done
  done
}

@test "every module pins terraform >= 1.9 and a provider" {
  for m in "${MODULES[@]}"; do
    run grep -q 'required_version *= *">= 1.9' "infra/terraform/modules/$m/versions.tf"
    [ "$status" -eq 0 ] || { echo "module $m missing terraform pin"; return 1; }
    run grep -q "required_providers" "infra/terraform/modules/$m/versions.tf"
    [ "$status" -eq 0 ] || { echo "module $m missing required_providers"; return 1; }
  done
}

@test "cloudflare module exposes r2 + dns sub-outputs" {
  run grep -q 'output "dns_zone_id"' infra/terraform/modules/cloudflare/outputs.tf
  [ "$status" -eq 0 ]
  run grep -q 'output "r2_bucket"' infra/terraform/modules/cloudflare/outputs.tf
  [ "$status" -eq 0 ]
}
