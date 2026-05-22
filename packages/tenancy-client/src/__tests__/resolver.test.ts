import { describe, expect, it } from 'vitest'
import { resolveTenantFromHostname, isValidTenantSlug } from '../resolver'

describe('resolveTenantFromHostname', () => {
  it('extracts tenant slug from app subdomain', () => {
    expect(resolveTenantFromHostname('acme.app.example.com', '.app.example.com')).toBe('acme')
  })
  it('returns null for reserved subdomains', () => {
    expect(resolveTenantFromHostname('admin.app.example.com', '.app.example.com')).toBeNull()
  })
  it('returns null for bare app subdomain', () => {
    expect(resolveTenantFromHostname('app.example.com', '.app.example.com')).toBeNull()
  })
  it('returns null for unrelated hostname', () => {
    expect(resolveTenantFromHostname('example.org', '.app.example.com')).toBeNull()
  })
})

describe('isValidTenantSlug', () => {
  it('accepts valid slug', () => {
    expect(isValidTenantSlug('acme-co')).toBe(true)
  })
  it('rejects uppercase', () => {
    expect(isValidTenantSlug('Acme')).toBe(false)
  })
})
