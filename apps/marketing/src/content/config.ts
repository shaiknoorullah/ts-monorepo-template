// apps/marketing/src/content/config.ts
//
// Astro Content Layer config. We declare two collections:
//
//   - `posts`  — Payload-backed (CMS-driven blog)
//   - `pages`  — Decap/git-backed (engineer-edited Markdown)
//
// The loaders live in `@pkg/cms-client/loaders/{payload,decap}` and only
// require `tinyglobby` + `gray-matter` to be installed in this app.

import { decapLoader, payloadLoader } from '@pkg/cms-client'
import { defineCollection, z } from 'astro:content'

// `Loader` type still references zod 3's `ZodType<any, ZodTypeDef, any>` shape;
// our loaders type-check against zod 4. Cast at the call-site to bridge.
const posts = defineCollection({
  loader: payloadLoader({
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    baseUrl: import.meta.env.PAYLOAD_URL ?? 'http://localhost:3000',
    collection: 'posts',
    depth: 1,
    where: { status: { equals: 'published' } },
  }) as any,
  schema: z.object({
    excerpt: z.string().optional(),
    id: z.string(),
    publishedAt: z.coerce.date().optional(),
    slug: z.string(),
    title: z.string(),
  }),
})

const pages = defineCollection({
  loader: decapLoader({
    base: process.cwd(),
    pattern: 'src/content/pages/**/*.{md,mdx}',
  }) as any,
  schema: z.object({
    description: z.string().optional(),
    draft: z.boolean().optional(),
    title: z.string(),
  }),
})

export const collections = { pages, posts }
