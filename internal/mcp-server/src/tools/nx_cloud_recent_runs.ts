import { stub, type StubResponse } from './_stub.js'

export interface Input {
  limit?: number
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(203, 'v0.2')
}
