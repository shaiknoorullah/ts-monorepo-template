import { stub, type StubResponse } from './_stub.js'

export interface Input {
  patch: string
  layers?: ('nx' | 'helm' | 'crossplane' | 'terraform' | 'ansible' | 'secretspec' | 'docker')[]
}

export async function handler(_input: Input, _ctx: Record<string, never>): Promise<StubResponse> {
  return stub(103, 'v0.2')
}
