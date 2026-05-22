// packages/cms-client/src/payload.ts
//
// Minimal Payload CMS REST client. The Astro Content Layer loader builds on
// top of this — see ./astro-loader.ts (TODO).

import type { z } from 'zod'

export interface CollectionResponse<T> {
  docs: T[]
  hasNextPage: boolean
  page: number
  totalDocs: number
}

export interface PayloadConfig {
  apiKey?: string
  baseUrl: string
}

export function createPayloadClient(cfg: PayloadConfig) {
  const base = cfg.baseUrl.replace(/\/$/, '')

  async function fetchJSON<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (cfg.apiKey) headers.authorization = `users API-Key ${cfg.apiKey}`
    const res = await fetch(`${base}${path}`, { headers })
    if (!res.ok) throw new Error(`Payload fetch failed: ${res.status}`)
    return (await res.json()) as T
  }

  return {
    async getCollection<T>(slug: string, schema: z.ZodType<T>): Promise<CollectionResponse<T>> {
      const raw = await fetchJSON<CollectionResponse<unknown>>(`/api/${slug}`)
      return {
        ...raw,
        docs: raw.docs.map((d) => schema.parse(d)),
      }
    },
    async getOne<T>(slug: string, id: string, schema: z.ZodType<T>): Promise<T> {
      const raw = await fetchJSON<unknown>(`/api/${slug}/${id}`)
      return schema.parse(raw)
    },
  }
}
