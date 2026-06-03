#!/usr/bin/env bash
# Asserts the three shared Dockerfile snippets exist and contain the spec-mandated directives.
set -euo pipefail

D="$(cd "$(dirname "$0")" && pwd)"

fail=0
check() {
  local file="$1" pattern="$2"
  if ! grep -Fq "$pattern" "$D/$file"; then
    echo "FAIL: $file missing required directive: $pattern" >&2
    fail=1
  fi
}

check distroless-user.snippet 'USER nonroot:nonroot'
check distroless-user.snippet 'WORKDIR /app'
check healthcheck.snippet     'HEALTHCHECK'
check otel-init.snippet       'OTEL_EXPORTER_OTLP_ENDPOINT'
check otel-init.snippet       'OTEL_SERVICE_NAME'

if [ "$fail" -ne 0 ]; then
  echo "FAIL: shared snippet contract violated" >&2
  exit 1
fi
echo "OK: shared snippets present and conformant"
