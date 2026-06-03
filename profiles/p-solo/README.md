# p-solo

**Founder label:** Just Me. **$/mo band:** $0. **Tagline:** "I'm hacking on something this weekend."

## Tested parameters

- 1-node k3d cluster, no HA, no backups
- `secret_backend=keyring` (OS keyring; no ESO in cluster)
- `registry=ghcr` with public images
- ArgoCD `dev` env only

## When to fork

If you want a public URL, fork to `p-hobby`. Run `task profile:fork p-solo p-hobby-noor` to start.
