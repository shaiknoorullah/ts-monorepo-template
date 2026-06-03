# Bringup — `p-hobby` (Side Project, $5-20/mo)

Single VPS (Contabo default), k3s, no Longhorn.

## 3-command bringup

```bash
npx create-platform@latest --profile p-hobby
cd <slug>
task launch
task open
```

## What `task launch` does on `p-hobby`

- Provisions one VPS via `infra/terraform/modules/contabo/`.
- Runs the Kubespray-style Ansible playbook → k3s single-node.
- Installs Crossplane + ESO + Argo CD + lib-chart.
- Argo CD root app reconciles the 3 reference apps + cnpg-single XRD claim.
- Caddy ingress with Cloudflare DNS-01 TLS (if a domain was selected at
  `npx create-platform` time).

## Cost guardrails

Composition pin `cnpg-single` (not `cnpg-ha`). Redis without Sentinel.
MinIO single-node. Cost simulator (`task simulate-cost`) confirms the
$5-20/mo band before `task launch` proceeds.
