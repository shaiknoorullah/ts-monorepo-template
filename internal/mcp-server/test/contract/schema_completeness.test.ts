import { describe, expect, it } from 'vitest'
import { buildRegistry } from '../../src/registry.js'
import { compileSchema } from '../../src/schemas/_validator.js'

const EXPECTED_TOOLS = [
  'list_profiles',
  'describe_profile',
  'recommend_profile',
  'list_apps',
  'describe_app',
  'add_app',
  'list_xrds',
  'describe_xrd',
  'claim_infra',
  'simulate_cost',
  'explain_tradeoff',
  'validate_plan',
  'propose_change',
  'nx_cloud_status',
  'nx_cloud_cache_hit_rate',
  'nx_cloud_recent_runs',
  'nx_cloud_estimate_savings_usd',
  'nx_cloud_recommend_backend',
] as const

describe('schema completeness gate (mcp-validate)', () => {
  const registry = buildRegistry()

  it('registers every tool listed in spec Section 1.8 + 3.6', () => {
    for (const name of EXPECTED_TOOLS) {
      if (registry[name] === undefined) throw new Error(`missing tool: ${name}`)
      expect(registry[name]).toBeDefined()
    }
  })

  it('every input + output schema declares $schema = Draft 2020-12', () => {
    for (const [name, tool] of Object.entries(registry)) {
      const input = tool.inputSchema as { $schema?: string }
      const output = tool.outputSchema as { $schema?: string }
      if (input.$schema !== 'https://json-schema.org/draft/2020-12/schema')
        throw new Error(`${name}.input wrong $schema`)
      if (output.$schema !== 'https://json-schema.org/draft/2020-12/schema')
        throw new Error(`${name}.output wrong $schema`)
      expect(input.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
      expect(output.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    }
  })

  it('every schema compiles under strict mode', () => {
    for (const [name, tool] of Object.entries(registry)) {
      try {
        compileSchema(tool.inputSchema)
        compileSchema(tool.outputSchema)
      } catch (error) {
        throw new Error(`${name}: ${(error as Error).message}`)
      }
      expect(() => compileSchema(tool.inputSchema)).not.toThrow()
      expect(() => compileSchema(tool.outputSchema)).not.toThrow()
    }
  })
})
