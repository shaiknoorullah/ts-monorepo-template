# py-hello

Python 3.13 + FastAPI reference service. Matches the endpoint contract
in spec section 12.3 and emits the identical telemetry shape as
go-hello and rs-hello (spec section 12.7).

## Endpoints

| Path             | Method          |
| ---------------- | --------------- |
| `/healthz`       | GET             |
| `/readyz`        | GET             |
| `/metrics`       | GET (port 9090) |
| `/v1/users`      | GET / POST      |
| `/v1/users/{id}` | GET             |

## Local run

```bash
task py-hello:run
```
