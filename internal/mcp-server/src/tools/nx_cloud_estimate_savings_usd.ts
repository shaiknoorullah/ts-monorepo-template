import { stub, type StubResponse } from './_stub.js'

export interface Input {
  window?: '30d' | '90d'
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(204, 'v0.2')
}
