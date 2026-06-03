# py-hello — agent guide

Reference Python 3.13 + FastAPI service. Same User contract as
go-hello and rs-hello.

## Tasks an agent may run

| Verb             | Command                            |
| ---------------- | ---------------------------------- |
| Install deps     | `nx run py-hello:install`          |
| Build wheel      | `nx build py-hello`                |
| Test             | `nx test py-hello`                 |
| Integration test | `nx run py-hello:test:integration` |
| Lint             | `nx lint py-hello`                 |
| Container        | `nx run py-hello:container`        |

## Read first

- `src/py_hello/app.py` — `create_app()` factory; routers mounted here
- `src/py_hello/store.py` — SQLAlchemy 2 async UserStore + UUID guard
- `src/py_hello/events.py` — aiokafka publisher
- `META.yaml` — declared XRDs (PG, Redis, Kafka topic)
