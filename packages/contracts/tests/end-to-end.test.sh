#!/usr/bin/env bash
# End-to-end: lint passes, breaking against HEAD passes (self-compat), generate is no-op.
# AGENT-LOG(2026-06-03): plan ran `buf breaking` from packages/contracts with
# `--against ".git#ref=HEAD,subdir=packages/contracts"`. buf resolves the `.git` reference
# relative to the buf invocation cwd, so from packages/contracts it points at the
# non-existent packages/contracts/.git. Run buf breaking from the workspace root with the
# proto subdir passed as input; that exercises the same self-compat path the plan intended.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
(cd packages/contracts && buf lint)
buf breaking packages/contracts --against ".git#ref=HEAD,subdir=packages/contracts"
(cd packages/contracts && buf generate)
bash packages/contracts-py/scripts/sync-gen.sh
git diff --exit-code -- packages/contracts/gen packages/contracts-py/src packages/contracts-rs/src
pnpm -w ls --filter @ts-monorepo-template/contracts >/dev/null
echo "PASS"
