#!/usr/bin/env bash
# Asserts Go Dockerfile template matches spec Section 5.3 + 5.6 hard rules.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$repo_root/internal/templates/dockerfiles/go.Dockerfile.template"

test -f "$F" || { echo "FAIL: $F missing" >&2; exit 1; }

# Spec Section 5.6 hard rules
head -n1 "$F" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: missing dockerfile syntax pragma on line 1" >&2; exit 1; }

grep -Fq 'ARG GO_VERSION=1.24'                                "$F" || { echo "FAIL: pinned GO_VERSION=1.24 missing" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/static-debian12:nonroot'          "$F" || { echo "FAIL: distroless runtime pin missing" >&2; exit 1; }
grep -Eq 'FROM golang:\$\{GO_VERSION\}-bookworm AS deps'      "$F" || { echo "FAIL: deps stage missing" >&2; exit 1; }
grep -Eq 'FROM deps AS build'                                 "$F" || { echo "FAIL: build stage missing" >&2; exit 1; }
grep -Eq 'FROM \$\{RUNTIME\} AS runtime'                      "$F" || { echo "FAIL: runtime stage missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,target=/go/pkg/mod'              "$F" || { echo "FAIL: go-mod cache mount missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,target=/root/.cache/go-build'    "$F" || { echo "FAIL: go-build cache mount missing" >&2; exit 1; }
grep -Fq 'CGO_ENABLED=0'                                      "$F" || { echo "FAIL: CGO_ENABLED=0 missing" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot'                               "$F" || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }

# Forbidden patterns
if grep -Eq ':latest\b'        "$F"; then echo "FAIL: contains :latest tag"  >&2; exit 1; fi
if grep -Fq 'apt-get'          "$F"; then echo "FAIL: contains apt-get"      >&2; exit 1; fi

echo "OK: go.Dockerfile.template conformant"
