module "shared" {
  source      = "../_shared"
  name_prefix = var.name_prefix
  region      = var.region
  env         = var.env
  tags        = var.tags
}
# Scaffolded — nightly smoke only per spec §9.14.
