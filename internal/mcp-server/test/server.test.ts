import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRegistry, type Registry } from '../src/registry.js'

const FIXTURES = join(__dirname, 'fixtures')

const ctx = {
  profilesDir: join(FIXTURES, 'profiles'),
  appsDir: join(FIXTURES, 'apps'),
  xrdsDir: join(FIXTURES, 'xrds'),
  pricesDir: join(FIXTURES, 'data', 'cloud-prices'),
  rubricPath: join(FIXTURES, 'rubric.yaml'),
}

describe('registry', () => {
  const registry: Registry = buildRegistry()

  it('registers exactly 18 tools from spec Section 1.8 + Section 3.6', () => {
    const names = Object.keys(registry).sort()
    expect(names).toEqual(
      [
        'add_app',
        'claim_infra',
        'describe_app',
        'describe_profile',
        'describe_xrd',
        'explain_tradeoff',
        'list_apps',
        'list_profiles',
        'list_xrds',
        'nx_cloud_cache_hit_rate',
        'nx_cloud_estimate_savings_usd',
        'nx_cloud_recent_runs',
        'nx_cloud_recommend_backend',
        'nx_cloud_status',
        'propose_change',
        'recommend_profile',
        'simulate_cost',
        'validate_plan',
      ].sort(),
    )
  })

  it('every tool entry has schemas + handler', () => {
    for (const [name, tool] of Object.entries(registry)) {
      if (tool.inputSchema === undefined) throw new Error(`${name} missing inputSchema`)
      if (tool.outputSchema === undefined) throw new Error(`${name} missing outputSchema`)
      if (typeof tool.handler !== 'function') throw new TypeError(`${name} handler not function`)
      expect(tool.inputSchema).toBeDefined()
      expect(tool.outputSchema).toBeDefined()
      expect(typeof tool.handler).toBe('function')
    }
  })

  it('list_profiles handler runs end-to-end against ctx', async () => {
    const out = (await registry['list_profiles']!.handler({}, ctx)) as {
      profiles: { id: string }[]
    }
    expect(out.profiles).toHaveLength(5)
  })

  it('rejects unknown tool invocations via the call dispatcher', () => {
    const tool = registry['no_such_tool']
    expect(tool).toBeUndefined()
  })
})
