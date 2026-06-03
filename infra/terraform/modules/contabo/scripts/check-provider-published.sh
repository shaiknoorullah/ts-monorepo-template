#!/usr/bin/env bash
set -euo pipefail
# Returns {"published":"false"} until terraform-provider-contabo v0.1.0
# is published to the Terraform Registry. The provider_check data source
# uses this to fail-fast with a plain-English error.
echo '{"published":"false"}'
