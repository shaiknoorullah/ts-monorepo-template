import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface ProfileDoc {
  id: 'p-solo' | 'p-hobby' | 'p-startup-small' | 'p-startup-scale' | 'p-enterprise'
  name: string
  tagline: string
  cost_band_usd: { min: number; max: number }
  dimensions: Record<string, unknown>
  layer_defaults: {
    nx: Record<string, unknown>
    helm: Record<string, unknown>
    crossplane: Record<string, unknown>
    terraform: Record<string, unknown>
    ansible: Record<string, unknown>
    secretspec: Record<string, unknown>
  }
}

export function loadProfiles(profilesDir: string): ProfileDoc[] {
  let entries: string[]
  try {
    entries = readdirSync(profilesDir)
  } catch {
    throw new Error(`profile not found: cannot read ${profilesDir}`)
  }
  const docs: ProfileDoc[] = []
  for (const entry of entries) {
    const dir = join(profilesDir, entry)
    if (!statSync(dir).isDirectory()) continue
    const yamlPath = join(dir, 'profile.yaml')
    const raw = readFileSync(yamlPath, 'utf8')
    docs.push(parseYaml(raw) as ProfileDoc)
  }
  docs.sort((a, b) => a.cost_band_usd.min - b.cost_band_usd.min)
  return docs
}

export function loadProfile(profilesDir: string, id: string): ProfileDoc {
  const found = loadProfiles(profilesDir).find((p) => p.id === id)
  if (!found) throw new Error(`profile not found: ${id}`)
  return found
}
