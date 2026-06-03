# Bringup — `p-startup-small` (Early Startup, $30-150/mo)

3 VPS (Hetzner Cloud default), k3s HA, Longhorn.

## 3-command bringup

```bash
npx create-platform@latest --profile p-startup-small
cd <slug>
task launch
task open
```

## What `task launch` does on `p-startup-small`

- Provisions 3 VPS via `infra/terraform/modules/hetzner/`.
- Ansible bootstraps k3s in HA mode (embedded etcd, 3 control planes).
- Longhorn for stateful (cnpg-ha, redis-sentinel, minio-distributed).
- Vault on-cluster for secret backend (per profile `META.yaml`).
- Argo CD with 2 envs (`dev` + `prod`) via ApplicationSet matrix.

## When to upgrade to `p-startup-scale`

- Sustained CPU > 60% on the workload nodes.
- Cross-AZ HA required (this profile is single-AZ).
- Funded multi-env (`dev` + `staging` + `prod`) is a hard need.
