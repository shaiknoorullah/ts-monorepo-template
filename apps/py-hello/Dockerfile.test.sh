#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
DF="$repo_root/apps/py-hello/Dockerfile"
BY="$repo_root/apps/py-hello/build.yaml"

test -f "$DF" || { echo "FAIL: $DF missing" >&2; exit 1; }
test -f "$BY" || { echo "FAIL: $BY missing" >&2; exit 1; }

if grep -Fq '{{pkg}}' "$DF"; then
  echo "FAIL: rendered Dockerfile must not contain {{pkg}} placeholders" >&2
  exit 1
fi

head -n1 "$DF" | grep -Fq '# syntax=docker/dockerfile:1.10' \
  || { echo "FAIL: missing syntax pragma" >&2; exit 1; }
grep -Fq 'gcr.io/distroless/python3-debian12:nonroot' "$DF" \
  || { echo "FAIL: distroless python3 runtime pin missing" >&2; exit 1; }
grep -Fq 'COPY --from=build /src/src/py_hello /app/py_hello' "$DF" \
  || { echo "FAIL: package copy must target py_hello" >&2; exit 1; }
grep -Fq 'ENTRYPOINT ["python", "-m", "py_hello"]' "$DF" \
  || { echo "FAIL: ENTRYPOINT must run python -m py_hello" >&2; exit 1; }
grep -Fq 'USER nonroot:nonroot' "$DF" \
  || { echo "FAIL: USER nonroot:nonroot missing" >&2; exit 1; }

python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); assert "platforms" in d; assert "linux/amd64" in d["platforms"]' "$BY" \
  || { echo "FAIL: build.yaml malformed" >&2; exit 1; }

echo "OK: apps/py-hello render conformant"
