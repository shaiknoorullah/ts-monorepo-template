import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface Sku {
  id: string
  vcpu?: number
  ram_gb?: number
  disk_gb?: number
  price_monthly: number
  egress_tb_included?: number
}

export interface PriceFile {
  provider: string
  currency: 'USD' | 'EUR'
  last_updated: string
  skus: Sku[]
  storage?: { id: string; unit: string; price: number }[]
}

const EUR_TO_USD = 1.08

export function loadPrices(pricesDir: string): Record<string, PriceFile> {
  const files = readdirSync(pricesDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  const map: Record<string, PriceFile> = {}
  for (const f of files) {
    const doc = parseYaml(readFileSync(join(pricesDir, f), 'utf8')) as PriceFile
    map[doc.provider] = doc
  }
  return map
}

export function toUsd(price: number, currency: 'USD' | 'EUR'): number {
  return currency === 'USD' ? price : price * EUR_TO_USD
}

export function latestPricesAsOf(prices: Record<string, PriceFile>): string {
  return (
    Object.values(prices)
      .map((p) => p.last_updated)
      .sort((a, b) => a.localeCompare(b))
      .at(-1) ?? '1970-01-01'
  )
}
