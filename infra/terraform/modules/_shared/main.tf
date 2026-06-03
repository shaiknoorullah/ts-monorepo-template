locals {
  base_tags = {
    "managed-by"   = "ts-monorepo-template"
    "env"          = var.env
    "name-prefix"  = var.name_prefix
    "region-label" = var.region
  }
  merged_tags = merge(local.base_tags, var.tags)
}
