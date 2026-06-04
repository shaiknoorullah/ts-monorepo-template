import { stub, type StubResponse } from './_stub.js'

export interface Input {
  window?: '1d' | '7d' | '30d'
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(202, 'v0.2')
}
