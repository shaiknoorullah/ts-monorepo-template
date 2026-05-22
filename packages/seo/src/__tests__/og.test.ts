import { describe, expect, it } from 'vitest'
import { buildOpenGraph } from '../og'
import { organization, breadcrumbs } from '../jsonld'

describe('og', () => {
  it('emits required tags', () => {
    const tags = buildOpenGraph({
      title: 'X',
      description: 'Y',
      url: 'https://example.com',
    })
    expect(tags['og:title']).toBe('X')
    expect(tags['og:type']).toBe('website')
  })
})

describe('jsonld', () => {
  it('organization is schema.org Organization', () => {
    const o = organization({ name: 'Ex', url: 'https://e.com', logo: 'https://e.com/l.png' })
    expect(o['@type']).toBe('Organization')
  })

  it('breadcrumbs preserves order', () => {
    const b = breadcrumbs({
      items: [
        { name: 'Home', url: 'https://e.com/' },
        { name: 'Pricing', url: 'https://e.com/pricing' },
      ],
    })
    expect(b.itemListElement).toHaveLength(2)
  })
})
