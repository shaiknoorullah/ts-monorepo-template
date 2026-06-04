#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
test -f .github/workflows/contracts-codegen.yml || { echo "FAIL: workflow missing"; exit 1; }
actionlint .github/workflows/contracts-codegen.yml
grep -q "buf generate" .github/workflows/contracts-codegen.yml
grep -q "git diff --exit-code" .github/workflows/contracts-codegen.yml
yq -e '.on.pull_request' .github/workflows/contracts-codegen.yml >/dev/null
yq -e '.jobs.codegen-drift' .github/workflows/contracts-codegen.yml >/dev/null
echo "PASS"
