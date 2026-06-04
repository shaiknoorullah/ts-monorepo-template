output "tags" {
  value = local.merged_tags
}

output "name_for_examples" {
  value = {
    cp_1 = "${var.name_prefix}-${var.env}-cp-1"
    wk_1 = "${var.name_prefix}-${var.env}-wk-1"
  }
}
