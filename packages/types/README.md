# @pkg/types

Shared TypeScript types. The leaf of the workspace dependency graph — this package depends on nothing else in the workspace.

## What lives here

- **Branded primitives** (`TenantId`, `UserId`, `IsoDateTime`) — type-safe wrappers around `string`/`number`.
- **`Result<T, E>`** — explicit success/failure modelling instead of throwing.
- **DTO interfaces** that cross service boundaries (`HealthCheck`, …).

## What does _not_ belong here

- Runtime code with side effects (this package is `"sideEffects": false`).
- Validation logic — use `@pkg/config` (zod) for that.
- Any import from another `@pkg/*` or `@app/*` package.

## Usage

```ts
import { type TenantId, ok, err, toError } from '@pkg/types'

function loadTenant(id: TenantId) {
  try {
    return ok(/* … */)
  } catch (e) {
    return err(toError(e))
  }
}
```

## Status

Stable. Breaking changes require an ADR.
