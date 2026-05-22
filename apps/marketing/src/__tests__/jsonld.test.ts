import { describe, expect, it } from 'vitest'

import { jsonLdOrganization } from '../lib/jsonld'

describe('jsonLdOrganization', () => {
  it('emits a valid schema.org Organization payload', () => {
    const out = jsonLdOrganization({
      logo: 'https://www.example.com/logo.png',
      name: 'Example',
      url: 'https://www.example.com',
    })
    expect(out['@context']).toBe('https://schema.org')
    expect(out['@type']).toBe('Organization')
    expect(out.name).toBe('Example')
  })
})
