// packages/seo/src/jsonld.ts
//
// schema.org JSON-LD builders. Typed via schema-dts.

import type { Article, BreadcrumbList, FAQPage, Organization, Product } from 'schema-dts'

export function organization(input: { name: string; url: string; logo: string }): Organization {
  return {
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    logo: input.logo,
  }
}

export function article(input: {
  headline: string
  url: string
  datePublished: string
  authorName: string
}): Article {
  return {
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    datePublished: input.datePublished,
    author: { '@type': 'Person', name: input.authorName },
  }
}

export function faqPage(input: { questions: Array<{ q: string; a: string }> }): FAQPage {
  return {
    '@type': 'FAQPage',
    mainEntity: input.questions.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  }
}

export function breadcrumbs(input: {
  items: Array<{ name: string; url: string }>
}): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: input.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function product(input: { name: string; description: string; image: string }): Product {
  return {
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.image,
  }
}
