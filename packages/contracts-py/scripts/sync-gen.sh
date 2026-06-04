#!/usr/bin/env bash
# Copies buf-generated Python sources into the wheel's package tree.
# Run via: task contracts:gen (Phase 2) — this script is the post-step.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$ROOT/packages/contracts/gen/py"
DST="$ROOT/packages/contracts-py/src/contracts"
test -d "$SRC" || { echo "buf has not generated Python output yet"; exit 1; }
rsync -a --delete --include='*/' --include='*_pb2.py' --include='*_pb2_grpc.py' --exclude='*' \
  "$SRC/user/" "$DST/user/"
rsync -a --delete --include='*/' --include='*_pb2.py' --include='*_pb2_grpc.py' --exclude='*' \
  "$SRC/health/" "$DST/health/"
find "$DST/user" "$DST/health" -type d -exec touch '{}/__init__.py' \;
