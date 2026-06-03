import { stub, type StubResponse } from './_stub.js'

export async function handler(
  _input: Record<string, never>,
  _ctx: Record<string, never>,
): Promise<StubResponse> {
  return stub(201, 'v0.2')
}
