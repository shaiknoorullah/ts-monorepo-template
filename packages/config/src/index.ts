import { z, type ZodType, type ZodTypeDef } from 'zod'

/**
 * Thrown when env-var validation fails. The message lists every offending key + reason.
 */
export class ConfigValidationError extends Error {
  public override readonly name = 'ConfigValidationError'
  public readonly code = 'E_CONFIG_VALIDATION' as const

  public constructor(
    message: string,
    public readonly issues: readonly { path: string; message: string }[],
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
export function loadConfig<Output, Def extends ZodTypeDef, Input>(
  schema: ZodType<Output, Def, Input>,
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Output {
  const result = schema.safeParse(source)
  if (result.success) return result.data

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
  const summary = issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n')
  throw new ConfigValidationError(
    `Invalid environment variables:\n${summary}\nFix your .env or deployment manifest.`,
    issues,
  )
}

/** Common base schema fragments callers can compose. */
export const commonSchemas = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().int().min(1).max(65535),
  SERVICE_NAME: z.string().min(1),
} as const

// Re-export zod so consumers don't need a separate dependency.
export { z }
