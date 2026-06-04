// apps/docs-public/src/content/config.ts
//
// Astro content collections for Starlight. Required for Astro 5+ to discover
// Markdown files under src/content/docs/ at build time.
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
}
