# rs-hello — agent guide

Reference Rust 1.83 + axum service. Same User contract as go-hello
and py-hello.

## Tasks an agent may run

| Verb             | Command                            |
| ---------------- | ---------------------------------- |
| Build            | `nx build rs-hello`                |
| Test             | `nx test rs-hello`                 |
| Integration test | `nx run rs-hello:test:integration` |
| Lint             | `nx lint rs-hello`                 |
| Container        | `nx run rs-hello:container`        |

## Read first

- `src/main.rs` — tokio runtime + axum::serve
- `src/handlers.rs` — `health_router` + `users_router`
- `src/store.rs` — sqlx PgPool UserStore
- `src/events.rs` — rdkafka publisher (currently stubbed; see file header)
- `META.yaml` — declared XRDs
