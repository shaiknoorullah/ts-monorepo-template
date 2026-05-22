import { createLogger } from '@pkg/logger'
import { toError } from '@pkg/types'
import { type Job, Worker } from 'bullmq'

import { loadWorkerConfig } from './config.js'
import { type JobResult, processJob } from './processor.js'

async function bootstrap(): Promise<void> {
  const config = loadWorkerConfig()
  const logger = createLogger({ level: config.LOG_LEVEL, service: config.SERVICE_NAME })

  const worker = new Worker<unknown, JobResult>(
    config.QUEUE_NAME,
    async (job: Job): Promise<JobResult> => processJob(job.data, { logger }),
    {
      concurrency: config.WORKER_CONCURRENCY,
      connection: { url: config.REDIS_URL },
    },
  )

  worker.on('completed', (job) => { logger.info({ jobId: job.id }, 'job completed'); })
  worker.on('failed', (job, err) =>
    { logger.error({ err: toError(err), jobId: job?.id }, 'job failed'); },
  )

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown initiated')
    try {
      await worker.close()
      logger.info('shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error({ err: toError(error) }, 'shutdown failed')
      process.exit(1)
    }
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  logger.info({ concurrency: config.WORKER_CONCURRENCY, queue: config.QUEUE_NAME }, 'worker started')
}

bootstrap().catch((error: unknown) => {
  const err = toError(error)
   
  console.error('FATAL: worker bootstrap failed', err)
  process.exit(1)
})
