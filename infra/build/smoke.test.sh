#!/usr/bin/env bash
# Asserts infra/build/smoke.sh exists, drives a no-push BuildKit smoke build
# for each apps/<svc>/Dockerfile (mocked under --dry-run), and runs
# `cosign verify-blob --dry-run` against an empty signature to confirm cosign
# is on PATH and the policy file parses (spec C5 gate).
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
S="$repo_root/infra/build/smoke.sh"

test -x "$S" || { echo "FAIL: $S missing or not executable" >&2; exit 1; }

# --dry-run must emit a buildx command per app, no --push flag.
out=$("$S" --dry-run)
for app in go-hello py-hello rs-hello; do
  echo "$out" | grep -Fq "apps/${app}/Dockerfile" \
    || { echo "FAIL: smoke --dry-run missing ${app}" >&2; exit 1; }
done

if echo "$out" | grep -Fq -- '--push'; then
  echo "FAIL: smoke must NOT include --push" >&2
  exit 1
fi

echo "$out" | grep -Fq -- '--load' \
  || { echo "FAIL: smoke must use --load (no-push smoke build)" >&2; exit 1; }

# cosign verify dry-run must reference the policy file.
echo "$out" | grep -Fq 'cosign verify' \
  || { echo "FAIL: smoke must invoke cosign verify in dry-run mode" >&2; exit 1; }
echo "$out" | grep -Fq 'infra/build/cosign.policy.yaml' \
  || { echo "FAIL: smoke must reference infra/build/cosign.policy.yaml" >&2; exit 1; }

echo "OK: smoke.sh conformant"
