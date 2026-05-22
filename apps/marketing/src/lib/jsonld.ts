// apps/marketing/src/lib/jsonld.ts
//
// Tiny JSON-LD helpers. Production sites should import from `@pkg/seo` once
// the package's surface is finalized. This is a local copy so the marketing
// app compiles independently while @pkg/seo evolves.

interface OrganizationInput {
  name: string
  url: string
  logo: string
}

export function jsonLdOrganization(input: OrganizationInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    logo: input.logo,
  }
}
