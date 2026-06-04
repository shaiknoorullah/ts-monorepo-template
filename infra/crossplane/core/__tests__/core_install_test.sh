#!/usr/bin/env bash
set -euo pipefail
ROOT="infra/crossplane/core"

# Namespace present
grep -q "name: crossplane-system" "$ROOT/namespace.yaml"

# Helm chart version pinned to 1.17.3 exactly
grep -q "targetRevision: 1.17.3" "$ROOT/helm-application.yaml"
grep -q "chart: crossplane" "$ROOT/helm-application.yaml"
grep -q "repoURL: https://charts.crossplane.io/stable" "$ROOT/helm-application.yaml"

# Required feature flags from spec §8.1
grep -q -- "--enable-environment-configs" "$ROOT/helm-application.yaml"
grep -q -- "--enable-usages" "$ROOT/helm-application.yaml"
grep -q -- "--enable-realtime-compositions=false" "$ROOT/helm-application.yaml"

# Package cache PVC sized at 5Gi
grep -q "sizeLimit: 5Gi" "$ROOT/helm-application.yaml"

# Kustomization references all files
grep -q "namespace.yaml" "$ROOT/kustomization.yaml"
grep -q "helm-application.yaml" "$ROOT/kustomization.yaml"

# kubeconform validates structure (offline schema)
kubeconform -strict -ignore-missing-schemas -summary "$ROOT/namespace.yaml" "$ROOT/helm-application.yaml"
