module "shared" {
  source      = "../_shared"
  name_prefix = var.name_prefix
  region      = var.region
  env         = var.env
  tags        = var.tags
}

# OVH provider is pinned; concrete resources are scaffolded as nightly-only.
# Day-1 path: MKS managed kubernetes. The `managed_k8s` block, when set,
# selects MKS via ovh_cloud_project_kube. VPS provisioning lives in
# follow-up work — see spec §9.14.
