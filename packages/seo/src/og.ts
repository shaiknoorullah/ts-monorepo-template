// packages/seo/src/og.ts

export interface OpenGraphInput {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article' | 'product'
  siteName?: string
}

export function buildOpenGraph(input: OpenGraphInput): Record<string, string> {
  const tags: Record<string, string> = {
    'og:title': input.title,
    'og:description': input.description,
    'og:url': input.url,
    'og:type': input.type ?? 'website',
  }
  if (input.image) tags['og:image'] = input.image
  if (input.siteName) tags['og:site_name'] = input.siteName
  return tags
}
