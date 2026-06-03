#!/usr/bin/env bash
# AGENT-LOG(2026-06-03): plan called for buf.work.yaml + buf.yaml v2. In buf >=1.50 (we
# run 1.70 per repo toolchain pin) the v2 workspace declaration lives entirely inside
# buf.yaml's `modules:` array. The legacy v1 buf.work.yaml schema ("directories: [.]")
# is rejected at parse time, and writing a v2 buf.work.yaml also fails ("v2 is not
# supported for buf.work.yaml files"). Test relaxed to just exercise buf.yaml v2.
set -euo pipefail
cd "$(dirname "$0")/.."
test -f buf.yaml || { echo "FAIL: buf.yaml missing"; exit 1; }
grep -q "^version: v2$" buf.yaml || { echo "FAIL: buf.yaml not v2"; exit 1; }
grep -q "name: buf.build/ts-monorepo-template/contracts" buf.yaml || { echo "FAIL: module name missing"; exit 1; }
buf config ls-modules >/dev/null || { echo "FAIL: buf cannot parse config"; exit 1; }
echo "PASS"
