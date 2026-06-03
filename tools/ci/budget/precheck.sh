#!/usr/bin/env bash
# tools/ci/budget/precheck.sh
#
# Cloud-spend precheck for ephemeral bringup workflows.
# Per-profile daily caps gate every `terraform apply` so a runaway
# nightly cannot rack up unbounded charges.
#
# Real implementation queries Hetzner project usage API; HETZNER_SPEND_STUB_USD
# env override drives the bats test harness.

set -euo pipefail

PROFILE=""
CLOUD=""
CAP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --cloud)   CLOUD="$2";   shift 2 ;;
    --cap)     CAP="$2";     shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "${PROFILE}" || -z "${CLOUD}" ]]; then
  echo "usage: precheck.sh --profile <id> --cloud <cloud> [--cap <usd>]" >&2
  exit 2
fi

# Per-profile default daily caps (USD)
declare -A DEFAULT_CAP=(
  [p-solo]=0
  [p-hobby]=2
  [p-startup-small]=15
  [p-startup-scale]=120
  [p-enterprise]=999999
)
if [[ -z "${CAP}" ]]; then
  CAP="${DEFAULT_CAP[${PROFILE}]:-0}"
fi

current_spend_usd() {
  if [[ -n "${HETZNER_SPEND_STUB_USD:-}" ]]; then
    echo "${HETZNER_SPEND_STUB_USD}"
    return
  fi
  case "${CLOUD}" in
    hetzner)
      curl -fsSL -H "Authorization: Bearer ${HETZNER_TOKEN_CI}" \
        "https://api.hetzner.cloud/v1/projects/usage" | \
        jq -r '.usage.daily_usd // 0'
      ;;
    *)
      echo "0"
      ;;
  esac
}

SPEND=$(current_spend_usd)
echo "profile=${PROFILE} cloud=${CLOUD} spend_usd=${SPEND} cap_usd=${CAP}"

awk -v s="${SPEND}" -v c="${CAP}" 'BEGIN {
  if (s+0 > c+0) {
    printf("OVER CAP: %s > %s\n", s, c);
    exit 1
  } else {
    printf("within cap: %s <= %s\n", s, c);
    exit 0
  }
}'
