#!/usr/bin/env bash
set -euo pipefail

# Constrained commit:
# 1. ensure staged
# 2. run aicommits (if installed) up to 3 times against commitlint
# 3. fall back to opening $EDITOR

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

if git diff --cached --quiet; then
  echo "task-commit: nothing staged"
  exit 1
fi

if command -v aicommits >/dev/null 2>&1; then
  for attempt in 1 2 3; do
    if aicommits --type conventional && git log -1 --pretty=%B | pnpm commitlint; then
      exit 0
    fi
    echo "task-commit: attempt ${attempt} failed commitlint, retrying"
  done
fi

: "${EDITOR:=vi}"
git commit -e
