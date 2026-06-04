import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

export interface XrdDoc {
  apiVersion: string
  kind: 'CompositeResourceDefinition'
  metadata: { name: string }
  spec: {
    group: string
    names: { kind: string; plural: string }
    claimNames?: { kind: string; plural: string }
    versions: {
      name: string
      served: boolean
      referenceable: boolean
      schema: { openAPIV3Schema: Record<string, unknown> }
    }[]
  }
}

export function loadXrds(xrdsDir: string): XrdDoc[] {
  if (!existsSync(xrdsDir)) return []
  return readdirSync(xrdsDir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => parseYaml(readFileSync(join(xrdsDir, f), 'utf8')) as XrdDoc)
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))
}

export function loadXrd(xrdsDir: string, name: string): XrdDoc {
  const found = loadXrds(xrdsDir).find((x) => x.metadata.name === name)
  if (!found) throw new Error(`xrd not found: ${name}`)
  return found
}

export function synthesizeExampleClaim(xrd: XrdDoc): Record<string, unknown> {
  const version = xrd.spec.versions[0]!
  const claimKind = xrd.spec.claimNames?.kind ?? xrd.spec.names.kind
  return {
    apiVersion: `${xrd.spec.group}/${version.name}`,
    kind: claimKind,
    metadata: { name: 'example' },
    spec: {},
  }
}
