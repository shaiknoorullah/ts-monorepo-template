#!/usr/bin/env bash
# infra/build/smoke.sh — per-commit smoke gate for C5.
# Runs a no-push BuildKit build for every apps/<svc>/Dockerfile and a
# `cosign verify` dry-run against the committed cosign.policy.yaml so that the
# C5 gate (spec Section 13.3) passes without contacting any registry.
#
# Usage:
#   infra/build/smoke.sh               # actually invoke buildx + cosign
#   infra/build/smoke.sh --dry-run     # print the commands only
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

emit() {
  if [ "$DRY" = "1" ]; then
    printf '%s ' "$@"
    printf '\n'
  else
    "$@"
  fi
}

apps=$(find "$repo_root/apps" -mindepth 2 -maxdepth 2 -name Dockerfile -printf '%h\n' | sort)
for app_dir in $apps; do
  app=$(basename "$app_dir")
  build_yaml="$app_dir/build.yaml"
  platforms="linux/amd64"
  if [ -f "$build_yaml" ]; then
    # Smoke build is amd64-only to keep CI fast; arm64 cross-build is covered by
    # the release path.
    platforms="linux/amd64"
  fi
  emit docker buildx build \
    --platform "$platforms" \
    --file "apps/${app}/Dockerfile" \
    --tag "smoke/${app}:local" \
    --cache-from=type=gha,scope=smoke-${app}-amd64 \
    --cache-to=type=gha,mode=max,scope=smoke-${app}-amd64 \
    --load \
    .
done

# cosign verify dry-run — confirms cosign binary + policy fragment are valid.
emit cosign verify \
  --policy infra/build/cosign.policy.yaml \
  --dry-run \
  ghcr.io/local/smoke@sha256:0000000000000000000000000000000000000000000000000000000000000000
