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

import { readFile } from 'node:fs/promises'
import { basename, extname, relative, resolve } from 'node:path'

export interface DecapLoaderOptions {
  /**
   * Glob pattern (relative to `base`) matching the content files.
   * Defaults to `**\/*.{md,mdx}`.
   */
  pattern?: string
  /** Base directory the glob is evaluated against. Default `process.cwd()`. */
  base?: string
  /** Use the file path as the entry id rather than the basename. */
  useRelativePathAsId?: boolean
}

interface AstroLoaderContext {
  store: {
    set: (entry: { id: string; data: Record<string, unknown>; body?: string }) => void
    clear: () => void
  }
  logger?: { info: (msg: string) => void; warn: (msg: string) => void }
}

interface AstroLoader {
  name: string
  load: (ctx: AstroLoaderContext) => Promise<void>
}

export function decapLoader(options: DecapLoaderOptions = {}): AstroLoader {
  const pattern = options.pattern ?? '**/*.{md,mdx}'
  const base = resolve(options.base ?? process.cwd())

  return {
    name: 'decap:git',
    async load({ store, logger }) {
      // Dynamic imports — these are runtime-only dependencies so the package
      // itself doesn't pull them when only the Payload loader is used.
      const { glob } = await import('tinyglobby')
      const matterMod = await import('gray-matter')
      const matter = (matterMod.default ?? matterMod) as (
        s: string,
      ) => { data: Record<string, unknown>; content: string }

      store.clear()

      const files = await glob(pattern, { cwd: base, absolute: true })
      let count = 0

      for (const file of files) {
        const raw = await readFile(file, 'utf8')
        const { data, content } = matter(raw)
        const id = options.useRelativePathAsId
          ? relative(base, file).replace(/\\/g, '/')
          : basename(file, extname(file))
        store.set({ id, data, body: content })
        count++
      }

      logger?.info(`decapLoader: loaded ${count} entries from ${pattern}`)
    },
  }
}
