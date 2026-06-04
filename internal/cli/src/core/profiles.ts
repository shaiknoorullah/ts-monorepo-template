// internal/cli/src/core/profiles.ts
import type { Profile, ProfileDiff, ProfileId } from './types.js'

const PROFILES: Profile[] = [
  {
    id: 'p-solo',
    tagline: 'Just Me — laptop + k3d + keyring',
    cost_band_usd_monthly: '$0-$10',
    dimensions: {
      languages: ['typescript', 'python'],
      cloud: [],
      secret_backend: 'keyring',
      registry: 'ghcr',
      ha_level: 'best-effort',
      observability: 'logs',
    },
  },
  {
    id: 'p-hobby',
    tagline: 'Side Project — one VPS + keyring',
    cost_band_usd_monthly: '$10-$30',
    dimensions: {
      languages: ['typescript', 'python'],
      cloud: ['hetzner'],
      secret_backend: 'keyring',
      registry: 'ghcr',
      ha_level: 'single-az',
      observability: 'logs+metrics',
    },
  },
  {
    id: 'p-startup-small',
    tagline: 'Startup (small) — 3-node k3s + AKV',
    cost_band_usd_monthly: '$30-$150',
    dimensions: {
      languages: ['typescript', 'python', 'go'],
      cloud: ['hetzner'],
      secret_backend: 'akv',
      registry: 'ghcr',
      ha_level: 'multi-az',
      observability: 'logs+metrics+traces',
    },
  },
  {
    id: 'p-startup-scale',
    tagline: 'Startup (scale) — managed K8s + Vault',
    cost_band_usd_monthly: '$300-$1500',
    dimensions: {
      languages: ['typescript', 'python', 'go', 'rust'],
      cloud: ['aws'],
      secret_backend: 'vault',
      registry: 'cloud-native',
      ha_level: 'multi-az',
      observability: 'logs+metrics+traces',
    },
  },
  {
    id: 'p-enterprise',
    tagline: 'Production at Scale — multi-region + compliance',
    cost_band_usd_monthly: '$5000+',
    dimensions: {
      languages: ['typescript', 'python', 'go', 'rust'],
      cloud: ['aws', 'gcp', 'azure'],
      secret_backend: 'vault',
      registry: 'harbor',
      ha_level: 'multi-region',
      observability: '+ebpf',
    },
  },
]

export function listProfiles(): Profile[] {
  return [...PROFILES]
}

export function describeProfile(id: string): Profile {
  const found = PROFILES.find((p) => p.id === id)
  if (!found) {
    throw new Error(`unknown profile: ${id}`)
  }
  return found
}

export function diffProfiles(fromId: ProfileId, toId: ProfileId): ProfileDiff {
  const from = describeProfile(fromId)
  const to = describeProfile(toId)
  return {
    from: from.id,
    to: to.id,
    changed: {
      languages: { from: from.dimensions.languages, to: to.dimensions.languages },
      cloud: { from: from.dimensions.cloud, to: to.dimensions.cloud },
      secret_backend: {
        from: from.dimensions.secret_backend,
        to: to.dimensions.secret_backend,
      },
      registry: { from: from.dimensions.registry, to: to.dimensions.registry },
      ha_level: { from: from.dimensions.ha_level, to: to.dimensions.ha_level },
      observability: {
        from: from.dimensions.observability,
        to: to.dimensions.observability,
      },
    },
  }
}
