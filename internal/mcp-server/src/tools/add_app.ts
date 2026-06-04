import { stub, type StubResponse } from './_stub.js'

export interface Input {
  name: string
  language: 'go' | 'python' | 'rust' | 'typescript'
  profile?: 'p-solo' | 'p-hobby' | 'p-startup-small' | 'p-startup-scale' | 'p-enterprise'
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(101, 'v0.2')
}
