#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
mkdir -p "$work/probe/charts" "$work/probe/templates"
cp -r infra/helm/lib-chart "$work/probe/charts/lib-chart"
cat > "$work/probe/Chart.yaml" <<YAML
apiVersion: v2
name: probe
version: 0.1.0
dependencies:
  - name: lib-chart
    version: 0.1.0
YAML
cat > "$work/probe/templates/all.yaml" <<'TPL'
{{- include "lib-chart.workload" . }}
{{- include "lib-chart.service" . }}
{{- include "lib-chart.serviceHeadless" . }}
{{- include "lib-chart.hpa" . }}
{{- include "lib-chart.pdb" . }}
{{- include "lib-chart.serviceAccount" . }}
TPL

# Case A: Deployment + HPA + PDB (replicas 3)
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
workload: { kind: Deployment, replicas: 3 }
service: { enabled: true, port: 8080, name: http }
autoscaling: { enabled: true, minReplicas: 2, maxReplicas: 10, targetCPU: 70 }
pdb: { enabled: true, minAvailable: 1 }
pod: { securityContext: { runAsUser: 1000 } }
serviceAccount: { create: true }
YAML
out=$(helm template probe "$work/probe")
grep -q 'kind: Deployment'                <<<"$out" || { echo "no Deployment"; exit 1; }
grep -q 'kind: HorizontalPodAutoscaler'   <<<"$out" || { echo "no HPA"; exit 1; }
grep -q 'kind: PodDisruptionBudget'       <<<"$out" || { echo "no PDB"; exit 1; }
grep -q 'readOnlyRootFilesystem: true'    <<<"$out" || { echo "FLOOR not applied"; exit 1; }
grep -q 'kind: Service$'                  <<<"$out" || { echo "no Service"; exit 1; }
grep -q 'kind: ServiceAccount'            <<<"$out" || { echo "no SA"; exit 1; }
# Case B: Rollout (no Deployment)
cat > "$work/probe/values.yaml" <<YAML
image: { repository: ghcr.io/org/app, tag: v1 }
workload:
  kind: Rollout
  replicas: 6
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
service: { enabled: true, port: 8080, name: http }
pod: { securityContext: { runAsUser: 1000 } }
YAML
out2=$(helm template probe "$work/probe")
grep -q 'apiVersion: argoproj.io/v1alpha1' <<<"$out2" || { echo "no Rollout apiVersion"; exit 1; }
grep -q 'kind: Rollout'                    <<<"$out2" || { echo "no Rollout kind"; exit 1; }
! grep -q 'kind: Deployment'               <<<"$out2" || { echo "Deployment leaked in Rollout mode"; exit 1; }
echo OK
