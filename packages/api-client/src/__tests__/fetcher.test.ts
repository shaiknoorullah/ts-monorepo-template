import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createApiClient } from '../fetcher'

describe('createApiClient', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response('{"ok":true}', { status: 200 })) as never
  })

  it('attaches auth + tenant headers', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      getAuthToken: () => 'tok',
      getTenantSlug: () => 'acme',
    })
    await client.get('/me')
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const init = call[1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer tok')
    expect(headers['x-tenant']).toBe('acme')
  })
})
