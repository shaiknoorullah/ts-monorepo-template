#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$repo_root/internal/templates/dockerfiles/python.Dockerfile.template"

test -f "$F" || { echo "FAIL: $F missing" >&2; exit 1; }
head -n1 "$F" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: syntax pragma missing" >&2; exit 1; }

grep -Fq 'ARG PY_VERSION=3.13'                                 "$F" || { echo "FAIL: pinned PY_VERSION=3.13 missing" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/python3-debian12:nonroot'          "$F" || { echo "FAIL: distroless python runtime pin missing" >&2; exit 1; }
grep -Fq 'pip install --no-cache-dir uv==0.5.*'                "$F" || { echo "FAIL: uv 0.5.* pin missing" >&2; exit 1; }
grep -Fq -- '--mount=type=cache,target=/root/.cache/uv'        "$F" || { echo "FAIL: uv cache mount missing" >&2; exit 1; }
grep -Fq 'uv sync --frozen --no-dev --no-install-project'      "$F" || { echo "FAIL: uv sync deps step missing" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot'                                "$F" || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }
grep -Fq 'ENTRYPOINT ["python", "-m", "{{pkg}}"]'              "$F" || { echo "FAIL: ENTRYPOINT must call python -m {{pkg}}" >&2; exit 1; }

if grep -Eq ':latest\b' "$F"; then echo "FAIL: :latest tag found" >&2; exit 1; fi

echo "OK: python.Dockerfile.template conformant"
