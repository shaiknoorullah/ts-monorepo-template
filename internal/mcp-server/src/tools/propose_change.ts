import { stub, type StubResponse } from './_stub.js'

export interface Input {
  title: string
  rationale: string
  patch: string
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(104, 'v0.2')
}
