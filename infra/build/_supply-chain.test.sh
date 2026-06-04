#!/usr/bin/env bash
# Asserts supply-chain config files are present, are valid JSON/YAML, and pin the
# rules called out in spec Section 5.6 (Hadolint), 5.12 (Trivy), 5.8 (cosign).
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

require_file() { test -f "$1" || { echo "FAIL: missing $1" >&2; exit 1; }; }

require_file internal/templates/dockerfiles/_hadolint.yaml
require_file internal/templates/dockerfiles/_trivy-dockerfile.yaml
require_file infra/build/trivy-image.yaml
require_file infra/build/cosign.policy.yaml
require_file infra/build/sbom.cdx.json
require_file infra/build/cache-policy.json

# JSON files parse
jq -e . infra/build/sbom.cdx.json   > /dev/null || { echo "FAIL: sbom.cdx.json not valid JSON" >&2; exit 1; }
jq -e . infra/build/cache-policy.json > /dev/null || { echo "FAIL: cache-policy.json not valid JSON" >&2; exit 1; }

# YAML files parse
python3 -c 'import sys,yaml; [yaml.safe_load(open(p)) for p in sys.argv[1:]]' \
  internal/templates/dockerfiles/_hadolint.yaml \
  internal/templates/dockerfiles/_trivy-dockerfile.yaml \
  infra/build/trivy-image.yaml \
  infra/build/cosign.policy.yaml \
  || { echo "FAIL: a YAML file failed to parse" >&2; exit 1; }

# Hadolint rules called out in spec Section 5.6
for rule in DL3007 DL3008 DL3059 DL4006 DL3002; do
  grep -Fq "$rule" internal/templates/dockerfiles/_hadolint.yaml \
    || { echo "FAIL: _hadolint.yaml must reference rule $rule" >&2; exit 1; }
done

# Trivy must fail on CRITICAL unfixed (image) and HIGH config (Dockerfile)
grep -Fq 'severity: CRITICAL' infra/build/trivy-image.yaml \
  || { echo "FAIL: trivy-image.yaml must gate on CRITICAL severity" >&2; exit 1; }
grep -Fq 'severity: HIGH' internal/templates/dockerfiles/_trivy-dockerfile.yaml \
  || { echo "FAIL: _trivy-dockerfile.yaml must gate on HIGH severity" >&2; exit 1; }

# Cosign policy must declare the GH OIDC issuer (spec Section 5.8)
grep -Fq 'token.actions.githubusercontent.com' infra/build/cosign.policy.yaml \
  || { echo "FAIL: cosign.policy.yaml must pin GH OIDC issuer" >&2; exit 1; }
grep -Fq 'rekor.sigstore.dev' infra/build/cosign.policy.yaml \
  || { echo "FAIL: cosign.policy.yaml must pin Rekor URL" >&2; exit 1; }

echo "OK: supply-chain config present and conformant"
