#!/usr/bin/env bash
set -euo pipefail
file="internal/helm/tools.versions"
test -f "$file" || { echo "missing $file"; exit 1; }
grep -qx 'helm=3.16.3' "$file"        || { echo "helm pin missing"; exit 1; }
grep -qx 'kubeconform=0.6.7' "$file"  || { echo "kubeconform pin missing"; exit 1; }
grep -qx 'kube-linter=0.7.2' "$file"  || { echo "kube-linter pin missing"; exit 1; }
grep -qx 'polaris=9.6.0' "$file"      || { echo "polaris pin missing"; exit 1; }
grep -qx 'yamllint=1.35.1' "$file"    || { echo "yamllint pin missing"; exit 1; }
echo OK
