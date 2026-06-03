# Module-surface test with a mocked hcloud provider so no real API token is
# needed. This validates the module's own logic + output shape; integration
# against real Hetzner happens only in the nightly profile-e2e workflow.

mock_provider "hcloud" {}

variables {
  name_prefix          = "acme"
  region               = "hel1"
  env                  = "dev"
  private_network_cidr = "10.50.0.0/24"
  node_pools = [
    { role = "control_plane", count = 3, size = "cax21", image = "debian-12", disks = [] },
    { role = "worker", count = 3, size = "cax31", image = "debian-12", disks = [{ mount = "/var/lib/longhorn", size_gb = 200 }] },
  ]
  firewall_rules = [
    { direction = "in", protocol = "tcp", port = "22", source_ips = ["0.0.0.0/0"] },
    { direction = "in", protocol = "tcp", port = "6443", source_ips = ["10.50.0.0/24"] },
  ]
  load_balancer = { type = "lb11", algorithm = "round_robin" }
  managed_k8s   = null
  managed_db    = []
  tags          = {}
}

run "validate" {
  # Terraform 1.x test only supports `plan` or `apply` as command.
  command = plan
}

run "outputs_declared" {
  command = plan

  assert {
    condition     = length(keys(output.nodes_schema)) == 5
    error_message = "expected nodes output schema to declare name,public_ip,private_ip,role,disks"
  }
}
