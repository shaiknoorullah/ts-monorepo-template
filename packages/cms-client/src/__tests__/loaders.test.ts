// packages/cms-client/src/__tests__/loaders.test.ts

import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { payloadLoader } from '../loaders/payload'
import { decapLoader } from '../loaders/decap'

function makeStore() {
  const entries = new Map<string, { id: string; data: Record<string, unknown>; body?: string }>()
  return {
    entries,
    store: {
      set: (e: { id: string; data: Record<string, unknown>; body?: string }) => {
        entries.set(e.id, e)
      },
      clear: () => entries.clear(),
    },
    logger: { info: () => {}, warn: () => {} },
  }
}

describe('payloadLoader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('paginates through the collection and serializes the where clause', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url)
        const u = new URL(url)
        const page = Number(u.searchParams.get('page') ?? '1')
        const body =
          page === 1
            ? { docs: [{ id: 'a', title: 'A' }], totalPages: 2 }
            : { docs: [{ id: 'b', title: 'B' }], totalPages: 2 }
        return new Response(JSON.stringify(body), { status: 200 })
      }),
    )

    const ctx = makeStore()
    const loader = payloadLoader({
      baseUrl: 'https://cms.example.com',
      collection: 'posts',
      where: { status: { equals: 'published' } },
    })

    await loader.load(ctx)

    expect(calls).toHaveLength(2)
    expect(calls[0]).toContain('where%5Bstatus%5D%5Bequals%5D=published')
    expect(ctx.entries.size).toBe(2)
    expect(ctx.entries.get('a')?.data.title).toBe('A')
  })

  it('returns an empty entry set on non-2xx with a logged warning', async () => {
    // The loader is intentionally fault-tolerant: a CMS hiccup must not break
    // `astro build` / `astro check`. Verify it (a) does NOT throw, (b) leaves
    // the store empty, and (c) emits a `logger.warn` with the HTTP code.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 500 })),
    )
    const ctx = makeStore()
    const warnSpy = vi.spyOn(ctx.logger, 'warn')
    const loader = payloadLoader({ baseUrl: 'https://x', collection: 'posts' })
    await expect(loader.load(ctx)).resolves.toBeUndefined()
    expect(ctx.entries.size).toBe(0)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('HTTP 500'))
  })
})

describe('decapLoader', () => {
  it('reads front-matter from MD files in a directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'decap-'))
    mkdirSync(join(dir, 'posts'), { recursive: true })
    writeFileSync(
      join(dir, 'posts', 'hello.md'),
      '---\ntitle: Hello\ndate: 2026-01-01\n---\n\n# Hi',
    )
    writeFileSync(
      join(dir, 'posts', 'second.md'),
      '---\ntitle: Second\ndate: 2026-01-02\n---\n\nBody',
    )

    const ctx = makeStore()
    const loader = decapLoader({ pattern: 'posts/**/*.md', base: dir })
    await loader.load(ctx)

    expect(ctx.entries.size).toBe(2)
    const hello = ctx.entries.get('hello')
    expect(hello?.data.title).toBe('Hello')
    expect(hello?.body).toContain('Hi')
  })
})
