# Bringup — `p-enterprise` (Production at Scale, $2k+/mo)

Multi-region managed K8s, compliance-floor SOC2-ready, full audit trail.

## 3-command bringup

```bash
npx create-platform@latest --profile p-enterprise
cd <slug>
task launch
task open
```

## What `task launch` does on `p-enterprise`

- Provisions 2 regions of managed K8s. Cross-region Crossplane providers.
- Compositions: `rds-multi-az` for `XPostgres`, native multi-region Redis.
- Vault HA + ESO with AKV-or-equivalent primary.
- Argo CD with N envs (per-tenant matrix). Kargo + sync windows.
- cosign signature enforcement at admission (policy controller).

## Day-1 caveat (spec Section 1.10)

Full nightly CI bringup of `p-enterprise` is gated manual (cost cap).
The template renders + plans cleanly; an operator runs `task launch`
with eyes on the bill.

## Compliance posture

- `compliance_floor: SOC2-ready` in profile `META.yaml`.
- Audit log (`.audit/decisions.jsonl`) integrity gated by `task audit:verify` in CI; SHA-256 chain provides tamper-evidence per spec Section 15.10.
- ADRs auto-emitted at every architectural fork; the `docs/adrs/` tree becomes the SOC2 control record for "we made a decision and we know why".
