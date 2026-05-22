/**
 * Test helpers used across the workspace. Never published.
 */

import { type IsoDateTime, toIsoDateTime } from '@pkg/types'

/** A deterministic IsoDateTime for snapshot tests. */
export const FROZEN_TIME: IsoDateTime = toIsoDateTime(new Date('2026-01-01T00:00:00.000Z'))

/** Generate a pseudo-random but deterministic string of n chars (for fixture IDs). */
export function fixtureId(prefix: string, n = 8): string {
  let out = ''
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < n; i++) {
    out += chars[Math.floor(Math.random() * chars.length)] ?? '0'
  }
  return `${prefix}_${out}`
}

/**
 * Wait until `predicate` returns truthy or the timeout elapses.
 *
 * Useful for tests that need to wait on an event-loop-driven side effect
 * without resorting to brittle `setTimeout` calls.
 */
export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  options: { intervalMs?: number; timeoutMs?: number; } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 2000
  const intervalMs = options.intervalMs ?? 10
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`waitFor: predicate did not resolve within ${String(timeoutMs)}ms`)
}
