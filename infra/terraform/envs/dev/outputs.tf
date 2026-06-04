output "nodes" {
  value = module.hetzner_cloud.nodes
}
output "lb_endpoint" {
  value = module.hetzner_cloud.lb_endpoint
}
output "private_network_id" {
  value = module.hetzner_cloud.private_network_id
}
output "dns_zone_id" {
  value = module.cloudflare.dns_zone_id
}
