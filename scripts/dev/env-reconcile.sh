#!/usr/bin/env bash
set -euo pipefail

# 4-language env grep vs secretspec.toml.
# Day-1: TS + Python only (Go/Rust apps land Phase 4).

mode="--write"
if [ "${1:-}" = "--check" ]; then mode="--check"; fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

out_dir=".secretspec"
mkdir -p "${out_dir}"
report="${out_dir}/reconcile.report.md"

declared=$(awk '/^\[secrets\.[A-Z_][A-Z0-9_]*\]/{
  gsub(/\[secrets\./,"");gsub(/\]/,"");print
}' secretspec.toml | sort -u)

used_ts=$(grep -rhoE 'process\.env\.[A-Z_][A-Z0-9_]*' --include='*.ts' --include='*.tsx' --include='*.js' \
  apps internal packages 2>/dev/null | sed 's/process\.env\.//' | sort -u || true)
used_py=$(grep -rhoE 'os\.(environ\[|getenv\()["'\''][A-Z_][A-Z0-9_]*' --include='*.py' apps internal 2>/dev/null \
  | sed -E 's/.*["'\'']([A-Z_][A-Z0-9_]*)/\1/' | sort -u || true)
used_go=$(grep -rhoE 'os\.(Getenv|LookupEnv)\("[A-Z_][A-Z0-9_]*' --include='*.go' apps 2>/dev/null \
  | sed -E 's/.*"([A-Z_][A-Z0-9_]*)/\1/' | sort -u || true)
used_rs=$(grep -rhoE '(std::env::var|env!)\("[A-Z_][A-Z0-9_]*' --include='*.rs' apps 2>/dev/null \
  | sed -E 's/.*"([A-Z_][A-Z0-9_]*)/\1/' | sort -u || true)
used=$(printf "%s\n%s\n%s\n%s\n" "${used_ts}" "${used_py}" "${used_go}" "${used_rs}" | sort -u | sed '/^$/d')

declared_only=$(comm -23 <(printf "%s\n" "${declared}") <(printf "%s\n" "${used}"))
used_only=$(comm -13 <(printf "%s\n" "${declared}") <(printf "%s\n" "${used}"))

{
  echo "# env reconcile report"
  echo
  echo "## declared+unused"
  printf "%s\n" "${declared_only}" | sed 's/^/- /'
  echo
  echo "## undeclared+used"
  printf "%s\n" "${used_only}" | sed 's/^/- /'
} > "${report}"

if [ "${mode}" = "--check" ]; then
  if [ -n "${used_only}" ] || [ -n "${declared_only}" ]; then
    cat "${report}" >&2
    exit 1
  fi
fi
echo "wrote ${report}"
