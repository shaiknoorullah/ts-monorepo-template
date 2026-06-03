#!/usr/bin/env bash
# tools/ci/nightly-summary.sh
#
# Aggregator job for nightly.yml — walks .ci/evidence/PROFILE/catalog.json
# entries, counts pass vs fail across the matrix, writes summary.json.
# --strict mode exits 1 on any failure (used by the status-page poster job).
# Default mode prints the summary without failing so chaos / observability-only
# failures stay informational per spec section 14.8.

set -euo pipefail

ROOT="$(pwd)"
STRICT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)   ROOT="$2"; shift 2 ;;
    --strict) STRICT=1;  shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

EVIDENCE_DIR="${ROOT}/.ci/evidence"
if [[ ! -d "${EVIDENCE_DIR}" ]]; then
  echo "no evidence directory at ${EVIDENCE_DIR}" >&2
  exit 2
fi

pass=0
fail=0
profiles_pass='[]'
profiles_fail='[]'

while IFS= read -r f; do
  v=$(jq -r '.verdict' "$f")
  p=$(jq -r '.profile' "$f")
  if [[ "$v" == "pass" ]]; then
    pass=$((pass+1))
    profiles_pass=$(jq --arg p "$p" '. + [$p]' <<<"$profiles_pass")
  else
    fail=$((fail+1))
    profiles_fail=$(jq --arg p "$p" '. + [$p]' <<<"$profiles_fail")
  fi
done < <(find "${EVIDENCE_DIR}" -mindepth 2 -maxdepth 2 -name catalog.json)

jq -n \
  --argjson pp "${profiles_pass}" \
  --argjson pf "${profiles_fail}" \
  --argjson pc "${pass}" \
  --argjson fc "${fail}" \
  '{pass_count:$pc, fail_count:$fc, profiles_pass:$pp, profiles_fail:$pf}' \
  > "${EVIDENCE_DIR}/summary.json"

cat "${EVIDENCE_DIR}/summary.json"

if (( STRICT == 1 && fail > 0 )); then
  exit 1
fi
