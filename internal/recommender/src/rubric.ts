import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUBRIC_PATH = resolve(__dirname, 'rubric.yaml')

export type WeightTier = 'high' | 'medium' | 'low'
export type ProfileId =
  | 'p-solo'
  | 'p-hobby'
  | 'p-startup-small'
  | 'p-startup-scale'
  | 'p-enterprise'

export interface ProfilePrior {
  budget_band_usd: { min: number; max: number }
  team_size_fit: string[]
  env_count_fit: { min: number; max: number }
  ha_level_fit: string[]
  compliance_fit: string[]
  workload_shape_fit: string[]
  observability_fit: string[]
  secret_backend_fit: string[]
  registry_fit: string[]
  cdn_edge_fit: string[]
}

export interface Rubric {
  version: string
  sha256: string
  weights: Record<string, WeightTier>
  profile_priors: Record<ProfileId, ProfilePrior>
  penalties: Record<string, number>
}

let cached: Rubric | null = null

export function loadRubric(): Rubric {
  if (cached) return cached
  const raw = readFileSync(RUBRIC_PATH, 'utf8')
  const sha256 = createHash('sha256').update(raw).digest('hex')
  const parsed = parseYaml(raw) as Omit<Rubric, 'sha256'>
  cached = { ...parsed, sha256 }
  return cached
}

export function weightCoefficient(tier: WeightTier): number {
  switch (tier) {
    case 'high': {
      return 1
    }
    case 'low': {
      return 0.2
    }
    case 'medium': {
      return 0.5
    }
  }
}
