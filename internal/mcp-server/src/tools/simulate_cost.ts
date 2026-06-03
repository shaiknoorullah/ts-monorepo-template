import { simulateCost as simulateCostFromPackage } from '@internal/cost-simulator'
import { loadProfile, type ProfileDoc } from '../core/profile-loader.js'
import { loadPrices, latestPricesAsOf, toUsd, type PriceFile } from '../core/cost-prices.js'

export interface Input {
  profile: ProfileDoc['id']
  overrides?: { compute_nodes?: number; storage_gb?: number; egress_tb?: number }
}

export interface Ctx {
  profilesDir: string
  pricesDir: string
}

interface Sizing {
  compute_nodes: number
  compute_sku: string
  storage_gb: number
  egress_tb: number
  observability_provider: string | null
}

const SIZING: Record<ProfileDoc['id'], Sizing> = {
  'p-solo': {
    compute_nodes: 0,
    compute_sku: 'cx22',
    storage_gb: 0,
    egress_tb: 0,
    observability_provider: null,
  },
  'p-hobby': {
    compute_nodes: 1,
    compute_sku: 'cx22',
    storage_gb: 40,
    egress_tb: 1,
    observability_provider: null,
  },
  'p-startup-small': {
    compute_nodes: 4,
    compute_sku: 'cx32',
    storage_gb: 100,
    egress_tb: 1,
    observability_provider: 'grafana-cloud',
  },
  'p-startup-scale': {
    compute_nodes: 6,
    compute_sku: 'cx32',
    storage_gb: 500,
    egress_tb: 5,
    observability_provider: 'grafana-cloud',
  },
  'p-enterprise': {
    compute_nodes: 12,
    compute_sku: 'cx32',
    storage_gb: 2000,
    egress_tb: 20,
    observability_provider: 'grafana-cloud',
  },
}

function findSku(price: PriceFile, id: string): { price_monthly: number } {
  const sku = price.skus.find((s) => s.id === id)
  if (!sku) throw new Error(`sku not found in ${price.provider}: ${id}`)
  return sku
}

export interface Output {
  profile: ProfileDoc['id']
  monthly_total_usd: number
  by_layer: {
    compute: number
    storage: number
    egress: number
    registry: number
    secrets: number
    observability_saas: number
  }
  by_provider: Record<string, number>
  assumptions: string[]
  prices_as_of: string
}

function handleWithCtx(input: Input, ctx: Ctx): Output {
  const profile = loadProfile(ctx.profilesDir, input.profile)
  const prices = loadPrices(ctx.pricesDir)
  const sizing = SIZING[profile.id]
  const compute_nodes = input.overrides?.compute_nodes ?? sizing.compute_nodes
  const storage_gb = input.overrides?.storage_gb ?? sizing.storage_gb
  const egress_tb = input.overrides?.egress_tb ?? sizing.egress_tb

  const by_provider: Record<string, number> = {}
  const hetzner = prices.hetzner
  let compute_usd = 0
  let storage_usd = 0
  if (hetzner && compute_nodes > 0) {
    const sku = findSku(hetzner, sizing.compute_sku)
    compute_usd = toUsd(sku.price_monthly * compute_nodes, hetzner.currency)
    by_provider.hetzner = (by_provider.hetzner ?? 0) + compute_usd
    const storage = hetzner.storage?.[0]
    if (storage && storage_gb > 0) {
      storage_usd = toUsd(storage.price * storage_gb, hetzner.currency)
      by_provider.hetzner += storage_usd
    }
  }

  const egress_usd = egress_tb * 0
  const registry_usd = 0
  const secrets_usd = 0

  let observability_usd = 0
  if (sizing.observability_provider) {
    const obs = prices[sizing.observability_provider]
    if (obs) {
      const sku = obs.skus[0]!
      observability_usd = toUsd(sku.price_monthly, obs.currency)
      by_provider[sizing.observability_provider] =
        (by_provider[sizing.observability_provider] ?? 0) + observability_usd
    }
  }

  const total =
    compute_usd + storage_usd + egress_usd + registry_usd + secrets_usd + observability_usd

  return {
    profile: profile.id,
    monthly_total_usd: Math.round(total),
    by_layer: {
      compute: Math.round(compute_usd),
      storage: Math.round(storage_usd),
      egress: Math.round(egress_usd),
      registry: Math.round(registry_usd),
      secrets: Math.round(secrets_usd),
      observability_saas: Math.round(observability_usd),
    },
    by_provider: Object.fromEntries(
      Object.entries(by_provider).map(([k, v]) => [k, Math.round(v)]),
    ),
    assumptions: [
      `${compute_nodes}x ${sizing.compute_sku}`,
      `${storage_gb}GB longhorn replicated`,
      `${egress_tb}TB egress`,
      'GHCR free tier',
    ],
    prices_as_of: latestPricesAsOf(prices),
  }
}

export async function handler(input: Input, ctx?: Ctx): Promise<Output> {
  if (ctx) {
    return handleWithCtx(input, ctx);
  }
  // Phase 15: delegate to the deterministic @internal/cost-simulator package.
  const result = simulateCostFromPackage({ profile: input.profile })
  return result;
}
