import { z, type ZodType } from 'zod'

/**
 * Thrown when env-var validation fails. The message lists every offending key + reason.
 */
export class ConfigValidationError extends Error {
  public readonly code = 'E_CONFIG_VALIDATION' as const
  public override readonly name = 'ConfigValidationError'

  public constructor(
    message: string,
    public readonly issues: readonly { message: string; path: string; }[],
  ) {
    super(message)
  }
}

/**
 * Load and validate environment variables against a zod schema.
 *
 * @example
 * ```ts
 * import { z } from 'zod'
 * import { loadConfig } from '@pkg/config'
 *
 * const env = loadConfig(z.object({
 *   PORT: z.coerce.number().int().min(1).max(65535).default(3000),
 *   DATABASE_URL: z.string().url(),
 *   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
 * }))
 *
 * // env is fully typed: { PORT: number; DATABASE_URL: string; NODE_ENV: 'development' | … }
 * ```
 *
 * @throws ConfigValidationError when one or more keys fail validation.
 */
export function loadConfig<TSchema extends ZodType>(
  schema: TSchema,
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): z.output<TSchema> {
  const result = schema.safeParse(source)
  if (result.success) return result.data

  const issues = result.error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.join('.'),
  }))
  const summary = issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n')
  throw new ConfigValidationError(
    `Invalid environment variables:\n${summary}\nFix your .env or deployment manifest.`,
    issues,
  )
}

/** Common base schema fragments callers can compose. */
export const commonSchemas = {
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535),
  SERVICE_NAME: z.string().min(1),
} as const

// Re-export zod so consumers don't need a separate dependency.


export {z} from 'zod'