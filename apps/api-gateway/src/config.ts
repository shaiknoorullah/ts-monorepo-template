import { commonSchemas, loadConfig, z } from '@pkg/config'

const schema = z.object({
  NODE_ENV: commonSchemas.NODE_ENV,
  LOG_LEVEL: commonSchemas.LOG_LEVEL,
  SERVICE_NAME: z.string().default('api-gateway'),
  SERVICE_VERSION: z.string().default('0.0.0'),
  PORT: commonSchemas.PORT.default(3000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((s) => (s === '*' ? true : s.split(',').map((v) => v.trim()))),
})

export type AppConfig = z.infer<typeof schema>

export function loadAppConfig(source?: NodeJS.ProcessEnv): AppConfig {
  return loadConfig(schema, source)
}
