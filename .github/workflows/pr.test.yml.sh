#!/usr/bin/env bash
set -euo pipefail

WORKFLOW=.github/workflows/pr.yml

if ! grep -qE '^\s*mcp-validate:' "$WORKFLOW"; then
  echo "FAIL: $WORKFLOW missing 'mcp-validate:' job"
  exit 1
fi

if ! grep -qE 'internal/mcp-server' "$WORKFLOW"; then
  echo "FAIL: $WORKFLOW missing 'internal/mcp-server' path filter"
  exit 1
fi

if ! grep -qE 'pnpm --filter @ts-monorepo-template/mcp-server test' "$WORKFLOW"; then
  echo "FAIL: $WORKFLOW missing mcp-server test command"
  exit 1
fi

if command -v actionlint >/dev/null 2>&1; then
  actionlint "$WORKFLOW"
fi

echo "OK"
