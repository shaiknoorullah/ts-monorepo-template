output "nodes" {
  value = []
}
output "kubeconfig" {
  value = null
}
output "lb_endpoint" {
  value = null
}
output "private_network_id" {
  value = null
}
output "state_inputs" {
  value = {
    provider = "cloudflare"
    region   = var.region
  }
}

output "dns_zone_id" {
  value = length(data.cloudflare_zone.this) > 0 ? data.cloudflare_zone.this[0].id : null
}

output "r2_bucket" {
  value = { for k, b in cloudflare_r2_bucket.buckets : k => b.name }
}
