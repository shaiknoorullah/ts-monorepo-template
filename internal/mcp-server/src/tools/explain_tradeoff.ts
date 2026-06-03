import { loadProfile, type ProfileDoc } from '../core/profile-loader.js'
import { handler as simulateCost } from './simulate_cost.js'

export interface Input {
  from: ProfileDoc['id']
  to: ProfileDoc['id']
}

export interface Ctx {
  profilesDir: string
  pricesDir: string
}

type Layer =
  | 'nx'
  | 'helm'
  | 'crossplane'
  | 'terraform'
  | 'ansible'
  | 'secretspec'
  | 'registry'
  | 'observability'

const COMPARABLE_LAYERS: Exclude<Layer, 'registry' | 'observability'>[] = [
  'nx',
  'helm',
  'crossplane',
  'terraform',
  'ansible',
  'secretspec',
]

export interface Output {
  from: ProfileDoc['id']
  to: ProfileDoc['id']
  cost_delta_usd: number
  changes: { layer: Layer; before: string; after: string }[]
}

export async function handler(input: Input, ctx: Ctx): Promise<Output> {
  const a = loadProfile(ctx.profilesDir, input.from)
  const b = loadProfile(ctx.profilesDir, input.to)
  const costA = await simulateCost({ profile: a.id }, ctx)
  const costB = await simulateCost({ profile: b.id }, ctx)
  const changes: { layer: Layer; before: string; after: string }[] = []
  for (const layer of COMPARABLE_LAYERS) {
    const before = JSON.stringify(a.layer_defaults[layer])
    const after = JSON.stringify(b.layer_defaults[layer])
    if (before !== after) changes.push({ layer, before, after })
  }
  return {
    from: a.id,
    to: b.id,
    cost_delta_usd: costB.monthly_total_usd - costA.monthly_total_usd,
    changes,
  }
}
