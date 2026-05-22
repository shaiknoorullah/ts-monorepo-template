import pino, { type LoggerOptions, type Logger as PinoLogger } from 'pino'

/** Options accepted by {@link createLogger}. */
export interface CreateLoggerOptions {
  /** Additional base bindings merged into every log line. */
  readonly bindings?: Readonly<Record<string, unknown>>
  /** Log level. Defaults to `LOG_LEVEL` env var, then `info`. */
  readonly level?: LoggerOptions['level']
  /** Pretty-print in dev. Defaults to `NODE_ENV !== 'production'`. */
  readonly pretty?: boolean
  /** Service name — emitted as `service` on every log line. Required. */
  readonly service: string
}

/** The logger interface used everywhere in the monorepo. */
export type Logger = PinoLogger

/**
 * Create a child logger with additional bindings merged in.
 * Thin wrapper that exists so callers don't need to import pino types directly.
 */
export function childLogger(parent: Logger, bindings: Record<string, unknown>): Logger {
  return parent.child(bindings)
}

/**
 * Create a configured pino logger.
 *
 * - Adds `service` and `pid` to every log line.
 * - Switches to `pino-pretty` transport in non-production for human-readable output.
 * - In production, emits NDJSON to stdout — meant to be picked up by the OTel collector.
 *
 * @example
 * ```ts
 * import { createLogger } from '@pkg/logger'
 *
 * const logger = createLogger({ service: 'api-gateway' })
 * logger.info({ userId: 'u_123' }, 'request handled')
 * ```
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const level = options.level ?? process.env.LOG_LEVEL ?? 'info'
  const pretty = options.pretty ?? process.env.NODE_ENV !== 'production'

  const baseOptions: LoggerOptions = {
    base: {
      pid: process.pid,
      service: options.service,
      ...options.bindings,
    },
    level,
    redact: {
      censor: '[REDACTED]',
      paths: [
        'password',
        '*.password',
        'token',
        '*.token',
        'authorization',
        '*.authorization',
        'cookie',
        '*.cookie',
      ],
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (pretty) {
    return pino({
      ...baseOptions,
      transport: {
        options: { colorize: true, singleLine: false, translateTime: 'SYS:HH:MM:ss.l' },
        target: 'pino-pretty',
      },
    })
  }

  return pino(baseOptions)
}
