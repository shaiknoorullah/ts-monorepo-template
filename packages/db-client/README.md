# @pkg/db-client

Postgres client wrapper around drizzle-orm with first-class pool lifecycle management.

## Why this exists

Every service needs (a) a connection pool, (b) a healthcheck, (c) a graceful shutdown hook. Copying this boilerplate per service drifts. This package centralises it.

## Usage

```ts
import { createDbClient } from '@pkg/db-client'

const db = createDbClient({
  url: env.DATABASE_URL,
  applicationName: 'api-gateway',
  maxConnections: 20,
})

await db.ping()        // healthcheck
// … later, on shutdown
await db.close()
```

## Dependency note

`pg` is loaded **lazily** so this package is usable in test / type-only environments. Each consumer service must install `pg` in its own `package.json`.

## Status

Beta. The drizzle-orm surface is intentionally not re-exported yet — pin drizzle in the consumer's `package.json` via the `catalog:runtime` reference.
