import { createLogger } from '@pkg/logger'
import { toError } from '@pkg/types'

import { buildApp } from './app.js'
import { loadAppConfig } from './config.js'

async function bootstrap(): Promise<void> {
  const config = loadAppConfig()
  const logger = createLogger({ level: config.LOG_LEVEL, service: config.SERVICE_NAME })

  const app = await buildApp({ config, logger })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown initiated')
    try {
      await app.close()
      logger.info('shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error({ err: toError(error) }, 'shutdown failed')
      process.exit(1)
    }
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen({ host: config.HOST, port: config.PORT })
  logger.info({ host: config.HOST, port: config.PORT }, 'api-gateway listening')
}

bootstrap().catch((error: unknown) => {
  const err = toError(error)

  console.error('FATAL: bootstrap failed', err)
  process.exit(1)
})
