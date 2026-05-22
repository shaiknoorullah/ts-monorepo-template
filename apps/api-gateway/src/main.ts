import { createLogger } from '@pkg/logger'
import { toError } from '@pkg/types'

import { buildApp } from './app.js'
import { loadAppConfig } from './config.js'

async function bootstrap(): Promise<void> {
  const config = loadAppConfig()
  const logger = createLogger({ service: config.SERVICE_NAME, level: config.LOG_LEVEL })

  const app = await buildApp({ config, logger })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown initiated')
    try {
      await app.close()
      logger.info('shutdown complete')
      process.exit(0)
    } catch (e) {
      logger.error({ err: toError(e) }, 'shutdown failed')
      process.exit(1)
    }
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen({ port: config.PORT, host: config.HOST })
  logger.info({ port: config.PORT, host: config.HOST }, 'api-gateway listening')
}

bootstrap().catch((e: unknown) => {
  const err = toError(e)
  // eslint-disable-next-line no-console
  console.error('FATAL: bootstrap failed', err)
  process.exit(1)
})
