#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$repo_root/internal/templates/dockerfiles/rust.Dockerfile.template"

test -f "$F" || { echo "FAIL: $F missing" >&2; exit 1; }
head -n1 "$F" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: syntax pragma missing" >&2; exit 1; }

grep -Fq 'ARG RUST_VERSION=1.83'                          "$F" || { echo "FAIL: pinned RUST_VERSION=1.83 missing" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/cc-debian12:nonroot'          "$F" || { echo "FAIL: distroless cc runtime pin missing" >&2; exit 1; }
grep -Fq 'cargo install cargo-chef --locked --version 0.1.*' "$F" || { echo "FAIL: cargo-chef 0.1.* pin missing" >&2; exit 1; }
grep -Eq 'FROM chef AS planner'                           "$F" || { echo "FAIL: planner stage missing" >&2; exit 1; }
grep -Eq 'FROM chef AS deps'                              "$F" || { echo "FAIL: deps stage missing" >&2; exit 1; }
grep -Fq 'cargo chef prepare --recipe-path recipe.json'   "$F" || { echo "FAIL: chef prepare missing" >&2; exit 1; }
grep -Fq 'cargo chef cook --release --recipe-path recipe.json' "$F" || { echo "FAIL: chef cook missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,target=/usr/local/cargo/registry' "$F" || { echo "FAIL: cargo registry cache missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,target=/src/target'       "$F" || { echo "FAIL: target dir cache missing" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot'                           "$F" || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }

if grep -Eq ':latest\b' "$F"; then echo "FAIL: :latest tag found" >&2; exit 1; fi

echo "OK: rust.Dockerfile.template conformant"
