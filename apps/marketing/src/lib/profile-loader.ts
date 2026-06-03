// apps/marketing/src/lib/profile-loader.ts
//
// Build-time profile loader. Reads profiles/<id>/profile.env (the schemaful
// YAML inside the .env file) and emits a typed Profile[] for the /pricing
// route. Spec Section 15.2.

import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..')

export interface Profile {
  machineId: string
  founderLabel: string
  costBand: string
  tagline: string
}

const TAGLINES: Record<string, string> = {
  'p-solo': "I'm hacking on something this weekend.",
  'p-hobby': 'Maybe 100 users, single VPS, $5-20/mo.',
  'p-startup-small': '2-10 of us, real customers, basic HA.',
  'p-startup-scale': 'Funded, multi-env, multi-AZ, real SLA.',
  'p-enterprise': 'Multi-region, compliance, audit trail.',
}

const ORDER = ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']

/** Read every profile.env that lives under profiles/p-*. */
export async function loadProfiles(): Promise<Profile[]> {
  const dir = resolve(REPO_ROOT, 'profiles')
  const entries = await readdir(dir, { withFileTypes: true })
  const out: Profile[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('p-')) continue
    const envPath = resolve(dir, entry.name, 'profile.env')
    const text = await readFile(envPath, 'utf8')
    // profile.env opens with a `# DEVENV_PROFILE=...` line; the rest is YAML.
    const yamlText = text
      .split('\n')
      .filter((l) => !l.startsWith('#'))
      .join('\n')
    const parsed = parseYaml(yamlText) as {
      machineId: string
      founderLabel: string
      costBandUsdMonthly: { min: number; max: number }
    }
    const { min, max } = parsed.costBandUsdMonthly
    const costBand = min === max ? `$${min}` : `$${min}-${max}`
    out.push({
      costBand,
      founderLabel: parsed.founderLabel,
      machineId: parsed.machineId,
      tagline: TAGLINES[parsed.machineId] ?? '',
    })
  }
  return out.sort((a, b) => ORDER.indexOf(a.machineId) - ORDER.indexOf(b.machineId))
}
