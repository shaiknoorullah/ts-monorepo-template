#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$repo_root/internal/templates/dockerfiles/typescript.Dockerfile.template"

test -f "$F" || { echo "FAIL: $F missing" >&2; exit 1; }
head -n1 "$F" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: syntax pragma missing" >&2; exit 1; }

grep -Fq 'ARG NODE_VERSION=22'                                 "$F" || { echo "FAIL: pinned NODE_VERSION=22 missing" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/nodejs22-debian12:nonroot'         "$F" || { echo "FAIL: distroless nodejs22 runtime pin missing" >&2; exit 1; }
grep -Fq 'corepack prepare pnpm@9.15.0 --activate'             "$F" || { echo "FAIL: pnpm 9.15.0 pin missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,id=pnpm,target=/pnpm/store'    "$F" || { echo "FAIL: pnpm content-addressed cache mount missing" >&2; exit 1; }
grep -Fq 'pnpm install --frozen-lockfile'                      "$F" || { echo "FAIL: frozen-lockfile install missing" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot'                                "$F" || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }
grep -Fq 'ENTRYPOINT ["node", "dist/main.js"]'                 "$F" || { echo "FAIL: node ENTRYPOINT missing" >&2; exit 1; }

if grep -Eq ':latest\b' "$F"; then echo "FAIL: :latest tag found" >&2; exit 1; fi

echo "OK: typescript.Dockerfile.template conformant"
