import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '../app.js'
import { loadAppConfig } from '../config.js'

describe('api-gateway / app', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    const config = loadAppConfig({
      NODE_ENV: 'test',
      SERVICE_NAME: 'api-gateway-test',
      SERVICE_VERSION: '0.0.0-test',
      PORT: '0',
    })
    app = await buildApp({ config })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health returns 200 with the service identity', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as Record<string, unknown>
    expect(body['status']).toBe('ok')
    expect(body['service']).toBe('api-gateway-test')
    expect(body['version']).toBe('0.0.0-test')
    expect(body['uptimeSeconds']).toBeTypeOf('number')
    expect(body['checkedAt']).toBeTypeOf('string')
  })

  it('GET /ready returns { ready: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ready: true })
  })

  it('responds with Helmet security headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeDefined()
  })
})
