// docs/__tests__/glossary.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const raw = readFileSync(resolve(__dirname, '../glossary.md'), 'utf8')

describe('docs/glossary.md mirrors spec section 18.1', () => {
  const requiredTerms = [
    'ADR',
    'AGENTS.md',
    'ApplicationSet',
    'buf',
    'cargo-chef',
    'Composition',
    'cosign',
    'cspell',
    'devenv',
    'direnv',
    'DTE',
    'ESO',
    'Function',
    'GHCR',
    'GitOps',
    'Helm library chart',
    'Kargo',
    'KCL',
    'Kubespray',
    'lefthook',
    'MCP',
    'nx affected',
    'Nx Cloud',
    'OTel',
    'PnT',
    'PowerPack',
    'secretspec',
    'tsdown',
    'tfplugindocs',
    'XR',
    'XRD',
  ]

  it.each(requiredTerms)('defines term: %s', (term) => {
    expect(raw).toContain(`| ${term} `)
  })

  it('cites spec section 18.1', () => {
    expect(raw).toMatch(/Section 18\.1/)
  })
})
