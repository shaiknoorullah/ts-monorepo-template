#!/usr/bin/env bash
# Asserts apps/go-hello/Dockerfile is the rendered (no {{app}}) form of the Go template
# and that build.yaml declares the platform list per spec Section 5.5.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

DF="$repo_root/apps/go-hello/Dockerfile"
BY="$repo_root/apps/go-hello/build.yaml"

test -f "$DF" || { echo "FAIL: $DF missing" >&2; exit 1; }
test -f "$BY" || { echo "FAIL: $BY missing" >&2; exit 1; }

if grep -Fq '{{app}}' "$DF"; then
  echo "FAIL: rendered Dockerfile must not contain {{app}} placeholders" >&2
  exit 1
fi

head -n1 "$DF" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: rendered Dockerfile missing syntax pragma" >&2; exit 1; }
grep -Fq 'go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/server' "$DF" \
  || { echo "FAIL: rendered build command must target ./cmd/server" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/static-debian12:nonroot' "$DF" \
  || { echo "FAIL: distroless static runtime pin missing" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot' "$DF" \
  || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }

python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); assert "platforms" in d, "no platforms key"; assert "linux/amd64" in d["platforms"], "amd64 missing"' "$BY" \
  || { echo "FAIL: build.yaml must list platforms including linux/amd64" >&2; exit 1; }

echo "OK: apps/go-hello render conformant"
