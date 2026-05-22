import { describe, expect, it } from 'vitest'
import { resolveTenantFromHostname } from '@pkg/tenancy-client'

describe('web-app tenant resolution', () => {
  it('reads tenant slug from app subdomain', () => {
    expect(resolveTenantFromHostname('acme.app.example.com', '.app.example.com')).toBe('acme')
  })
})
