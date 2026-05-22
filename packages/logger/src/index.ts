import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino'

/** The logger interface used everywhere in the monorepo. */
export type Logger = PinoLogger

/** Options accepted by {@link createLogger}. */
export interface CreateLoggerOptions {
  /** Service name — emitted as `service` on every log line. Required. */
  readonly service: string
  /** Log level. Defaults to `LOG_LEVEL` env var, then `info`. */
  readonly level?: LoggerOptions['level']
  /** Pretty-print in dev. Defaults to `NODE_ENV !== 'production'`. */
  readonly pretty?: boolean
  /** Additional base bindings merged into every log line. */
  readonly bindings?: Readonly<Record<string, unknown>>
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
  const level = options.level ?? process.env['LOG_LEVEL'] ?? 'info'
  const pretty = options.pretty ?? process.env['NODE_ENV'] !== 'production'

  const baseOptions: LoggerOptions = {
    level,
    base: {
      service: options.service,
      pid: process.pid,
      ...options.bindings,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
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
      censor: '[REDACTED]',
    },
  }

  if (pretty) {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: false, translateTime: 'SYS:HH:MM:ss.l' },
      },
    })
  }

  return pino(baseOptions)
}

/**
 * Create a child logger with additional bindings merged in.
 * Thin wrapper that exists so callers don't need to import pino types directly.
 */
export function childLogger(parent: Logger, bindings: Record<string, unknown>): Logger {
  return parent.child(bindings)
}
