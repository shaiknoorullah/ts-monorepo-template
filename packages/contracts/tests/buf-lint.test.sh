#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
buf lint
test -f src/proto/health/v1/health.proto
grep -q "service HealthCheck" src/proto/health/v1/health.proto
echo "PASS"
