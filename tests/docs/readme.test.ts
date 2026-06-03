// tests/docs/readme.test.ts
// Phase 16 Task 16.6 — root README required sections
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')

describe('root README.md', () => {
  const body = readFileSync(resolve(ROOT, 'README.md'), 'utf8')
  it('has a 30-second pitch heading', () => {
    expect(body).toMatch(/##\s+30-second pitch/i)
  })
  it('embeds the 7-layer diagram (mermaid or ascii)', () => {
    const hasMermaid = /```mermaid/.test(body)
    const hasAscii = /Layer 0a/.test(body) && /Layer 7/.test(body)
    expect(hasMermaid || hasAscii).toBe(true)
  })
  it('links to docs/architecture/seven-layers.md', () => {
    expect(body).toContain('docs/architecture/seven-layers.md')
  })
  it('shows the 3-command quickstart', () => {
    expect(body).toContain('npx create-platform@latest')
    expect(body).toContain('task launch')
    expect(body).toContain('task open')
  })
  it('lists all 5 founder labels in a pricing-style table', () => {
    for (const label of [
      'Just Me',
      'Side Project',
      'Early Startup',
      'Scaling Startup',
      'Production at Scale',
    ]) {
      expect(body).toContain(label)
    }
  })
})
