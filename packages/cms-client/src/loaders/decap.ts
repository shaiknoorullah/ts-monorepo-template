// packages/cms-client/src/loaders/decap.ts
//
// Astro Content Layer Loader for a Decap-CMS (formerly Netlify CMS)
// git-based content tree. Reads MD / MDX files from disk, parses
// front-matter with gray-matter, and yields one entry per file.
//
// Usage (apps/marketing/src/content/config.ts):
//
//   import { decapLoader } from '@pkg/cms-client/loaders/decap'
//   import { defineCollection, z } from 'astro:content'
//
//   export const collections = {
//     posts: defineCollection({
//       loader: decapLoader({ pattern: 'src/content/posts/**/*.md' }),
//       schema: z.object({ title: z.string(), date: z.coerce.date() }),
//     }),
//   }

import matterImport from 'gray-matter'
import { readFile } from 'node:fs/promises'
import { basename, extname, relative, resolve } from 'node:path'
import { glob } from 'tinyglobby'

export interface DecapLoaderOptions {
  /** Base directory the glob is evaluated against. Default `process.cwd()`. */
  base?: string
  /**
   * Glob pattern (relative to `base`) matching the content files.
   * Defaults to `**\/*.{md,mdx}`.
   */
  pattern?: string
  /** Use the file path as the entry id rather than the basename. */
  useRelativePathAsId?: boolean
}

interface AstroLoader {
  load: (ctx: AstroLoaderContext) => Promise<void>
  name: string
}

interface AstroLoaderContext {
  logger?: { info: (msg: string) => void; warn: (msg: string) => void }
  store: {
    clear: () => void
    set: (entry: { body?: string; data: Record<string, unknown>; id: string; }) => void
  }
}

export function decapLoader(options: DecapLoaderOptions = {}): AstroLoader {
  const pattern = options.pattern ?? '**/*.{md,mdx}'
  const base = resolve(options.base ?? process.cwd())

  return {
    async load({ logger, store }) {
      const matter = matterImport as unknown as (s: string) => {
        content: string
        data: Record<string, unknown>
      }

      store.clear()

      const files = await glob(pattern, { absolute: true, cwd: base })
      let count = 0

      for (const file of files) {
        const raw = await readFile(file, 'utf8')
        const { content, data } = matter(raw)
        const id = options.useRelativePathAsId
          ? relative(base, file).replaceAll('\\', '/')
          : basename(file, extname(file))
        store.set({ body: content, data, id })
        count++
      }

      logger?.info(`decapLoader: loaded ${count} entries from ${pattern}`)
    },
    name: 'decap:git',
  }
}
