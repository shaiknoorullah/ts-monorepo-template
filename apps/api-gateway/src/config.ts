import { commonSchemas, loadConfig, z } from '@pkg/config'

const schema = z.object({
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((s) => (s === '*' ? true : s.split(',').map((v) => v.trim()))),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: commonSchemas.LOG_LEVEL,
  NODE_ENV: commonSchemas.NODE_ENV,
  PORT: commonSchemas.PORT.default(3000),
  SERVICE_NAME: z.string().default('api-gateway'),
  SERVICE_VERSION: z.string().default('0.0.0'),
})

export type AppConfig = z.infer<typeof schema>

export function loadAppConfig(source?: NodeJS.ProcessEnv): AppConfig {
  return loadConfig(schema, source)
}
