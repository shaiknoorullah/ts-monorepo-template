import { describe, expect, it } from 'vitest'
import { loadPrices, providerIds } from '../prices'

describe('loadPrices', () => {
  it('loads all 8 providers', () => {
    const tables = loadPrices()
    expect(Object.keys(tables).sort()).toEqual([...providerIds].sort())
  })

  it('hetzner cx32 SKU is present at €7.59', () => {
    const tables = loadPrices()
    const sku = tables.hetzner.skus.find((s) => s.id === 'cx32')
    expect(sku?.price_monthly).toBe(7.59)
  })

  it('USD conversion: EUR values flag fx_rate_to_usd', () => {
    const tables = loadPrices()
    expect(tables.hetzner.currency).toBe('EUR')
    expect(tables.hetzner.fx_rate_to_usd).toBeGreaterThan(1)
    expect(tables.aws.currency).toBe('USD')
  })
})
