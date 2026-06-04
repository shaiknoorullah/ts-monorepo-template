# p-startup-scale

**Founder label:** Scaling Startup. **$/mo band:** $300-1500. **Tagline:** "Funded, multi-env, multi-AZ, real SLA."

## Tested parameters

- Managed K8s (AKS default) with 3-AZ node pools
- Linkerd service mesh, `secret_backend=akv`, `registry=acr`
- ArgoCD dev/staging/prod, Kargo Friday-freeze, PagerDuty notifications

## When to fork

If you need multi-region + audit trail, jump to `p-enterprise`.
