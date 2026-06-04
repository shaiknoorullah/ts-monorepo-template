#!/usr/bin/env bash
# tools/ci/profile-validate.sh
#
# Wrapper used by the profile-validate GHA workflow. Runs the
# `repo profile:validate <id>` command for one profile (matrix-fanout) or
# loops the 5 named profiles when called without args.
set -euo pipefail

usage() {
  echo "usage: $0 [profile-id]" >&2
  echo "  if no profile-id, iterates all 5 named profiles" >&2
  exit 2
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
fi

PROFILES=(p-solo p-hobby p-startup-small p-startup-scale p-enterprise)

if [[ -n "${1:-}" ]]; then
  PROFILES=("$1")
fi

for p in "${PROFILES[@]}"; do
  echo "==> profile:validate $p"
  pnpm --filter @internal/cli exec tsx src/bin/ts-monorepo.ts profile:validate "$p"
done
