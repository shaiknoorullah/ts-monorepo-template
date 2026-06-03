#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
DF="$repo_root/apps/rs-hello/Dockerfile"
BY="$repo_root/apps/rs-hello/build.yaml"

test -f "$DF" || { echo "FAIL: $DF missing" >&2; exit 1; }
test -f "$BY" || { echo "FAIL: $BY missing" >&2; exit 1; }

if grep -Fq '{{app}}' "$DF"; then
  echo "FAIL: rendered Dockerfile must not contain {{app}} placeholders" >&2
  exit 1
fi

head -n1 "$DF" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: missing syntax pragma" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/cc-debian12:nonroot' "$DF" \
  || { echo "FAIL: distroless cc runtime pin missing" >&2; exit 1; }
grep -Fq 'cargo build --release --bin rs-hello' "$DF" \
  || { echo "FAIL: cargo build must target --bin rs-hello" >&2; exit 1; }
grep -Fq 'cp /src/target/release/rs-hello /out/app' "$DF" \
  || { echo "FAIL: rendered binary copy must reference rs-hello" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot' "$DF" \
  || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }

python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); assert "platforms" in d; assert "linux/amd64" in d["platforms"]' "$BY" \
  || { echo "FAIL: build.yaml malformed" >&2; exit 1; }

echo "OK: apps/rs-hello render conformant"
