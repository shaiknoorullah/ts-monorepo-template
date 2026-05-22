# @app/worker

Background-job worker. BullMQ consumer reading from Redis. Containerised; never published to npm.

## Run locally

```bash
# Start Redis (see docker/docker-compose.yml)
docker compose -f docker/docker-compose.yml up -d redis

pnpm -F @app/worker dev
pnpm -F @app/worker test
pnpm -F @app/worker build
pnpm -F @app/worker start
```

## Configuration

| Env var               | Default                    |
| --------------------- | -------------------------- |
| `REDIS_URL`           | `redis://localhost:6379`   |
| `QUEUE_NAME`          | `default`                  |
| `WORKER_CONCURRENCY`  | `8`                        |
| `LOG_LEVEL`           | `info`                     |
| `SERVICE_NAME`        | `worker`                   |

## Architecture

- `src/processor.ts` — pure async function that takes a `JobPayload` and returns a `JobResult`. **Unit-testable without Redis**.
- `src/main.ts` — BullMQ harness, signal handlers, lifecycle.
- Wire new job types as a discriminated union in `processor.ts`.
