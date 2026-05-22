// apps/marketing/src/content/config.ts
//
// Astro Content Layer config. We declare two collections:
//
//   - `posts`  — Payload-backed (CMS-driven blog)
//   - `pages`  — Decap/git-backed (engineer-edited Markdown)
//
// The loaders live in `@pkg/cms-client/loaders/{payload,decap}` and only
// require `tinyglobby` + `gray-matter` to be installed in this app.

import { defineCollection, z } from 'astro:content'
import { payloadLoader } from '@pkg/cms-client/loaders/payload'
import { decapLoader } from '@pkg/cms-client/loaders/decap'

const posts = defineCollection({
  loader: payloadLoader({
    baseUrl: import.meta.env.PAYLOAD_URL ?? 'http://localhost:3000',
    collection: 'posts',
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    where: { status: { equals: 'published' } },
    depth: 1,
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
  }),
})

const pages = defineCollection({
  loader: decapLoader({
    pattern: 'src/content/pages/**/*.{md,mdx}',
    base: process.cwd(),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    draft: z.boolean().optional(),
  }),
})

export const collections = { posts, pages }
