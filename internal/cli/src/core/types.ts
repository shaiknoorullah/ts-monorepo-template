// internal/cli/src/core/types.ts
export type ProfileId =
  | 'p-solo'
  | 'p-hobby'
  | 'p-startup-small'
  | 'p-startup-scale'
  | 'p-enterprise'

export type Language = 'typescript' | 'python' | 'go' | 'rust'

export interface ProfileDimensions {
  languages: Language[]
  cloud: string[]
  secret_backend: 'keyring' | 'akv' | 'vault' | 'cloud-kms'
  registry: 'ghcr' | 'cloud-native' | 'harbor'
  ha_level: 'best-effort' | 'single-az' | 'multi-az' | 'multi-region'
  observability: 'logs' | 'logs+metrics' | 'logs+metrics+traces' | '+ebpf'
}

export interface Profile {
  id: ProfileId
  tagline: string
  cost_band_usd_monthly: string
  dimensions: ProfileDimensions
}

export interface ProfileDiff {
  from: ProfileId
  to: ProfileId
  changed: {
    languages: { from: Language[]; to: Language[] }
    cloud: { from: string[]; to: string[] }
    secret_backend: { from: string; to: string }
    registry: { from: string; to: string }
    ha_level: { from: string; to: string }
    observability: { from: string; to: string }
  }
}
