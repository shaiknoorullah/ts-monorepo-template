// docs/adrs/__tests__/adr-frontmatter.test.ts
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { describe, expect, it } from 'vitest'

const adrDir = resolve(__dirname, '..')
const REQUIRED_KEYS = [
  'id',
  'date',
  'status',
  'context',
  'decision',
  'alternatives',
  'consequences',
]
const ALLOWED_STATUS = ['proposed', 'accepted', 'superseded', 'deprecated']

function extractFrontmatter(raw: string): Record<string, unknown> {
  const m = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!m) throw new Error('no frontmatter')
  return parseYaml(m[1]!)
}

describe('ADR frontmatter contract (spec section 15.9)', () => {
  const files = readdirSync(adrDir).filter((f) => /^\d{4}-.+\.md$/.test(f))

  it('has at least one numbered ADR (0001)', () => {
    expect(files).toContain('0001-default-profile-p-hobby.md')
  })

  it.each(files)('%s has all required frontmatter keys', (file) => {
    const raw = readFileSync(resolve(adrDir, file), 'utf8')
    const fm = extractFrontmatter(raw)
    for (const k of REQUIRED_KEYS) expect(fm).toHaveProperty(k)
    expect(ALLOWED_STATUS).toContain(fm.status as string)
  })

  it('template file _template.md also satisfies frontmatter contract', () => {
    const raw = readFileSync(resolve(adrDir, '_template.md'), 'utf8')
    const fm = extractFrontmatter(raw)
    for (const k of REQUIRED_KEYS) expect(fm).toHaveProperty(k)
  })
})
