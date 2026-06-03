# Defaults overridden by profiles/<id>/terraform.tfvars at task bootstrap:init.
name_prefix          = "example"
region               = "hel1"
private_network_cidr = "10.50.0.0/24"
node_pools = [
  { role = "control_plane", count = 1, size = "cax21", image = "debian-12", disks = [] },
  { role = "worker", count = 1, size = "cax21", image = "debian-12", disks = [] },
]
firewall_rules        = []
load_balancer         = null
managed_db            = []
tags                  = {}
cloudflare_zone_name  = ""
cloudflare_r2_buckets = []
