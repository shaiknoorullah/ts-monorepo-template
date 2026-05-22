import { commonSchemas, loadConfig, z } from '@pkg/config'

const schema = z.object({
  NODE_ENV: commonSchemas.NODE_ENV,
  LOG_LEVEL: commonSchemas.LOG_LEVEL,
  SERVICE_NAME: z.string().default('worker'),
  SERVICE_VERSION: z.string().default('0.0.0'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  QUEUE_NAME: z.string().default('default'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(1000).default(8),
})

export type WorkerConfig = z.infer<typeof schema>

export function loadWorkerConfig(source?: NodeJS.ProcessEnv): WorkerConfig {
  return loadConfig(schema, source)
}
