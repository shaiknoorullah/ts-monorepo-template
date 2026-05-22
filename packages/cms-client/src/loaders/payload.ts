// packages/cms-client/src/loaders/payload.ts
//
// Astro Content Layer Loader for Payload CMS. Fetches a Payload REST
// collection (paginated) and yields one entry per `doc`.
//
// Usage (apps/marketing/src/content/config.ts):
//
//   import { payloadLoader } from '@pkg/cms-client/loaders/payload'
//   import { defineCollection, z } from 'astro:content'
//
//   export const collections = {
//     posts: defineCollection({
//       loader: payloadLoader({
//         baseUrl: import.meta.env.PAYLOAD_URL,
//         collection: 'posts',
//         where: { status: { equals: 'published' } },
//       }),
//       schema: z.object({ id: z.string(), title: z.string(), slug: z.string() }),
//     }),
//   }
//
// The shape of the returned object intentionally matches Astro's Loader
// interface (https://docs.astro.build/en/reference/content-loader-reference/)
// without taking a hard dependency on `astro` itself — Astro consumers will
// satisfy the type at the call-site.

import type { z } from 'zod'

export interface PayloadLoaderOptions {
  /** Optional Payload API key. */
  apiKey?: string
  /** Payload base URL, e.g. `https://cms.example.com`. */
  baseUrl: string
  /** Collection slug (e.g. `posts`, `pages`). */
  collection: string
  /** Optional `depth` to expand relationships. */
  depth?: number
  /** Optional `draft` parameter. */
  draft?: boolean
  /** Page size for paginated fetches. Default 100. */
  limit?: number
  /** Payload `where` query. Forwarded as `where[key][op]=value`. */
  where?: Record<string, unknown>
}

interface AstroLoader {
  load: (ctx: AstroLoaderContext) => Promise<void>
  name: string
  schema?: z.ZodTypeAny
}

interface AstroLoaderContext {
  logger?: { info: (msg: string) => void; warn: (msg: string) => void }
  store: {
    clear: () => void
    set: (entry: { data: Record<string, unknown>; id: string; }) => void
  }
}

export function payloadLoader(options: PayloadLoaderOptions): AstroLoader {
  const base = options.baseUrl.replace(/\/$/, '')
  const limit = options.limit ?? 100

  return {
    async load({ logger, store }) {
      store.clear()

      let page = 1
      let totalPages = 1
      let count = 0

      while (page <= totalPages) {
        const params = [`limit=${limit}`, `page=${page}`]
        if (options.depth != null) params.push(`depth=${options.depth}`)
        if (options.draft != null) params.push(`draft=${options.draft}`)
        if (options.where) params.push(...serializeWhere(options.where))

        const url = `${base}/api/${options.collection}?${params.join('&')}`
        const headers: Record<string, string> = { 'content-type': 'application/json' }
        if (options.apiKey) headers.authorization = `users API-Key ${options.apiKey}`

        let res: Response
        try {
          res = await fetch(url, { headers })
        } catch (error) {
          // CI / build-time tolerance: the Payload backend may not be reachable
          // during `astro check` or static generation. Treat as empty rather
          // than failing the type-check.
          logger?.warn(
            `payloadLoader(${options.collection}): network error (${
              (error as Error).message
            }) — yielding 0 entries`,
          )
          return
        }
        if (!res.ok) {
          logger?.warn(
            `payloadLoader(${options.collection}): HTTP ${res.status} on page ${page} — yielding 0 entries`,
          )
          return
        }

        const body = (await res.json()) as {
          docs: Record<string, unknown>[]
          hasNextPage?: boolean
          totalPages?: number
        }

        for (const doc of body.docs) {
          const id = String((doc.id as number | string | undefined) ?? '')
          if (!id) continue
          store.set({ data: doc, id })
          count++
        }

        totalPages = body.totalPages ?? (body.hasNextPage ? page + 1 : page)
        page++
      }

      logger?.info(`payloadLoader(${options.collection}): loaded ${count} entries`)
    },
    name: `payload:${options.collection}`,
  }
}

/**
 * Serialize a `where` object into Payload-style query string segments:
 * `{ status: { equals: 'published' } }` -> `where[status][equals]=published`
 */
function serializeWhere(where: Record<string, unknown>, prefix = 'where'): string[] {
  const out: string[] = []
  for (const [key, val] of Object.entries(where)) {
    const path = `${prefix}[${key}]`
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      out.push(...serializeWhere(val as Record<string, unknown>, path))
    } else {
      out.push(`${path}=${encodeURIComponent(String(val))}`)
    }
  }
  return out
}
