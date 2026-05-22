import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createPayloadClient } from '../payload'

describe('createPayloadClient', () => {
  it('parses collection responses with the provided schema', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          docs: [{ id: '1', title: 'Hello' }],
          totalDocs: 1,
          page: 1,
          hasNextPage: false,
        }),
        { status: 200 },
      ),
    ) as never

    const client = createPayloadClient({ baseUrl: 'https://cms.example.com' })
    const res = await client.getCollection(
      'posts',
      z.object({ id: z.string(), title: z.string() }),
    )
    expect(res.docs).toHaveLength(1)
    expect(res.docs[0]!.title).toBe('Hello')
  })
})
