// apps/marketing/src/lib/jsonld.ts
//
// Tiny JSON-LD helpers. Production sites should import from `@pkg/seo` once
// the package's surface is finalized. This is a local copy so the marketing
// app compiles independently while @pkg/seo evolves.

interface OrganizationInput {
  logo: string
  name: string
  url: string
}

export function jsonLdOrganization(input: OrganizationInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    logo: input.logo,
    name: input.name,
    url: input.url,
  }
}
