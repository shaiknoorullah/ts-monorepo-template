#!/usr/bin/env bash
# Parse every YAML claim under infra/crossplane/claims/{dev,staging,prod}
# and validate it against claim-envelope.schema.json.
set -euo pipefail

ROOT="${1:-infra/crossplane/claims}"
SCHEMA="infra/crossplane/claims/schemas/claim-envelope.schema.json"

if ! command -v yq >/dev/null 2>&1; then
  echo "ERROR: yq not installed (need mikefarah/yq v4)" >&2
  exit 2
fi
if ! command -v ajv >/dev/null 2>&1; then
  echo "ERROR: ajv-cli not installed (npm i -g ajv-cli)" >&2
  exit 2
fi

fail=0
for env in dev staging prod; do
  envdir="${ROOT}/${env}"
  [ -d "${envdir}" ] || continue
  while IFS= read -r -d '' f; do
    if ! yq eval '.' "${f}" >/dev/null 2>&1; then
      echo "PARSE FAIL: ${f}" >&2
      fail=1
      continue
    fi
    tmp=$(mktemp --suffix=.json)
    yq eval -o=json '.' "${f}" > "${tmp}"
    if ! ajv validate -s "${SCHEMA}" -d "${tmp}" --strict=false >/dev/null 2>&1; then
      echo "SCHEMA FAIL: ${f}" >&2
      ajv validate -s "${SCHEMA}" -d "${tmp}" --strict=false || true
      fail=1
    fi
    rm -f "${tmp}"
  done < <(find "${envdir}" -maxdepth 1 -name '*.yaml' ! -name 'kustomization.yaml' -print0)
done
exit "${fail}"
