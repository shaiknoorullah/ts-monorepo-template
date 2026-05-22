# AGENTS.md — `@app/worker`

## What this service is

BullMQ consumer. Pulls jobs from Redis and processes them. Containerised, never published to npm.

## Invariants

1. **`processJob` is pure** — given a payload + logger, returns a result. No global side effects. Tests rely on this.
2. **Validate every payload with zod.** Untrusted input → `ZodError` before any business logic touches it.
3. **One worker per process.** Concurrency is BullMQ-level; don't fork or cluster — let Kubernetes scale replicas.
4. **Graceful shutdown.** `SIGINT`/`SIGTERM` await `worker.close()` so in-flight jobs finish.

## Commands

```bash
pnpm -F @app/worker dev
pnpm -F @app/worker test       # processJob unit tests (no Redis required)
pnpm -F @app/worker type-check
pnpm -F @app/worker build
```

## Common tasks

### Add a job type

1. Extend the discriminated union in `src/processor.ts`:
   ```ts
   const jobPayloadSchema = z.discriminatedUnion('type', [
     z.object({ type: z.literal('send-email'), payload: emailPayload }),
     z.object({ type: z.literal('reindex'), payload: reindexPayload }),
   ])
   ```
2. Route within `processJob` based on `job.type`.
3. Add a unit test per type.

### Tune concurrency

Set `WORKER_CONCURRENCY` env var. **Do not** raise above ~50 without also tuning Redis client `maxRetriesPerRequest`.

## Out of scope

- Job-producer code. Producers live in the service that originates the work (e.g. `api-gateway`).
- Cron/repeatable jobs. Use BullMQ's `Queue` API in the producer; the worker just consumes.
