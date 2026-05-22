// config/schema.ts
//
// Zod schema for the merged configuration. This is THE source of truth.
// All runtime config — loaded via c12 from base.yaml + <env>.yaml + tenant overrides —
// passes through `AppConfigSchema.parse(...)` before any service sees it.
//
// TypeScript types are derived with `z.infer<typeof AppConfigSchema>`; do not
// hand-write parallel interfaces.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const PortSchema = z.coerce.number().int().min(1).max(65_535)

const UrlSchema = z.string().url()

const NonEmpty = z.string().min(1)

/**
 * Pointer to a secret stored in an external secret manager (ESO/Vault/KV).
 * The literal value is NEVER committed to YAML. At load time, the loader
 * substitutes the resolved secret based on `provider` + `path`.
 *
 *   secrets:
 *     database_password:
 *       provider: vault
 *       path: secret/data/dev/db#password
 */
const SecretRefSchema = z.object({
  provider: z.enum(['vault', 'eso', 'azure-kv', 'aws-sm', 'env']),
  path: NonEmpty,
  /** Optional fallback for local development. Never used when NODE_ENV=production. */
  devFallback: z.string().optional(),
})
export type SecretRef = z.infer<typeof SecretRefSchema>

// ---------------------------------------------------------------------------
// Domain blocks
// ---------------------------------------------------------------------------

export const AppIdentitySchema = z.object({
  name: NonEmpty,
  version: NonEmpty.default('0.0.0'),
  env: z.enum(['dev', 'test', 'staging', 'prod']),
  port: PortSchema.default(3000),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
})

export const DatabaseSchema = z.object({
  host: NonEmpty,
  port: PortSchema.default(5432),
  user: NonEmpty,
  /** Secret pointer or raw value (raw only allowed in dev/test). */
  password: z.union([SecretRefSchema, NonEmpty]).optional(),
  database: NonEmpty,
  schema: NonEmpty.default('public'),
  ssl: z.boolean().default(false),
  poolMax: z.coerce.number().int().min(1).default(10),
})

export const RedisSchema = z.object({
  host: NonEmpty,
  port: PortSchema.default(6379),
  cluster: z.boolean().default(false),
  /** When cluster=true, list seed nodes here. */
  nodes: z.array(z.object({ host: NonEmpty, port: PortSchema })).default([]),
  password: z.union([SecretRefSchema, NonEmpty]).optional(),
})

export const KafkaSchema = z.object({
  bootstrapServers: z.array(NonEmpty).min(1),
  clientId: NonEmpty.default('app'),
  security: z
    .object({
      protocol: z.enum(['PLAINTEXT', 'SASL_PLAINTEXT', 'SASL_SSL', 'SSL']).default('PLAINTEXT'),
      saslMechanism: z.enum(['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512']).optional(),
      saslUsername: z.string().optional(),
      saslPassword: z.union([SecretRefSchema, z.string()]).optional(),
    })
    .default({ protocol: 'PLAINTEXT' }),
  schemaRegistry: z
    .object({
      url: UrlSchema,
      auth: z
        .object({
          username: z.string(),
          password: z.union([SecretRefSchema, z.string()]),
        })
        .optional(),
    })
    .optional(),
})

export const TemporalSchema = z.object({
  address: NonEmpty.default('localhost:7233'),
  namespace: NonEmpty.default('default'),
  taskQueue: NonEmpty.default('default'),
  tls: z.boolean().default(false),
})

export const ObservabilitySchema = z.object({
  otel: z
    .object({
      enabled: z.boolean().default(true),
      exporter: z.enum(['otlp-http', 'otlp-grpc', 'none']).default('otlp-grpc'),
      endpoint: UrlSchema.optional(),
      serviceName: z.string().optional(),
    })
    .default({ enabled: true, exporter: 'otlp-grpc' }),
  signoz: z
    .object({
      endpoint: UrlSchema.optional(),
      ingestionKey: z.union([SecretRefSchema, z.string()]).optional(),
    })
    .optional(),
})

export const AuthSchema = z.object({
  /** OIDC issuer URL (Keycloak realm, Ory Hydra, Auth0, etc.). */
  issuer: UrlSchema,
  audience: NonEmpty,
  /** Pre-fetched JWKS URL — preferred over discovery for prod. */
  jwksUri: UrlSchema.optional(),
  clientId: NonEmpty.optional(),
  clientSecret: z.union([SecretRefSchema, z.string()]).optional(),
})

export const TenancySchema = z.object({
  strategy: z.enum(['schema', 'row', 'database', 'none']).default('row'),
  defaultTenant: NonEmpty.default('public'),
  isolation: z.enum(['strict', 'permissive']).default('strict'),
})

export const FeaturesSchema = z.object({
  unleash: z
    .object({
      url: UrlSchema,
      apiKey: z.union([SecretRefSchema, z.string()]),
      appName: NonEmpty.default('app'),
      environment: NonEmpty.default('development'),
    })
    .optional(),
})

export const SaasSchema = z.object({
  lago: z.object({ apiUrl: UrlSchema.optional(), frontUrl: UrlSchema.optional() }).optional(),
  umami: z.object({ endpoint: UrlSchema.optional() }).optional(),
  meilisearch: z
    .object({
      host: UrlSchema,
      apiKey: z.union([SecretRefSchema, z.string()]).optional(),
    })
    .optional(),
  chatwoot: z.object({ frontendUrl: UrlSchema.optional() }).optional(),
  keycloak: z.object({ url: UrlSchema, realm: NonEmpty.default('master') }).optional(),
  uptimeKuma: z.object({ url: UrlSchema.optional() }).optional(),
})

export const MailerSchema = z.object({
  host: NonEmpty,
  port: PortSchema.default(587),
  username: z.string().optional(),
  password: z.union([SecretRefSchema, z.string()]).optional(),
  fromAddress: z.string().email().optional(),
  secure: z.boolean().default(false),
})

/**
 * Free-form pointers into the secret backend. The keys here are arbitrary
 * labels referenced from other parts of the config (or from app code).
 *
 *   secrets:
 *     stripe_api_key:
 *       provider: vault
 *       path: secret/data/prod/stripe#api_key
 */
export const SecretsBagSchema = z.record(z.string(), SecretRefSchema).default({})

// ---------------------------------------------------------------------------
// Root config
// ---------------------------------------------------------------------------

export const AppConfigSchema = z.object({
  app: AppIdentitySchema,
  database: DatabaseSchema.optional(),
  redis: RedisSchema.optional(),
  kafka: KafkaSchema.optional(),
  temporal: TemporalSchema.optional(),
  observability: ObservabilitySchema.optional(),
  auth: AuthSchema.optional(),
  tenancy: TenancySchema.optional(),
  features: FeaturesSchema.optional(),
  saas: SaasSchema.optional(),
  mailer: MailerSchema.optional(),
  secrets: SecretsBagSchema,
})

export type AppConfig = z.infer<typeof AppConfigSchema>

/**
 * Helper for callers: parse + return typed config, throwing a friendly error.
 */
export function parseConfig(input: unknown): AppConfig {
  const result = AppConfigSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.map(String).join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Config validation failed:\n${issues}`)
  }
  return result.data
}
