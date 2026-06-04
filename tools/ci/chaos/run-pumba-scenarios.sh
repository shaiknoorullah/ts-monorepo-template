#!/usr/bin/env bash
# tools/ci/chaos/run-pumba-scenarios.sh
#
# Spec section 14.8 — chaos test pack scaffold:
#   Scenario 1: pumba kill against go-hello pods, assert rollout recovery <240s.
#   Scenario 2: pumba netem 50% loss against py-hello pods for 90s.
#
# Output: chaos-report.json with per-scenario verdict (pass / fail / error).
# This is INFORMATIONAL — does NOT fail the workflow.

set -euo pipefail

REPORT="${1:-/tmp/chaos-report.json}"
TARGET_NS="${TARGET_NS:-default}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
export RUN_ID

mkdir -p "$(dirname "${REPORT}")"

results='[]'

emit() {
  local id="$1" verdict="$2" detail="$3"
  results=$(jq --arg id "$id" --arg v "$verdict" --arg d "$detail" --arg r "$RUN_ID" \
    '. + [{id:$id, verdict:$v, detail:$d, run:$r}]' <<<"$results")
}

# ── Scenario 1: pod kill on go-hello ─────────────────────────────────────────
if pumba kill --random "re2:^go-hello-" --interval 0s; then
  sleep 60
  if kubectl -n "$TARGET_NS" rollout status deploy/go-hello --timeout=240s; then
    emit pod-kill pass "go-hello recovered within 240s"
  else
    emit pod-kill fail "go-hello did not recover within 240s"
  fi
else
  emit pod-kill error "pumba kill exited non-zero"
fi

# ── Scenario 2: network partition (50% packet loss) on py-hello for 90s ──────
if pumba netem --duration 90s loss --percent 50 "re2:^py-hello-"; then
  sleep 30
  emit netem-loss pass "applied 50% loss to py-hello pods for 90s"
else
  emit netem-loss error "pumba netem exited non-zero"
fi

jq -n \
  --argjson r "$results" \
  --arg run_id "$RUN_ID" \
  '{run_id:$run_id, scenarios:$r}' > "$REPORT"
echo "wrote $REPORT"
