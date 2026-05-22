import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { createLogger, type Logger } from '@pkg/logger'
import { type HealthCheck, toIsoDateTime } from '@pkg/types'
import Fastify, { type FastifyInstance } from 'fastify'

import { type AppConfig } from './config.js'

export interface BuildAppOptions {
  readonly config: AppConfig
  readonly logger?: Logger
}

/**
 * Build the Fastify instance.
 *
 * Exposed separately from `main.ts` so tests can spin one up without
 * binding a TCP port (`await app.inject({ method: 'GET', url: '/health' })`).
 */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const logger = options.logger ?? createLogger({ service: options.config.SERVICE_NAME })
  const startedAt = Date.now()

  const app = Fastify({
    bodyLimit: 1 * 1024 * 1024,
    disableRequestLogging: false,
    loggerInstance: logger,
    trustProxy: true,
  })

  await app.register(helmet, { global: true })
  await app.register(cors, { credentials: true, origin: options.config.CORS_ORIGIN })

  app.get(
    '/health',
    async (): Promise<HealthCheck> => ({
      checkedAt: toIsoDateTime(new Date()),
      service: options.config.SERVICE_NAME,
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      version: options.config.SERVICE_VERSION,
    }),
  )

  app.get('/ready', async (_req, reply): Promise<{ ready: true }> => {
    reply.statusCode = 200
    return { ready: true }
  })

  return app as unknown as FastifyInstance
}
