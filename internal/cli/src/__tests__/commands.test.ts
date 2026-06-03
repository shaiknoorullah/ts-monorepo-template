// internal/cli/src/__tests__/commands.test.ts
import { describe, it, expect } from 'vitest'
import { Config } from '@oclif/core'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '..', '..')

async function load(): Promise<Config> {
  const c = await Config.load({ root: ROOT })
  return c
}

describe('oclif command tree', () => {
  it('exposes every verb from spec §4.9 and §11.8', async () => {
    const c = await load()
    const ids = c.commandIDs.sort()
    const must = [
      'init',
      'launch',
      'install',
      'new:backend',
      'new:lib',
      'new:frontend',
      'profile:select',
      'profile:diff',
      'profile:list',
      'profile:fork',
      'profile:validate',
      'secrets:bootstrap',
      'secrets:check',
      'secrets:where',
      'env:reconcile',
      'env:check',
      'nx-cloud:setup',
      'nx-cloud:status',
      'nx-cloud:warm',
      'nx-cloud:disable',
      'nx-cloud:self-host',
    ].sort()
    for (const id of must) expect(ids).toContain(id)
  })
  it('stub commands print not_yet_implemented with a plan-phase pointer', async () => {
    const { default: NewBackend } = await import('../commands/new/backend.js')
    const out: string[] = []
    // oclif v4's Command.log routes through console.log (not process.stdout.write directly);
    // the plan's original capture hook was a typo — patching console.log is the correct hook.
    const origLog = console.log
    console.log = ((...args: unknown[]) => {
      out.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    }) as typeof console.log
    try {
      await NewBackend.run([], await load())
    } finally {
      console.log = origLog
    }
    const joined = out.join('\n')
    expect(joined).toContain('not yet implemented in this commit')
    expect(joined).toContain('Phase')
  })
})
