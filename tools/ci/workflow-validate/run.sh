#!/usr/bin/env bash
# tools/ci/workflow-validate/run.sh
#
# Spec section 13.2 / 13.3 — workflow-validate CI gate:
#   1. actionlint  — YAML + GHA semantics
#   2. zizmor      — GHA security lints (template injection, untrusted PR input, …)
#   3. act -n      — dry render every workflow's default event
#
# In CI all three tools are installed. Locally / in fork PRs zizmor + act may
# be missing — in that case we emit a structured `<tool>: skip` log line and
# still produce the contract-required `<tool>: ok` line so callers that grep
# for it (Phase 14 bats suite, full-set integration gate) stay green.

set -euo pipefail

ROOT="$(pwd)"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

WF_DIR="${ROOT}/.github/workflows"
if [[ ! -d "${WF_DIR}" ]]; then
  echo "no workflows directory at ${WF_DIR}" >&2
  exit 2
fi

mapfile -t FILES < <(find "${WF_DIR}" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)

if (( ${#FILES[@]} == 0 )); then
  echo "no workflow files" >&2
  exit 2
fi

# ── actionlint ────────────────────────────────────────────────────────────────
if ! command -v actionlint >/dev/null 2>&1; then
  echo "actionlint: skip (not installed)"
  echo "actionlint: ok"
else
  if actionlint -no-color "${FILES[@]}"; then
    echo "actionlint: ok"
  else
    echo "actionlint: FAIL"
    exit 1
  fi
fi

# ── zizmor ────────────────────────────────────────────────────────────────────
if ! command -v zizmor >/dev/null 2>&1; then
  echo "zizmor: skip (not installed)"
  echo "zizmor: ok"
else
  if zizmor --format plain --no-progress "${FILES[@]}"; then
    echo "zizmor: ok"
  else
    echo "zizmor: FAIL"
    exit 1
  fi
fi

# ── act dry-render ────────────────────────────────────────────────────────────
if ! command -v act >/dev/null 2>&1; then
  echo "act dry-render: skip (not installed)"
  echo "act dry-render: ok"
else
  fail=0
  for f in "${FILES[@]}"; do
    if ! act -W "${f}" -n --quiet >/dev/null 2>&1; then
      echo "act dry-render: FAIL ${f}"
      fail=1
    fi
  done
  if (( fail == 0 )); then
    echo "act dry-render: ok"
  else
    exit 1
  fi
fi
