# @pkg/config

Type-safe environment-variable loader with zod validation. Fail fast at boot, never at request time.

## Usage

```ts
import { loadConfig, z, commonSchemas } from '@pkg/config'

const schema = z.object({
  ...commonSchemas,                                      // NODE_ENV, LOG_LEVEL
  PORT: commonSchemas.PORT.default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
})

export const env = loadConfig(schema)
// env is fully typed and validated.
```

## Behaviour

- `loadConfig(schema, source = process.env)` — parses and validates.
- On failure, throws `ConfigValidationError` with a list of `{ path, message }` issues and a multi-line message.
- Defaults from the schema are applied — undefined keys are *not* fatal if a default exists.
- Coercion (`z.coerce.number()`, etc.) is the recommended pattern since env vars are always strings.

## Status

Stable.
