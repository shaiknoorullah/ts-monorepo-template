plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

config {
  call_module_type = "all"
  force            = false
}

# Per-provider modules declare the canonical input surface
# (private_network_cidr, node_pools, firewall_rules, ...) ahead of the
# resources that consume them — the stub cloud providers (ovh / azure / aws
# / gcp / cloudflare / proxmox) document the contract first and fill in
# resources as `task terraform:bootstrap-<cloud>` materializes them.
# Treating declarations-without-use as an error blocks the bootstrap PR.
rule "terraform_unused_declarations" {
  enabled = false
}
