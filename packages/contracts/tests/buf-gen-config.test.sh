#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f buf.gen.yaml || { echo "FAIL: buf.gen.yaml missing"; exit 1; }
grep -q "remote: buf.build/protocolbuffers/go" buf.gen.yaml
grep -q "remote: buf.build/grpc/go" buf.gen.yaml
grep -q "remote: buf.build/protocolbuffers/python" buf.gen.yaml
grep -q "remote: buf.build/community/neoeinstein-prost" buf.gen.yaml
grep -q "remote: buf.build/community/neoeinstein-tonic" buf.gen.yaml
grep -q "remote: buf.build/bufbuild/es" buf.gen.yaml
grep -q "^version: v2$" buf.gen.yaml
echo "PASS"
