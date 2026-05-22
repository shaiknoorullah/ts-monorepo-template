import { describe, expect, it } from 'vitest'

import { childLogger, createLogger } from '../index.js'

describe('@pkg/logger', () => {
  it('creates a logger that exposes the standard methods', () => {
    const logger = createLogger({ service: 'test', pretty: false })
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('respects the explicit level option', () => {
    const logger = createLogger({ service: 'test', level: 'warn', pretty: false })
    expect(logger.level).toBe('warn')
  })

  it('attaches service to base bindings', () => {
    const logger = createLogger({ service: 'api-gateway', pretty: false })
    // pino stores bindings on the symbol-keyed chindings property; inspect through bindings()
    expect(logger.bindings()).toMatchObject({ service: 'api-gateway' })
  })

  it('childLogger merges additional bindings', () => {
    const parent = createLogger({ service: 'test', pretty: false })
    const child = childLogger(parent, { requestId: 'r-123' })
    expect(child.bindings()).toMatchObject({ service: 'test', requestId: 'r-123' })
  })
})
