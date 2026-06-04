module "shared" {
  source      = "../_shared"
  name_prefix = var.name_prefix
  region      = var.region
  env         = var.env
  tags        = var.tags
}
# Day-1 surface for on-prem PVE. Concrete proxmox_vm_qemu resources are
# parameterised by node_pools; see spec §9.12.
