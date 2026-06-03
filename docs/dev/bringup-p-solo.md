# Bringup — `p-solo` (Just Me, $0)

Local k3d, no cloud. For weekend hacking.

## 3-command bringup

```bash
npx create-platform@latest --profile p-solo
cd <slug>
task launch
task open
```

## What `task launch` does on `p-solo`

- Boots a local k3d cluster (1 server, 0 agents).
- Installs `lib-chart` deps + Crossplane core (no providers).
- Renders the 3 reference apps (go-hello, py-hello, rs-hello) into the
  local registry via `k3d image import`.
- Skips Argo CD; reconciliation is via `task sync:local`.

## What you do NOT get on `p-solo`

- No HA, no observability stack (metrics-only), no cloud secrets — uses
  OS keyring only.
- No public ingress; access via `task port-forward`.

## Common follow-ups

- Migrate to `p-hobby` when you outgrow local: `task profile:fork p-solo p-hobby` and then `task profile:select p-hobby`.
