import { loadProfiles } from '../core/profile-loader.js'

export interface Ctx {
  profilesDir: string
}

export interface Output {
  profiles: {
    id: string
    name: string
    cost_band_usd: { min: number; max: number }
    tagline: string
  }[]
}

export async function handler(_input: Record<string, never>, ctx: Ctx): Promise<Output> {
  const docs = loadProfiles(ctx.profilesDir)
  return {
    profiles: docs.map((p) => ({
      id: p.id,
      name: p.name,
      cost_band_usd: p.cost_band_usd,
      tagline: p.tagline,
    })),
  }
}
