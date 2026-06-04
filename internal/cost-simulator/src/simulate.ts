import { loadPrices, toUsd, type ProviderId, type ProviderPrices } from './prices'
import { RESOURCE_SHAPES, type ProfileId, type ResourceShape } from './resource-shapes'

export interface SimulateInput {
  profile: ProfileId
  overrides?: Partial<ResourceShape>
}

export interface SimulateResult {
  profile: ProfileId
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

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

function computeCost(shape: ResourceShape, p: ProviderPrices, assumptions: string[]): number {
  let total = 0
  for (const slot of shape.compute) {
    const sku = p.skus.find((s) => s.id === slot.sku_id)
    if (!sku) {
      throw new Error(`Unknown SKU ${slot.sku_id} for provider ${p.provider}`)
    }
    const eachUsd = toUsd(sku.price_monthly, p)
    total += eachUsd * slot.count
    assumptions.push(`${slot.count}x ${slot.sku_id} @ $${round2(eachUsd)}/mo`)
  }
  return total
}

function storageCost(shape: ResourceShape, p: ProviderPrices, assumptions: string[]): number {
  if (shape.storage_gb === 0 || !p.storage) return 0
  const row = p.storage.find((s) => s.id === shape.storage_sku_id)
  if (!row) return 0
  const unitUsd = toUsd(row.price, p)
  let cost
  if (row.unit === 'gb-month') cost = unitUsd * shape.storage_gb
  else if (row.unit === 'tb-month') cost = unitUsd * (shape.storage_gb / 1000)
  else cost = unitUsd * shape.storage_gb
  assumptions.push(
    `${shape.storage_gb}GB ${shape.storage_sku_id} @ $${round2(unitUsd)}/${row.unit}`,
  )
  return cost
}

function egressCost(shape: ResourceShape, p: ProviderPrices, assumptions: string[]): number {
  if (shape.egress_tb_per_month === 0 || !p.egress) return 0
  const includedTb =
    p.egress.unit === 'tb' ? p.egress.included_per_month : p.egress.included_per_month / 1000
  const billableTb = Math.max(0, shape.egress_tb_per_month - includedTb)
  if (billableTb === 0) {
    assumptions.push(`${shape.egress_tb_per_month}TB egress within included ${includedTb}TB`)
    return 0
  }
  const unitUsd = toUsd(p.egress.price_per_unit, p)
  const cost = p.egress.unit === 'tb' ? unitUsd * billableTb : unitUsd * billableTb * 1000
  assumptions.push(`${billableTb}TB egress over included @ $${round2(unitUsd)}/${p.egress.unit}`)
  return cost
}

function registryCost(
  shape: ResourceShape,
  tables: Record<ProviderId, ProviderPrices>,
  assumptions: string[],
): { cost: number; provider: string } {
  if (shape.registry_provider === 'ghcr') {
    const p = tables.ghcr
    const overGb = shape.registry_storage_gb_over_quota
    const row = p.storage?.find((s) => s.id === 'ghcr-private-over-quota')
    if (!row || overGb === 0) {
      assumptions.push('GHCR free tier')
      return { cost: 0, provider: 'ghcr' }
    }
    const cost = row.price * overGb
    assumptions.push(`GHCR ${overGb}GB over quota @ $${row.price}/GB`)
    return { cost, provider: 'ghcr' }
  }
  // cloud-native — fold into primary provider, free for Day-1 budget purposes
  assumptions.push('cloud-native registry (folded into compute provider, $0 surfaced)')
  return { cost: 0, provider: 'cloud-native-registry' }
}

export function simulateCost(input: SimulateInput): SimulateResult {
  const base = RESOURCE_SHAPES[input.profile]
  const shape: ResourceShape = { ...base, ...input.overrides }
  const tables = loadPrices()
  const primary = tables[shape.primary_provider]

  const assumptions: string[] = []
  const compute = computeCost(shape, primary, assumptions)
  const storage = storageCost(shape, primary, assumptions)
  const egress = egressCost(shape, primary, assumptions)
  const registry = registryCost(shape, tables, assumptions)
  const secrets = shape.secrets_monthly_usd
  const observability_saas = shape.observability_saas_monthly_usd

  const by_provider: Record<string, number> = {}
  by_provider[shape.primary_provider] = round2(compute + storage + egress)
  if (registry.cost > 0) by_provider[registry.provider] = round2(registry.cost)
  if (secrets > 0) by_provider['vault-cloud'] = round2(secrets)
  if (observability_saas > 0) by_provider['grafana-cloud'] = round2(observability_saas)

  const total = compute + storage + egress + registry.cost + secrets + observability_saas

  return {
    profile: input.profile,
    monthly_total_usd: round2(total),
    by_layer: {
      compute: round2(compute),
      storage: round2(storage),
      egress: round2(egress),
      registry: round2(registry.cost),
      secrets: round2(secrets),
      observability_saas: round2(observability_saas),
    },
    by_provider,
    assumptions,
    prices_as_of: primary.last_updated,
  }
}
