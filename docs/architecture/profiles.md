# Profiles

Authoritative source: spec [Section 1.5](../superpowers/specs/2026-06-03-platform-foundation-design.md) (names + cost bands) and [Section 1.6](../superpowers/specs/2026-06-03-platform-foundation-design.md) (12 axes).

## The five named profiles

| Founder label       | Machine ID        | $/mo band | One-line tagline                         |
| ------------------- | ----------------- | --------- | ---------------------------------------- |
| Just Me             | `p-solo`          | $0        | "I'm hacking on something this weekend." |
| Side Project        | `p-hobby`         | $5–20     | "Maybe 100 users, single VPS, $5–20/mo." |
| Early Startup       | `p-startup-small` | $30–150   | "2–10 of us, real customers, basic HA."  |
| Scaling Startup     | `p-startup-scale` | $300–1500 | "Funded, multi-env, multi-AZ, real SLA." |
| Production at Scale | `p-enterprise`    | $2k+      | "Multi-region, compliance, audit trail." |

## The 12 axes

Each named profile picks a coherent point across these axes:

| Axis                  | Range                                                        |
| --------------------- | ------------------------------------------------------------ |
| `team_size`           | solo / small / mid / large                                   |
| `env_count`           | 1 / 2 / 3 / N                                                |
| `target_budget_usd`   | <$20 / <$100 / <$500 / <$2k / open                           |
| `compliance_floor`    | none / SOC2-ready / HIPAA-ready / FedRAMP-ready              |
| `workload_shape`      | web-services / event-driven / batch / mixed                  |
| `ha_level`            | none / single-AZ / multi-AZ / multi-region                   |
| `cluster_substrate`   | local-k3d / single-VPS / bare-VM k3s / kubeadm / managed-K8s |
| `mesh`                | none / linkerd / istio / cilium-mesh                         |
| `observability_depth` | metrics-only / +logs / +traces / +profiling                  |
| `secret_backend`      | keyring / akv / asm / gsm / vault                            |
| `registry`            | ghcr / acr / ecr / gar / harbor                              |
| `cdn_edge`            | none / cloudflare / fastly                                   |

## Fork rule

`task profile:fork` creates a custom profile directory under `profiles/<id>/`. CI matrix gates only the 5 named profiles; forks are user-owned.
