module "shared" {
  source      = "../_shared"
  name_prefix = var.name_prefix
  region      = var.region
  env         = var.env
  tags        = var.tags
}

locals {
  cp_pool      = [for p in var.node_pools : p if p.role == "control_plane"][0]
  worker_pool  = [for p in var.node_pools : p if p.role == "worker"][0]
  label_tags   = { for k, v in module.shared.tags : k => v }
  label_string = join(",", [for k, v in local.label_tags : "${k}=${v}"])
}

resource "hcloud_network" "this" {
  name     = "${var.name_prefix}-${var.env}-net"
  ip_range = var.private_network_cidr
  labels   = local.label_tags
}

resource "hcloud_network_subnet" "this" {
  network_id   = hcloud_network.this.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = var.private_network_cidr
}

resource "hcloud_firewall" "this" {
  name   = "${var.name_prefix}-${var.env}-fw"
  labels = local.label_tags

  dynamic "rule" {
    for_each = var.firewall_rules
    content {
      direction  = rule.value.direction
      protocol   = rule.value.protocol
      port       = rule.value.port
      source_ips = rule.value.source_ips
    }
  }
}

resource "hcloud_server" "cp" {
  count        = local.cp_pool.count
  name         = "${var.name_prefix}-${var.env}-cp-${count.index + 1}"
  server_type  = local.cp_pool.size
  image        = local.cp_pool.image
  location     = var.region
  firewall_ids = [hcloud_firewall.this.id]
  labels       = merge(local.label_tags, { role = "control_plane" })

  network {
    network_id = hcloud_network.this.id
  }
}

resource "hcloud_server" "worker" {
  count        = local.worker_pool.count
  name         = "${var.name_prefix}-${var.env}-wk-${count.index + 1}"
  server_type  = local.worker_pool.size
  image        = local.worker_pool.image
  location     = var.region
  firewall_ids = [hcloud_firewall.this.id]
  labels       = merge(local.label_tags, { role = "worker" })

  network {
    network_id = hcloud_network.this.id
  }
}

resource "hcloud_load_balancer" "this" {
  count              = var.load_balancer == null ? 0 : 1
  name               = "${var.name_prefix}-${var.env}-lb"
  load_balancer_type = var.load_balancer.type
  location           = var.region
  algorithm {
    type = var.load_balancer.algorithm
  }
  labels = local.label_tags
}
