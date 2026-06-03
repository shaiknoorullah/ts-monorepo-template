terraform {
  required_version = ">= 1.9, < 2.0"
}

module "hetzner_cloud" {
  source = "../../modules/hetzner-cloud"

  name_prefix          = var.name_prefix
  region               = var.region
  env                  = "staging"
  private_network_cidr = var.private_network_cidr
  node_pools           = var.node_pools
  firewall_rules       = var.firewall_rules
  load_balancer        = var.load_balancer
  managed_k8s          = var.managed_k8s
  managed_db           = var.managed_db
  tags                 = var.tags
}

module "cloudflare" {
  source = "../../modules/cloudflare"

  name_prefix = var.name_prefix
  region      = "auto"
  env         = "staging"
  tags        = var.tags
  zone_name   = var.cloudflare_zone_name
  r2_buckets  = var.cloudflare_r2_buckets
}
