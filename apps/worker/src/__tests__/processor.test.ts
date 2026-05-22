import { createLogger } from '@pkg/logger'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { processJob } from '../processor.js'

const logger = createLogger({ service: 'worker-test', pretty: false, level: 'silent' })

describe('worker / processJob', () => {
  it('returns ok=true and echoes the job type', async () => {
    const result = await processJob({ type: 'send-email', payload: { to: 'a@b.c' } }, { logger })
    expect(result.ok).toBe(true)
    expect(result.handled).toBe('send-email')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('throws ZodError when the payload is malformed', async () => {
    await expect(processJob({ payload: 'no-type' }, { logger })).rejects.toBeInstanceOf(ZodError)
  })
})
