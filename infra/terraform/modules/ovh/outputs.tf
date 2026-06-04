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
    provider = "ovh"
    region   = var.region
  }
}
