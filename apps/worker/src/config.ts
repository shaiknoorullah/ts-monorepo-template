import { commonSchemas, loadConfig, z } from '@pkg/config'

const schema = z.object({
  LOG_LEVEL: commonSchemas.LOG_LEVEL,
  NODE_ENV: commonSchemas.NODE_ENV,
  QUEUE_NAME: z.string().default('default'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  SERVICE_NAME: z.string().default('worker'),
  SERVICE_VERSION: z.string().default('0.0.0'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(1000).default(8),
})

export type WorkerConfig = z.infer<typeof schema>

export function loadWorkerConfig(source?: NodeJS.ProcessEnv): WorkerConfig {
  return loadConfig(schema, source)
}
