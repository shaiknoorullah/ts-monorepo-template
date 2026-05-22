/**
 * @pkg/types — shared types for every service and package in the monorepo.
 *
 * Convention: every type exported here is a **leaf** type — it must not import
 * from any other workspace package. This is the type-level equivalent of
 * `packages/types` sitting at the bottom of the dependency graph.
 */

/** Branded primitive. Use this instead of bare strings/numbers for domain IDs. */
export type Brand<T, K extends string> = T & { readonly __brand: K }

/** The shape of a healthcheck response from any service. */
export interface HealthCheck {
  readonly checkedAt: IsoDateTime
  readonly service: string
  readonly status: 'degraded' | 'down' | 'ok'
  readonly uptimeSeconds: number
  readonly version: string
}

/** A timestamp encoded as an ISO-8601 string in UTC. */
export type IsoDateTime = Brand<string, 'IsoDateTime'>

/** A Result type — `ok` carries data, `err` carries a typed error. */
export type Result<T, E = Error> = { error: E; ok: false; } | { ok: true; value: T }

/** Stable, opaque identifier for a tenant. */
export type TenantId = Brand<string, 'TenantId'>

/** Stable, opaque identifier for a user. */
export type UserId = Brand<string, 'UserId'>

/** Construct a failed Result. */
export function err<E>(error: E): Result<never, E> {
  return { error, ok: false }
}

/** Construct a successful Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/** Helper: convert `unknown` (catch block) to an `Error`. */
export function toError(value: unknown): Error {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  try {
    return new Error(JSON.stringify(value))
  } catch {
    return new Error('Unknown error')
  }
}

/**
 * Convert a Date to a strongly-typed ISO-8601 string.
 *
 * @example
 * ```ts
 * const ts = toIsoDateTime(new Date())
 * // ts: IsoDateTime
 * ```
 */
export function toIsoDateTime(date: Date): IsoDateTime {
  return date.toISOString() as IsoDateTime
}
