#!/usr/bin/env bash
set -euo pipefail

# AKV bootstrap loop — engineer-initiated. Stub Day-1.
# Phase 10 implements pull/push + audit chain.

cat <<'MSG'
bootstrap-secrets: stub.
Day-1 only validates that the team profile is declared in secretspec.toml.
Phase 10 wires the interactive Entra-gated AKV loop.
MSG

if ! grep -q '^\[profiles\.team\]' secretspec.toml; then
  echo "secretspec.toml is missing [profiles.team]; nothing to bootstrap" >&2
  exit 1
fi
echo "team profile present; awaiting Phase 10 implementation"
