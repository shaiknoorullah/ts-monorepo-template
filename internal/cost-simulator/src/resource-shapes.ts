// Hand-curated resource shapes per profile. Maps to Section 1.5 cost bands.
// Each shape is read by simulate.ts to derive a $/mo estimate from price tables.

export type ProfileId =
  | 'p-solo'
  | 'p-hobby'
  | 'p-startup-small'
  | 'p-startup-scale'
  | 'p-enterprise'

export interface ResourceShape {
  primary_provider: 'hetzner' | 'contabo' | 'ovh' | 'aws' | 'azure' | 'gcp'
  compute: { sku_id: string; count: number }[]
  storage_gb: number
  storage_sku_id: string
  egress_tb_per_month: number
  registry_provider: 'ghcr' | 'cloud-native'
  registry_storage_gb_over_quota: number
  secrets_monthly_usd: number
  observability_saas_monthly_usd: number
  edge_provider?: 'cloudflare' | 'none'
}

export const RESOURCE_SHAPES: Record<ProfileId, ResourceShape> = {
  'p-solo': {
    primary_provider: 'hetzner',
    compute: [{ sku_id: 'cx22', count: 1 }],
    storage_gb: 0,
    storage_sku_id: 'volume-ssd',
    egress_tb_per_month: 0,
    registry_provider: 'ghcr',
    registry_storage_gb_over_quota: 0,
    secrets_monthly_usd: 0,
    observability_saas_monthly_usd: 0,
  },
  'p-hobby': {
    primary_provider: 'hetzner',
    compute: [{ sku_id: 'cx32', count: 1 }],
    storage_gb: 100,
    storage_sku_id: 'volume-ssd',
    egress_tb_per_month: 1,
    registry_provider: 'ghcr',
    registry_storage_gb_over_quota: 0,
    secrets_monthly_usd: 0,
    observability_saas_monthly_usd: 0,
    edge_provider: 'cloudflare',
  },
  'p-startup-small': {
    primary_provider: 'hetzner',
    compute: [{ sku_id: 'cx32', count: 3 }],
    storage_gb: 100,
    storage_sku_id: 'volume-ssd',
    egress_tb_per_month: 1,
    registry_provider: 'ghcr',
    registry_storage_gb_over_quota: 0,
    secrets_monthly_usd: 0,
    observability_saas_monthly_usd: 0,
    edge_provider: 'cloudflare',
  },
  'p-startup-scale': {
    primary_provider: 'aws',
    compute: [{ sku_id: 'm7g.large', count: 5 }],
    storage_gb: 500,
    storage_sku_id: 'gp3-ssd',
    egress_tb_per_month: 2,
    registry_provider: 'cloud-native',
    registry_storage_gb_over_quota: 0,
    secrets_monthly_usd: 0,
    observability_saas_monthly_usd: 0,
    edge_provider: 'cloudflare',
  },
  'p-enterprise': {
    primary_provider: 'aws',
    compute: [{ sku_id: 'm7g.large', count: 12 }],
    storage_gb: 2000,
    storage_sku_id: 'gp3-ssd',
    egress_tb_per_month: 10,
    registry_provider: 'cloud-native',
    registry_storage_gb_over_quota: 50,
    secrets_monthly_usd: 50,
    observability_saas_monthly_usd: 0,
    edge_provider: 'cloudflare',
  },
}
