// packages/tenancy-client/src/resolver.ts
//
// Given `acme.app.example.com`, return `acme`. Returns null for non-tenant
// hostnames like `app.example.com` or `localhost`.

import { TenantSlugSchema } from './types'

export function isValidTenantSlug(value: string): boolean {
  return TenantSlugSchema.safeParse(value).success
}

export function resolveTenantFromHostname(hostname: string, rootDomain: string): string | null {
  if (!hostname.endsWith(rootDomain)) return null
  const prefix = hostname.slice(0, hostname.length - rootDomain.length).replace(/\.$/, '')
  if (!prefix) return null
  // Reserved subdomains
  if (['app', 'www', 'api', 'docs', 'admin', 'auth'].includes(prefix)) return null
  if (!isValidTenantSlug(prefix)) return null
  return prefix
}
