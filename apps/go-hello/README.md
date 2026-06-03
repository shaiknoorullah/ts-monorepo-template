# go-hello

Go 1.24 + chi reference service for the platform conformance suite.
Implements the identical endpoint contract as py-hello and rs-hello
(spec section 12.3).

## Endpoints

| Path             | Method          | Purpose               |
| ---------------- | --------------- | --------------------- |
| `/healthz`       | GET             | Liveness              |
| `/readyz`        | GET             | Readiness (PG ping)   |
| `/metrics`       | GET (port 9090) | Prometheus exposition |
| `/v1/users`      | GET / POST      | List / create users   |
| `/v1/users/{id}` | GET             | Read user             |

## Local run

```bash
task go-hello:run
```
