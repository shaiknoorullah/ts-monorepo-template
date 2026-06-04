---
title: p-solo — Just Me
---

```yaml
# DEVENV_PROFILE=p-solo
schemaVersion: profile-v1
machineId: p-solo
founderLabel: Just Me
costBandUsdMonthly:
  min: 0
  max: 0
axes:
  team_size: solo
  env_count: 1
  target_budget_usd: '<20'
  compliance_floor: none
  workload_shape: mixed
  ha_level: none
  cluster_substrate: local-k3d
  mesh: none
  observability_depth: metrics-only
  secret_backend: keyring
  registry: ghcr
  cdn_edge: none
```
