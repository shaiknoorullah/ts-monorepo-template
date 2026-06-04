import { stub, type StubResponse } from './_stub.js'

export interface Input {
  xrd: string
  app: string
  env: 'dev' | 'staging' | 'prod'
  spec?: Record<string, unknown>
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(102, 'v0.2')
}
