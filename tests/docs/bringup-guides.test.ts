// tests/docs/bringup-guides.test.ts
// Phase 16 Task 16.5 — per-profile bringup guides under docs/dev/
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')
const PROFILES = ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']

describe('docs/dev/ per-profile bringup guides', () => {
  it.each(PROFILES)('docs/dev/bringup-%s.md has the 3-command bringup', (id) => {
    const body = readFileSync(resolve(ROOT, `docs/dev/bringup-${id}.md`), 'utf8')
    expect(body).toMatch(/npx create-platform@latest/)
    expect(body).toContain('task launch')
    expect(body).toContain('task open')
    expect(body).toContain(id)
  })
  it('one guide exists per named profile (no extras, no missing)', () => {
    const files = readdirSync(resolve(ROOT, 'docs/dev'))
      .filter((f) => f.startsWith('bringup-') && f.endsWith('.md'))
      .map((f) => f.replace(/^bringup-/, '').replace(/\.md$/, ''))
      .sort()
    expect(files).toEqual([...PROFILES].sort())
  })
})
