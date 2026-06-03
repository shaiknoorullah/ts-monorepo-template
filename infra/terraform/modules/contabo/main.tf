# UNDER DEVELOPMENT — terraform-provider-contabo is pre-v0.1.0 and not yet
# published to the Terraform Registry. This module will start working
# automatically once the provider ships its v0.1.0 release.
#
# Track status: https://github.com/shaiknoorullah/terraform-provider-contabo
# Current fallback for p-hobby / p-startup-small: Hetzner Cloud (hcloud).

data "external" "provider_check" {
  program = ["${path.module}/scripts/check-provider-published.sh"]
}

resource "null_resource" "guard" {
  lifecycle {
    precondition {
      condition     = data.external.provider_check.result.published == "true"
      error_message = <<-EOT
        terraform-provider-contabo is not yet published to the Registry.
        Use the p-hobby or p-startup-small profile with the hcloud fallback,
        or wait for v0.1.0. See providers/README.md.
      EOT
    }
  }
}
