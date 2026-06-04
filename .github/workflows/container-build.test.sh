#!/usr/bin/env bash
# Asserts container-build.yml exists, is valid YAML, declares the OIDC + packages
# permissions, pins third-party actions to 40-char SHAs (spec Section 5.14),
# runs the apps/* matrix, and wires Hadolint + Trivy + syft + cosign + GHCR push
# with the tags from spec Section 5.9.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
W="$repo_root/.github/workflows/container-build.yml"

test -f "$W" || { echo "FAIL: $W missing" >&2; exit 1; }

# YAML parses
python3 -c 'import sys,yaml; yaml.safe_load(open(sys.argv[1]))' "$W" \
  || { echo "FAIL: workflow YAML failed to parse" >&2; exit 1; }

# Permissions — OIDC for cosign + packages for GHCR
grep -Fq 'id-token: write' "$W" || { echo "FAIL: missing id-token: write (cosign OIDC)" >&2; exit 1; }
grep -Fq 'packages: write' "$W" || { echo "FAIL: missing packages: write (GHCR push)" >&2; exit 1; }
grep -Fq 'security-events: write' "$W" || { echo "FAIL: missing security-events: write (SARIF upload)" >&2; exit 1; }
grep -Fq 'contents: read' "$W" || { echo "FAIL: missing contents: read default" >&2; exit 1; }

# Matrix over apps/*
grep -Fq 'fromJSON(needs.detect.outputs.apps)' "$W" \
  || { echo "FAIL: matrix must consume detect job apps output" >&2; exit 1; }

# Third-party actions must be pinned to 40-char SHAs (spec Section 5.14)
if grep -E 'uses: [^@]+@(v[0-9]+|main|master)$' "$W"; then
  echo "FAIL: third-party action found pinned to a tag/branch instead of 40-char SHA" >&2
  exit 1
fi

# Required tools
grep -Fq 'hadolint'         "$W" || { echo "FAIL: hadolint step missing" >&2; exit 1; }
grep -Fq 'aquasecurity/trivy-action' "$W" || { echo "FAIL: trivy-action missing" >&2; exit 1; }
grep -Fq 'github/codeql-action/upload-sarif' "$W" || { echo "FAIL: SARIF upload missing" >&2; exit 1; }
grep -Fq 'anchore/sbom-action' "$W" || { echo "FAIL: syft (sbom-action) missing" >&2; exit 1; }
grep -Fq 'sigstore/cosign-installer' "$W" || { echo "FAIL: cosign-installer missing" >&2; exit 1; }
grep -Fq 'cosign sign --yes' "$W" || { echo "FAIL: cosign sign step missing" >&2; exit 1; }
grep -Fq 'rekor.sigstore.dev' "$W" || { echo "FAIL: Rekor URL missing" >&2; exit 1; }

# Tagging strategy
grep -Fq 'sha-${{ github.sha }}' "$W" || { echo "FAIL: sha-<full> tag missing" >&2; exit 1; }
grep -Fq 'docker/metadata-action' "$W" || { echo "FAIL: docker/metadata-action missing" >&2; exit 1; }

# arm64 opt-in resolution via build.yaml
grep -Fq 'apps/${{ matrix.app }}/build.yaml' "$W" \
  || { echo "FAIL: workflow must read per-app build.yaml for platforms" >&2; exit 1; }

# actionlint (if installed) must pass
if command -v actionlint >/dev/null 2>&1; then
  actionlint "$W" || { echo "FAIL: actionlint reported issues" >&2; exit 1; }
fi

echo "OK: container-build.yml conformant"
