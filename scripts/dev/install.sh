#!/usr/bin/env bash
set -euo pipefail

# Bootstrap dev shell.
# 1. ensure direnv allow
# 2. ensure devenv (no-op if not entering shell)
# 3. corepack pnpm install
# 4. uv sync (if Python apps present)
# 5. go mod download (if Go apps present)
# 6. cargo fetch (if Rust apps present)
# 7. pre-commit install via devenv git-hooks

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

if command -v direnv >/dev/null 2>&1; then
  direnv allow . || true
fi

corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

if [ -f pyproject.toml ] && command -v uv >/dev/null 2>&1; then
  uv sync
fi

if find apps -name go.mod -print -quit 2>/dev/null | grep -q .; then
  go mod download || true
fi

if [ -f Cargo.toml ] && command -v cargo >/dev/null 2>&1; then
  cargo fetch
fi

echo "install: complete"
