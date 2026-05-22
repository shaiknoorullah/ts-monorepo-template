// packages/seo/src/jsonld.ts
//
// schema.org JSON-LD builders. Typed via schema-dts.

import type { Article, BreadcrumbList, FAQPage, Organization, Product } from 'schema-dts'

export function article(input: {
  authorName: string
  datePublished: string
  headline: string
  url: string
}): Article {
  return {
    '@type': 'Article',
    author: { '@type': 'Person', name: input.authorName },
    datePublished: input.datePublished,
    headline: input.headline,
    url: input.url,
  }
}

export function breadcrumbs(input: {
  items: { name: string; url: string }[]
}): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: input.items.map((item, i) => ({
      '@type': 'ListItem',
      item: item.url,
      name: item.name,
      position: i + 1,
    })),
  }
}

export function faqPage(input: { questions: { a: string; q: string; }[] }): FAQPage {
  return {
    '@type': 'FAQPage',
    mainEntity: input.questions.map((q) => ({
      '@type': 'Question',
      acceptedAnswer: { '@type': 'Answer', text: q.a },
      name: q.q,
    })),
  }
}

export function organization(input: { logo: string; name: string; url: string; }): Organization {
  return {
    '@type': 'Organization',
    logo: input.logo,
    name: input.name,
    url: input.url,
  }
}

export function product(input: { description: string; image: string; name: string; }): Product {
  return {
    '@type': 'Product',
    description: input.description,
    image: input.image,
    name: input.name,
  }
}
