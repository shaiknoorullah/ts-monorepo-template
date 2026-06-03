// tests/docs/agents-docs.test.ts
// Phase 16 Task 16.4 — agent reference docs
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')
const MCP_TOOLS = [
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
]

describe('docs/agents/ reference', () => {
  it('mcp-tool-reference.md documents every Section 1.8 tool', () => {
    const body = readFileSync(resolve(ROOT, 'docs/agents/mcp-tool-reference.md'), 'utf8')
    for (const tool of MCP_TOOLS) {
      expect(body).toMatch(new RegExp(`\`${tool}\``))
    }
  })
  it('aegis.md names Aegis as the reference MCP consumer', () => {
    const body = readFileSync(resolve(ROOT, 'docs/agents/aegis.md'), 'utf8')
    expect(body).toMatch(/reference consumer/i)
    expect(body).toMatch(/Aegis/)
  })
  it('agents-md-cascade.md documents the 6 cascade levels and merge rule', () => {
    const body = readFileSync(resolve(ROOT, 'docs/agents/agents-md-cascade.md'), 'utf8')
    for (const path of ['AGENTS.md', 'apps/', 'packages/', 'internal/', 'infra/', 'profiles/']) {
      expect(body).toContain(path)
    }
    expect(body).toMatch(/child[- ]wins/i)
  })
})
