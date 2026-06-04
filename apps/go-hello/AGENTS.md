# go-hello — agent guide

Reference Go 1.24 service. Same User contract as py-hello and rs-hello
(`packages/contracts/proto/user/v1/user.proto`).

## Tasks an agent may run

| Verb             | Command                            |
| ---------------- | ---------------------------------- |
| Build            | `nx build go-hello`                |
| Test             | `nx test go-hello`                 |
| Integration test | `nx run go-hello:test:integration` |
| Lint             | `nx lint go-hello`                 |
| Container        | `nx run go-hello:container`        |
| Helm render      | `nx run go-hello:chart:render`     |

## Read first

- `cmd/server/main.go` — boot order: config → otel → pg → kafka → router
- `internal/handlers/users.go` — REST surface; gRPC mirrors via UserService
- `META.yaml` — declared XRDs (PG, Redis, Kafka topic)
- `../../packages/contracts/proto/user/v1/user.proto` — wire schema

## Do not

- Add a fourth backing service without updating META.yaml `spec.needs`.
- Hand-edit `packages/contracts/gen/go/**` — regenerate via `task contracts`.
