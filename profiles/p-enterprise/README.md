# p-enterprise

**Founder label:** Production at Scale. **$/mo band:** $2k+. **Tagline:** "Multi-region, compliance, audit trail."

## Tested parameters

- Managed K8s (2-region) + Istio multi-cluster gateway
- Vault HA `secret_backend=vault`, Harbor self-host `registry=harbor`
- ArgoCD dev/staging/prod/dr, cosign keyless admission, Splunk audit forwarder

## When to fork

This is the top profile. Fork to a custom profile (`task profile:fork p-enterprise p-acme-fedramp`) for compliance overlays.
