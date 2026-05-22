# AGENTS.md — `@pkg/logger`

## What this package is

The shared logger. Wraps pino with sensible production defaults. Every service in `apps/*` instantiates one logger at boot via `createLogger({ service: '<name>' })`.

## Invariants

1. **Always use pino** — never `console.*` in committed code. ESLint catches `console`.
2. **Service name is mandatory.** No logger may be constructed without one.
3. **Secrets are redacted at the logger.** Never log raw `Authorization` headers, even in dev.
4. **No side effects at import time.** Construction goes through `createLogger`.

## Commands

```bash
pnpm -F @pkg/logger build
pnpm -F @pkg/logger test
pnpm -F @pkg/logger type-check
```

## Common tasks

### Add a new redaction path

Append to the `redact.paths` array in `src/index.ts`. Add a test that verifies the field gets censored. Bump patch.

### Wire OpenTelemetry log shipping

Replace the `transport` block with `pino-opentelemetry-transport` in production. Pino transports run on a worker thread — never block the event loop with custom synchronous output.

## Out of scope

- Switching away from pino (the entire monorepo's instrumentation assumes it).
- Adding application-level filtering — that's a consumer concern.
