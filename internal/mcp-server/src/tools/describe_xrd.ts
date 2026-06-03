import { loadXrd, synthesizeExampleClaim } from '../core/xrd-loader.js'

export interface Input {
  name: string
}

export interface Ctx {
  xrdsDir: string
}

export interface Output {
  name: string
  group: string
  kind: string
  openAPIV3Schema: Record<string, unknown>
  example_claim: Record<string, unknown>
}

export async function handler(input: Input, ctx: Ctx): Promise<Output> {
  const xrd = loadXrd(ctx.xrdsDir, input.name)
  return {
    name: xrd.metadata.name,
    group: xrd.spec.group,
    kind: xrd.spec.names.kind,
    openAPIV3Schema: xrd.spec.versions[0]!.schema.openAPIV3Schema,
    example_claim: synthesizeExampleClaim(xrd),
  }
}
