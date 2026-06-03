import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface AppMeta {
  name: string
  language: 'go' | 'python' | 'rust' | 'typescript'
  path: string
  chart: string
  envs: string[]
  capabilities: Record<string, unknown>
}

export function loadApps(appsDir: string): AppMeta[] {
  if (!existsSync(appsDir)) return []
  const out: AppMeta[] = []
  for (const entry of readdirSync(appsDir)) {
    const dir = join(appsDir, entry)
    if (!statSync(dir).isDirectory()) continue
    const meta = join(dir, 'META.yaml')
    if (!existsSync(meta)) continue
    out.push(parseYaml(readFileSync(meta, 'utf8')) as AppMeta)
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}

export function loadApp(appsDir: string, name: string): AppMeta {
  const found = loadApps(appsDir).find((a) => a.name === name)
  if (!found) throw new Error(`app not found: ${name}`)
  return found
}
