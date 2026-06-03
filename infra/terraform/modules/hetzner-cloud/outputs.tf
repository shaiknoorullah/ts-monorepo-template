output "nodes" {
  value = concat(
    [for s in hcloud_server.cp : {
      name       = s.name
      public_ip  = s.ipv4_address
      private_ip = tolist(s.network)[0].ip
      role       = "control_plane"
      disks      = []
    }],
    [for s in hcloud_server.worker : {
      name       = s.name
      public_ip  = s.ipv4_address
      private_ip = tolist(s.network)[0].ip
      role       = "worker"
      disks      = local.worker_pool.disks
    }],
  )
}

output "nodes_schema" {
  value = {
    name       = "string"
    public_ip  = "string"
    private_ip = "string"
    role       = "string"
    disks      = "list(object)"
  }
}

output "kubeconfig" {
  value = null
}

output "lb_endpoint" {
  value = length(hcloud_load_balancer.this) > 0 ? hcloud_load_balancer.this[0].ipv4 : null
}

output "private_network_id" {
  value = hcloud_network.this.id
}

output "state_inputs" {
  value = {
    provider = "hetzner-cloud"
    region   = var.region
  }
}
