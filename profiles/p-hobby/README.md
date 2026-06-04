# p-hobby

**Founder label:** Side Project. **$/mo band:** $5-20. **Tagline:** "Maybe 100 users, single VPS, $5-20/mo."

## Tested parameters

- Single Hetzner cx21 VPS, no HA
- `secret_backend=keyring`, `registry=ghcr`, `cdn_edge=cloudflare`
- ArgoCD `dev` + `prod` envs, Kargo dev->prod smoke

## When to fork

If you have 2+ engineers and real customers, jump to `p-startup-small` (adds AKV + 3-node HA).
