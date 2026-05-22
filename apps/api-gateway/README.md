# @app/api-gateway

HTTP API gateway. Fastify-based, ships as a container, never publishes to npm.

## Endpoints

| Method | Path     | Purpose                                      |
| ------ | -------- | -------------------------------------------- |
| GET    | `/health`| Liveness probe — returns `HealthCheck` JSON. |
| GET    | `/ready` | Readiness probe — returns `{ ready: true }`. |

## Run locally

```bash
pnpm -F @app/api-gateway dev      # tsx watch
pnpm -F @app/api-gateway test
pnpm -F @app/api-gateway build    # tsdown → dist/main.js
pnpm -F @app/api-gateway start    # node dist/main.js
```

## Configuration

See `src/config.ts`. All env vars validated at boot via `@pkg/config`.

| Env var          | Default        |
| ---------------- | -------------- |
| `PORT`           | `3000`         |
| `HOST`           | `0.0.0.0`      |
| `LOG_LEVEL`      | `info`         |
| `CORS_ORIGIN`    | `*`            |
| `SERVICE_NAME`   | `api-gateway`  |
| `SERVICE_VERSION`| `0.0.0`        |
| `NODE_ENV`       | `development`  |
