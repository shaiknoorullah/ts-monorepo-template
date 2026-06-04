// apps/marketing/__tests__/pages.test.ts
// Phase 16 Task 16.7 — required content on the 6 founder routes.
// Astro pages render at build time; we assert the .astro source contains the
// expected user-visible strings + that the data loaders read the actual source
// of truth files.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { loadErrors } from '../src/lib/errors-loader'
import { loadProfiles } from '../src/lib/profile-loader'
import { loadTerms } from '../src/lib/glossary-loader'

const PAGES_DIR = resolve(__dirname, '..', 'src', 'pages')

function readPage(name: string): string {
  return readFileSync(resolve(PAGES_DIR, name), 'utf8')
}

describe('apps/marketing pages (spec Section 15.2)', () => {
  it('all 6 founder routes exist as .astro pages', () => {
    for (const name of [
      'index.astro',
      'pricing.astro',
      'quickstart.astro',
      'architecture.astro',
      'troubleshoot.astro',
      'glossary.astro',
    ]) {
      expect(existsSync(resolve(PAGES_DIR, name))).toBe(true)
    }
  })

  it('/ renders the "from zero to deployed" hero', () => {
    expect(readPage('index.astro')).toMatch(/from zero to deployed/i)
  })

  it('/pricing renders all 5 founder labels via the profile loader', async () => {
    const profiles = await loadProfiles()
    const labels = profiles.map((p) => p.founderLabel)
    for (const label of [
      'Just Me',
      'Side Project',
      'Early Startup',
      'Scaling Startup',
      'Production at Scale',
    ]) {
      expect(labels).toContain(label)
    }
  })

  it('/quickstart shows the 3 documented commands', () => {
    const body = readPage('quickstart.astro')
    expect(body).toContain('npx create-platform@latest')
    expect(body).toContain('task launch')
    expect(body).toContain('task open')
  })

  it('/architecture lists all 9 layer headings', () => {
    const body = readPage('architecture.astro')
    for (const layer of [
      'Layer 0a',
      'Layer 0b',
      'Layer 1',
      'Layer 2',
      'Layer 3',
      'Layer 4',
      'Layer 5',
      'Layer 6',
      'Layer 7',
    ]) {
      expect(body).toContain(layer)
    }
  })

  it('/troubleshoot renders entries from internal/errors/catalog.yaml', async () => {
    const errors = await loadErrors()
    const codes = errors.map((e) => e.code)
    expect(codes).toContain('TOOL_MISSING_DEVENV')
    expect(codes).toContain('AKV_SECRET_NOT_FOUND')
  })

  it('/glossary renders entries from internal/glossary/terms.yaml', async () => {
    const terms = await loadTerms()
    const names = terms.map((t) => t.term)
    expect(names).toContain('XRD')
    expect(names).toContain('ADR')
    expect(names).toContain('cosign')
  })
})
