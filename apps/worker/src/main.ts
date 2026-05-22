import { createLogger } from '@pkg/logger'
import { toError } from '@pkg/types'
import { type Job, Worker } from 'bullmq'

import { loadWorkerConfig } from './config.js'
import { type JobResult, processJob } from './processor.js'

async function bootstrap(): Promise<void> {
  const config = loadWorkerConfig()
  const logger = createLogger({ service: config.SERVICE_NAME, level: config.LOG_LEVEL })

  const worker = new Worker<unknown, JobResult>(
    config.QUEUE_NAME,
    async (job: Job): Promise<JobResult> => processJob(job.data, { logger }),
    {
      connection: { url: config.REDIS_URL },
      concurrency: config.WORKER_CONCURRENCY,
    },
  )

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'job completed'))
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: toError(err) }, 'job failed'),
  )

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown initiated')
    try {
      await worker.close()
      logger.info('shutdown complete')
      process.exit(0)
    } catch (e) {
      logger.error({ err: toError(e) }, 'shutdown failed')
      process.exit(1)
    }
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  logger.info({ queue: config.QUEUE_NAME, concurrency: config.WORKER_CONCURRENCY }, 'worker started')
}

bootstrap().catch((e: unknown) => {
  const err = toError(e)
  // eslint-disable-next-line no-console
  console.error('FATAL: worker bootstrap failed', err)
  process.exit(1)
})
