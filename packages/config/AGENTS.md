# AGENTS.md — `@pkg/config`

## What this package is

Type-safe env-var loader. Wraps zod with a single entry point — `loadConfig(schema, source?)` — that throws a structured error if validation fails.

## Invariants

1. **Validation runs at boot, never at request time.** All `loadConfig` calls happen at module top-level / in service bootstrap.
2. **No I/O.** This package reads from `process.env` (or an injected source); it never reads files, hits DNS, etc.
3. **No defaults that mask security holes.** Auth tokens, DB URLs — never default. The schema must require them.
4. **Errors are descriptive.** `ConfigValidationError.issues` is the contract every caller depends on.

## Commands

```bash
pnpm -F @pkg/config build
pnpm -F @pkg/config test
pnpm -F @pkg/config type-check
```

## Common tasks

### Add a new common schema fragment

Append to the `commonSchemas` const in `src/index.ts`, export via the existing `as const`, and add a test verifying defaults.

### Allow injecting a custom source (e.g. for tests)

`loadConfig` already accepts a second argument — pass any `Record<string, string | undefined>`. Tests in this package use this pattern.

## Out of scope

- Reading `.env` files. That's deployment-tool work (dotenv, Doppler, Vault). This package consumes the _already-resolved_ env.
- Hot reload. Config is immutable for the lifetime of the process.
