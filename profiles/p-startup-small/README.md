# p-startup-small

**Founder label:** Early Startup. **$/mo band:** $30-150. **Tagline:** "2-10 of us, real customers, basic HA."

## Tested parameters

- 3-node bare-VM k3s with Calico + Longhorn
- `secret_backend=akv` (Azure Key Vault, WorkloadIdentity)
- `registry=ghcr`, ArgoCD dev/staging/prod, Kargo full pipeline with smoke+SLO

## When to fork

If you raised a round and need multi-AZ + Linkerd, jump to `p-startup-scale`.
