import { loadXrds } from '../core/xrd-loader.js'

export interface Ctx {
  xrdsDir: string
}

export interface Output {
  xrds: { name: string; group: string; kind: string; versions: string[] }[]
}

export async function handler(_input: Record<string, never>, ctx: Ctx): Promise<Output> {
  const docs = loadXrds(ctx.xrdsDir)
  return {
    xrds: docs.map((x) => ({
      name: x.metadata.name,
      group: x.spec.group,
      kind: x.spec.names.kind,
      versions: x.spec.versions.map((v) => v.name),
    })),
  }
}
