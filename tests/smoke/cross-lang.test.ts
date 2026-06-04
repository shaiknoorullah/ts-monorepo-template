import { describe, it, expect } from 'vitest'
import { endpoints, fetchPodLogs } from './cross-lang.fixtures'

const SMOKE = process.env.SMOKE === '1'

describe.skipIf(!SMOKE)('cross-lang parity (live p-solo k3d)', () => {
  for (const ep of endpoints) {
    it(`${ep.name} create + read round-trip`, async () => {
      const create = await fetch(`${ep.http}/v1/users`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          email: 'a@b.c',
          displayName: 'Test',
        }),
      })
      expect(create.status).toBeGreaterThanOrEqual(200)
      expect(create.status).toBeLessThan(300)
      const created = await create.json()
      expect(typeof created.id).toBe('string')
      expect(created.id).toMatch(/^[0-9a-f-]{36}$/i)

      const get = await fetch(`${ep.http}/v1/users/${created.id}`)
      expect(get.status).toBe(200)
      const fetched = await get.json()
      expect(fetched.id).toBe(created.id)
    })

    it(`${ep.name} emits JSON logs with trace_id`, async () => {
      const logs = await fetchPodLogs(ep.name)
      const parsed = logs
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l)
          } catch {
            return null
          }
        })
        .filter((l): l is Record<string, unknown> => l !== null)
      expect(parsed.length).toBeGreaterThan(0)
      const withTrace = parsed.filter(
        (l) => 'trace_id' in l && ('service.name' in l || 'service_name' in l),
      )
      expect(withTrace.length).toBeGreaterThan(0)
    })

    it(`${ep.name} exposes comparable Prometheus metrics`, async () => {
      const metrics = await fetch(`${ep.metrics}/metrics`).then((r) => r.text())
      expect(metrics).toMatch(/^http_requests_total\b/m)
      expect(metrics).toMatch(/^http_request_duration_seconds_bucket\b/m)
    })
  }
})

describe('cross-lang parity (offline shape check)', () => {
  it('declares three endpoints with identical port shape', () => {
    expect(endpoints).toHaveLength(3)
    for (const ep of endpoints) {
      expect(ep.http).toMatch(/:8080$/)
      expect(ep.metrics).toMatch(/:9090$/)
      expect(ep.grpc).toMatch(/:9000$/)
    }
  })
})
