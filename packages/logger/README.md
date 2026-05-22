# @pkg/logger

Structured logger built on [pino](https://getpino.io). Production-ready out of the box:

- NDJSON to stdout in production (consumed by the OTel collector / fluent-bit / Loki).
- `pino-pretty` colorised output in dev.
- Redacts secrets (`password`, `token`, `authorization`, `cookie`) by default.
- Ready for `pino-opentelemetry-transport` — trace-context auto-injection is opt-in.

## Usage

```ts
import { createLogger, childLogger } from '@pkg/logger'

const logger = createLogger({ service: 'api-gateway' })
logger.info({ userId: 'u_123' }, 'request handled')

// Per-request child loggers
const requestLogger = childLogger(logger, { requestId: 'r-abc' })
```

## Configuration

| Option     | Default                           | Description                             |
| ---------- | --------------------------------- | --------------------------------------- |
| `service`  | (required)                        | Emitted as `service` on every log line. |
| `level`    | `process.env.LOG_LEVEL ?? 'info'` | pino log level.                         |
| `pretty`   | `NODE_ENV !== 'production'`       | Pretty-print in dev.                    |
| `bindings` | `{}`                              | Extra fields merged into the base.      |

## Status

Stable.
