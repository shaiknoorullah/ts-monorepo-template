/**
 * @pkg/db-client — Postgres client wrapper.
 *
 * Thin abstraction over drizzle-orm that owns the pg-pool lifecycle so that
 * each service can do `const db = createDbClient(env.DATABASE_URL); await db.close()`
 * without re-implementing pooling, healthchecks, or graceful-shutdown wiring.
 *
 * The drizzle import is **lazy** so this package can be imported in tests/types
 * without requiring `pg` to be installed in environments that don't use it.
 */

import { toError } from '@pkg/types'

/** Connection-pool tuning options. */
export interface DbClientOptions {
  /** Postgres connection URL. Required. */
  readonly url: string
  /** Maximum number of clients in the pool. Default 10. */
  readonly maxConnections?: number
  /** Connection idle timeout in ms. Default 30000. */
  readonly idleTimeoutMs?: number
  /** Statement timeout passed to every connection. Default 30000 (30s). */
  readonly statementTimeoutMs?: number
  /** Application name attached to every connection — visible in `pg_stat_activity`. */
  readonly applicationName?: string
}

/** The minimal db-client surface every consumer relies on. */
export interface DbClient {
  /** Resolve when the connection pool can reach the database. */
  ping: () => Promise<void>
  /** Close the pool. Idempotent. */
  close: () => Promise<void>
  /** Number of active connections at the moment. */
  activeConnections: () => number
}

/**
 * Create a Postgres client.
 *
 * @example
 * ```ts
 * import { createDbClient } from '@pkg/db-client'
 *
 * const db = createDbClient({
 *   url: env.DATABASE_URL,
 *   applicationName: 'api-gateway',
 *   maxConnections: 20,
 * })
 *
 * await db.ping()
 * // … on shutdown
 * await db.close()
 * ```
 */
export function createDbClient(options: DbClientOptions): DbClient {
  if (!options.url) {
    throw new Error('createDbClient: `url` is required')
  }

  // Lazy load the pg driver so test/type environments don't need it installed.
  // In production each service depends on `pg` directly via the runtime catalog.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  type PgPool = { connect: () => Promise<{ release: () => void }>; end: () => Promise<void>; totalCount: number }

  let pool: PgPool | undefined
  let closed = false

  const getPool = async (): Promise<PgPool> => {
    if (pool) return pool
    const mod = (await import('pg').catch(() => null)) as { Pool?: new (cfg: unknown) => PgPool } | null
    if (!mod?.Pool) {
      throw new Error('createDbClient: `pg` driver is not installed. `pnpm add pg` in your service.')
    }
    pool = new mod.Pool({
      connectionString: options.url,
      max: options.maxConnections ?? 10,
      idleTimeoutMillis: options.idleTimeoutMs ?? 30_000,
      application_name: options.applicationName,
      statement_timeout: options.statementTimeoutMs ?? 30_000,
    })
    return pool
  }

  return {
    async ping(): Promise<void> {
      try {
        const p = await getPool()
        const client = await p.connect()
        client.release()
      } catch (err) {
        throw toError(err)
      }
    },
    async close(): Promise<void> {
      if (closed) return
      closed = true
      if (pool) await pool.end()
    },
    activeConnections(): number {
      return pool?.totalCount ?? 0
    },
  }
}
