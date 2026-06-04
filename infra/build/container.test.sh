#!/usr/bin/env bash
# Asserts infra/build/container.sh exists, is executable, parses apps/<svc>/build.yaml,
# and emits the buildx command in --dry-run mode (no actual build).
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
S="$repo_root/infra/build/container.sh"

test -x "$S" || { echo "FAIL: $S missing or not executable" >&2; exit 1; }

# --dry-run should print a docker buildx command referencing the rendered Dockerfile
out=$("$S" --dry-run go-hello)
echo "$out" | grep -Fq 'docker buildx build' \
  || { echo "FAIL: --dry-run output missing 'docker buildx build'" >&2; exit 1; }
echo "$out" | grep -Fq -- '--platform linux/amd64' \
  || { echo "FAIL: --dry-run output missing --platform linux/amd64" >&2; exit 1; }
echo "$out" | grep -Fq -- '--file apps/go-hello/Dockerfile' \
  || { echo "FAIL: --dry-run output missing --file apps/go-hello/Dockerfile" >&2; exit 1; }
echo "$out" | grep -Fq -- '--cache-from=type=gha,scope=go-hello-amd64' \
  || { echo "FAIL: --dry-run output missing GHA cache-from scope" >&2; exit 1; }
echo "$out" | grep -Fq -- '--cache-to=type=gha,mode=max,scope=go-hello-amd64' \
  || { echo "FAIL: --dry-run output missing GHA cache-to scope" >&2; exit 1; }

# arm64 opt-in check
out_rs=$("$S" --dry-run rs-hello)
echo "$out_rs" | grep -Fq -- '--platform linux/amd64,linux/arm64' \
  || { echo "FAIL: rs-hello must build multi-arch amd64,arm64" >&2; exit 1; }

# Plain-English error mapping (spec Section 5.15)
out_err=$("$S" --map-error 'failed to solve: failed to compute cache key: not found' || true)
echo "$out_err" | grep -Fq 'Lockfile changed since last build. Run `task install` then retry.' \
  || { echo "FAIL: error mapping for stale cache key missing" >&2; exit 1; }

echo "OK: container.sh conformant"
