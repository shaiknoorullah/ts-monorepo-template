#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
test -x scripts/helm-validate.sh || { echo "driver script missing or not exec"; exit 1; }
# Must run without arguments and produce per-(app,env) lines
out=$(bash scripts/helm-validate.sh 2>&1)
echo "$out"
for app in go-hello py-hello rs-hello; do
  for env in dev staging prod; do
    grep -q "OK  ${app}  ${env}" <<<"$out" || { echo "missing OK for $app $env"; exit 1; }
  done
done
echo TEST-OK
