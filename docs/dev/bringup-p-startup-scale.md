# Bringup — `p-startup-scale` (Scaling Startup, $300-1500/mo)

Managed K8s (AKS / EKS / GKE), multi-AZ, managed databases.

## 3-command bringup

```bash
npx create-platform@latest --profile p-startup-scale
cd <slug>
task launch
task open
```

## What `task launch` does on `p-startup-scale`

- Provisions the chosen managed K8s via the cloud's Terraform module.
- Compositions swap to `rds-managed` for `XPostgres`, managed Redis for
  `XCache`, native blob for `XBlob`.
- Argo CD with 3 envs (`dev` + `staging` + `prod`). Kargo promotion enabled.
- Linkerd service mesh enabled by default (`mesh: linkerd` in profile).
- Observability: Prometheus + Loki + Tempo + OTel (`observability_depth: +traces`).

## Cost guardrails

Use `task simulate-cost --profile p-startup-scale` before committing the
cluster. The simulator is wired to `data/cloud-prices/` and refuses to
proceed if the projected $/mo exceeds the profile's upper bound.
