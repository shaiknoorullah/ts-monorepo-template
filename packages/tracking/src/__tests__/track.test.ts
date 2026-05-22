import { describe, expect, it, vi } from 'vitest'
import { useConsent } from '@pkg/consent'
import { track } from '../track'

describe('track', () => {
  it('does not fire without analytics consent', () => {
    useConsent.getState().setGranted(['necessary'])
    const umami = { track: vi.fn() }
    // @ts-expect-error injecting test global
    globalThis.window = { umami }
    track('test_event')
    expect(umami.track).not.toHaveBeenCalled()
  })

  it('fires when analytics consent is granted', () => {
    useConsent.getState().setGranted(['necessary', 'analytics'])
    const umami = { track: vi.fn() }
    // @ts-expect-error injecting test global
    globalThis.window = { umami }
    track('test_event', { x: 1 })
    expect(umami.track).toHaveBeenCalledWith('test_event', { x: 1 })
  })
})
