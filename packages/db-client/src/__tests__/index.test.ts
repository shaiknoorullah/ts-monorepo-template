import { describe, expect, it } from 'vitest'

import { createDbClient } from '../index.js'

describe('@pkg/db-client', () => {
  it('throws when url is empty', () => {
    expect(() => createDbClient({ url: '' })).toThrow(/url.+required/i)
  })

  it('produces a client with the expected interface', () => {
    const db = createDbClient({ url: 'postgres://localhost:5432/test' })
    expect(typeof db.ping).toBe('function')
    expect(typeof db.close).toBe('function')
    expect(typeof db.activeConnections).toBe('function')
  })

  it('reports zero active connections before first use', () => {
    const db = createDbClient({ url: 'postgres://localhost:5432/test' })
    expect(db.activeConnections()).toBe(0)
  })

  it('close() is idempotent before pool creation', async () => {
    const db = createDbClient({ url: 'postgres://localhost:5432/test' })
    await expect(db.close()).resolves.toBeUndefined()
    await expect(db.close()).resolves.toBeUndefined()
  })
})
