import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRICES_ROOT = resolve(__dirname, '..', '..', '..', 'data', 'cloud-prices')

export const providerIds = [
  'hetzner',
  'contabo',
  'ovh',
  'aws',
  'azure',
  'gcp',
  'cloudflare',
  'ghcr',
] as const
export type ProviderId = (typeof providerIds)[number]

export interface Sku {
  id: string
  vcpu?: number
  ram_gb?: number
  disk_gb?: number
  price_monthly: number
  egress_tb_included?: number
}

export interface StorageRate {
  id: string
  unit: 'gb-month' | 'gb-iops-month' | 'tb-month'
  price: number
}

export interface EgressRate {
  unit: 'gb' | 'tb'
  price_per_unit: number
  included_per_month: number
}

export interface ProviderPrices {
  provider: ProviderId
  currency: 'USD' | 'EUR'
  fx_rate_to_usd?: number
  last_updated: string
  source: string
  skus: Sku[]
  storage?: StorageRate[]
  egress?: EgressRate
  observability?: { tier?: string; price_monthly?: number }
}

let cached: Record<ProviderId, ProviderPrices> | null = null

export function loadPrices(): Record<ProviderId, ProviderPrices> {
  if (cached) return cached
  const out = {} as Record<ProviderId, ProviderPrices>
  for (const id of providerIds) {
    const raw = readFileSync(resolve(PRICES_ROOT, `${id}.yaml`), 'utf8')
    out[id] = parseYaml(raw) as ProviderPrices
  }
  cached = out
  return out
}

export function toUsd(value: number, prices: ProviderPrices): number {
  if (prices.currency === 'USD') return value
  const fx = prices.fx_rate_to_usd ?? 1
  return value * fx
}
