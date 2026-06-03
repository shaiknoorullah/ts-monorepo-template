#!/usr/bin/env bash
set -euo pipefail

# 1. Render script exists + executable
test -x scripts/ci/crossplane-validate.sh

# 2. Chainsaw fixtures present
for fixt in render-pg-dev render-kafka-prod render-bucket-r2; do
  test -f "infra/crossplane/tests/chainsaw/${fixt}/chainsaw-test.yaml"
  test -f "infra/crossplane/tests/chainsaw/${fixt}/01-claim.yaml"
  test -f "infra/crossplane/tests/chainsaw/${fixt}/01-assert.yaml"
done

# 3. Workflow job xp-validate wired
grep -q "xp-validate:" .github/workflows/pr.yml
grep -q "crossplane beta validate" .github/workflows/pr.yml
grep -q "crossplane render" .github/workflows/pr.yml
grep -q "chainsaw test infra/crossplane/tests/chainsaw" .github/workflows/pr.yml
grep -q "kcl vet" .github/workflows/pr.yml

# 4. Run validate script — must pass against committed manifests
bash scripts/ci/crossplane-validate.sh
