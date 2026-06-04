module "shared" {
  source      = "../_shared"
  name_prefix = var.name_prefix
  region      = var.region
  env         = var.env
  tags        = var.tags
}

data "cloudflare_zone" "this" {
  count = var.zone_name == "" ? 0 : 1
  name  = var.zone_name
}

resource "cloudflare_r2_bucket" "buckets" {
  for_each   = toset(var.r2_buckets)
  account_id = var.name_prefix
  name       = each.key
  location   = upper(var.region)
}
