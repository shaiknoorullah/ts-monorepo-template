---
title: docker-compose Variants — prod-smallest, dev, dev-tools
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://docs.docker.com/compose/compose-file/
  - https://docs.docker.com/compose/multiple-compose-files/merge/
  - https://docs.docker.com/compose/profiles/
  - https://docs.docker.com/engine/reference/builder/#healthcheck
  - https://docs.docker.com/compose/compose-file/05-services/#extends
  - https://github.com/compose-spec/compose-spec/blob/main/spec.md
---

# docker-compose Variants

Three compose files live under `docker/` and are designed to be **merged**, not used in isolation. The pattern is borrowed from the official Docker docs ([merge multiple compose files](https://docs.docker.com/compose/multiple-compose-files/merge/)).

> **Config note (ADR-0006):** `.env` files are now **rendered artifacts**. The source of truth is the YAML hierarchy under `config/`. Use `repo env render <env>` to produce the `.env` that compose consumes.

```bash
# Render the YAML hierarchy first (config/dev.yaml + config/base.yaml -> docker/.env.rendered)
repo env render dev

# developer laptop
repo dev up
# (equivalent to: docker compose -f docker/compose.dev.yml --env-file docker/.env.rendered up -d)

# staging on a single node, with dev-tools UIs available
repo env render staging --out docker/.env.staging.rendered
docker compose \
  -f docker/compose.prod-smallest.yml \
  -f docker/compose.dev-tools.yml \
  --env-file docker/.env.staging.rendered up -d
```

For the SaaS-commons stack (Keycloak/Unleash/Lago/Chatwoot/etc.):

```bash
repo env render saas-commons --out docker/.env.saas-commons.rendered
docker compose -f docker/compose.saas-commons.yml \
  --env-file docker/.env.saas-commons.rendered up -d
```

The legacy `.env.saas-commons.example` is preserved for backward compatibility but is **deprecated** — see [ADR-0006](../../adrs/0006-yaml-config-with-c12.md).

## Files at a glance

| File | Purpose | Scale | Where it runs |
|---|---|---|---|
| `compose.prod-smallest.yml` | Production-grade topology at smallest viable scale | Multi-broker Kafka, 3-node Postgres HA, 6-node Redis cluster | Single beefy node (16+ GiB), staging, POC |
| `compose.dev.yml` | Single-instance everything, ports exposed, hot reload | Single broker, single Postgres, single Redis | Developer laptop |
| `compose.dev-tools.yml` | Web UIs and inspection tools | n/a | Layered on top of either of the above |
| `compose.saas-commons.yml` | Foundational SaaS tools: Keycloak, Unleash, Meilisearch, Lago, Chatwoot, Umami, Uptime Kuma — each with a dedicated Postgres/Redis where required | 7 tools, ~10 GiB resident at idle | Layered on top of `prod-smallest`; see [governance-saas/saas-commons.md §17](../governance-saas/saas-commons.md#17-compose-recipes) |

Where this template overlaps with `data-eventing` (Kafka, Schema Registry, Connect), we **import** by symlink to avoid duplication. See "Cross-spec composition" below.

## `compose.prod-smallest.yml`

Topology choices that justify the name:

- **Postgres** — 3 instances under Patroni for true HA (1 leader, 2 replicas) with etcd-backed DCS. Smaller than the typical 5-node setup but sufficient for quorum.
- **Kafka** — single broker in **KRaft mode** (Zookeeper-free, [KIP-833](https://cwiki.apache.org/confluence/display/KAFKA/KIP-833%3A+Mark+KRaft+as+Production+Ready)) with `min.insync.replicas=1`. Replication-factor 1 is acceptable for staging; the prod topology must be 3.
- **Redis** — 6-node cluster (3 masters + 3 replicas), the minimum recommended for Redis Cluster mode.
- **Edge** — Traefik v3 on host network.
- **Observability** — OTel collector + Prom + Grafana + Loki + Tempo + SigNoz (separately under `docker/observability/`).

```yaml
# docker/compose.prod-smallest.yml
name: tsm-prod-smallest

x-restart: &restart
  restart: unless-stopped
x-pg-env: &pg-env
  POSTGRES_USER: ${POSTGRES_USER:-postgres}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
  POSTGRES_DB: ${POSTGRES_DB:-app}

services:
  # ─── Edge ──────────────────────────────────────────────────────────────
  traefik:
    extends:
      file: ./edge/traefik.yml
      service: traefik
    <<: *restart

  # ─── State: Postgres + Patroni + etcd ──────────────────────────────────
  etcd:
    image: quay.io/coreos/etcd:v3.5.15
    <<: *restart
    environment:
      ETCD_NAME: etcd
      ETCD_LISTEN_CLIENT_URLS: http://0.0.0.0:2379
      ETCD_ADVERTISE_CLIENT_URLS: http://etcd:2379
      ETCD_INITIAL_CLUSTER_STATE: new
      ETCD_INITIAL_CLUSTER: etcd=http://etcd:2380
      ETCD_LISTEN_PEER_URLS: http://0.0.0.0:2380
      ETCD_INITIAL_ADVERTISE_PEER_URLS: http://etcd:2380
    volumes: [etcd-data:/etcd-data]
    healthcheck:
      test: ["CMD", "etcdctl", "endpoint", "health"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks: [state]
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 256M }

  pg-1: &pg-base
    image: ghcr.io/zalando/spilo-16:3.2-p3
    <<: *restart
    environment:
      <<: *pg-env
      SCOPE: tsm
      PGVERSION: "16"
      ETCD_HOSTS: etcd:2379
      PATRONI_NAME: pg-1
    volumes: [pg1-data:/home/postgres/pgdata]
    networks: [state]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 3s
      retries: 10
    depends_on:
      etcd: { condition: service_healthy }
    deploy:
      resources:
        limits: { cpus: "2", memory: 3G }

  pg-2:
    <<: *pg-base
    environment:
      <<: *pg-env
      SCOPE: tsm
      PGVERSION: "16"
      ETCD_HOSTS: etcd:2379
      PATRONI_NAME: pg-2
    volumes: [pg2-data:/home/postgres/pgdata]

  pg-3:
    <<: *pg-base
    environment:
      <<: *pg-env
      SCOPE: tsm
      PGVERSION: "16"
      ETCD_HOSTS: etcd:2379
      PATRONI_NAME: pg-3
    volumes: [pg3-data:/home/postgres/pgdata]

  pgbouncer:
    image: edoburu/pgbouncer:v1.23.1
    <<: *restart
    environment:
      DB_HOST: pg-1
      DB_USER: ${POSTGRES_USER:-postgres}
      DB_PASSWORD: ${POSTGRES_PASSWORD:?required}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: "500"
      DEFAULT_POOL_SIZE: "40"
      SERVER_RESET_QUERY: DISCARD ALL
    networks: [state, app]
    depends_on:
      pg-1: { condition: service_healthy }
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 256M }

  # ─── Cache: Redis Cluster (6 nodes) ────────────────────────────────────
  redis-node-1: &redis-node
    image: redis:7.4-alpine
    <<: *restart
    command: >
      redis-server
      --cluster-enabled yes
      --cluster-config-file nodes.conf
      --cluster-node-timeout 5000
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    networks: [state]
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 700M }
  redis-node-2: { <<: *redis-node }
  redis-node-3: { <<: *redis-node }
  redis-node-4: { <<: *redis-node }
  redis-node-5: { <<: *redis-node }
  redis-node-6: { <<: *redis-node }
  redis-cluster-init:
    image: redis:7.4-alpine
    profiles: ["init"]
    entrypoint: >
      sh -c "sleep 5 &&
        echo 'yes' | redis-cli --cluster create
        redis-node-1:6379 redis-node-2:6379 redis-node-3:6379
        redis-node-4:6379 redis-node-5:6379 redis-node-6:6379
        --cluster-replicas 1"
    networks: [state]
    depends_on:
      - redis-node-1
      - redis-node-2
      - redis-node-3
      - redis-node-4
      - redis-node-5
      - redis-node-6

  # ─── Messaging: Kafka in KRaft mode (single broker) ───────────────────
  kafka:
    image: confluentinc/cp-kafka:7.7.1
    <<: *restart
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_LOG_RETENTION_HOURS: 168
      CLUSTER_ID: "tsm-staging-kraft-001"
    volumes: [kafka-data:/var/lib/kafka/data]
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 15s
      timeout: 5s
      retries: 10
    networks: [state, app]
    deploy:
      resources:
        limits: { cpus: "2", memory: 2G }

  schema-registry:
    image: apicurio/apicurio-registry:2.6.5.Final
    <<: *restart
    environment:
      QUARKUS_PROFILE: prod
      REGISTRY_STORAGE_KIND: kafkasql
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      kafka: { condition: service_healthy }
    networks: [app]
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 512M }

  # ─── Apps ──────────────────────────────────────────────────────────────
  api:
    image: ${REGISTRY:-ghcr.io/shaiknoorullah/ts-monorepo-template}/api:${TAG:-latest}
    <<: *restart
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@pgbouncer:5432/app
      REDIS_URL: redis://redis-node-1:6379
      KAFKA_BROKERS: kafka:9092
      SCHEMA_REGISTRY_URL: http://schema-registry:8080
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
      OTEL_SERVICE_NAME: api
    depends_on:
      pgbouncer: { condition: service_started }
      kafka: { condition: service_healthy }
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`api.${PUBLIC_DOMAIN}`)
      - traefik.http.routers.api.entrypoints=websecure
      - traefik.http.routers.api.tls.certresolver=le
      - traefik.http.routers.api.middlewares=rate-limit-tenant@file
    networks: [app, edge]
    deploy:
      resources:
        limits: { cpus: "1", memory: 768M }

  worker:
    image: ${REGISTRY:-ghcr.io/shaiknoorullah/ts-monorepo-template}/worker:${TAG:-latest}
    <<: *restart
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@pgbouncer:5432/app
      KAFKA_BROKERS: kafka:9092
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
      OTEL_SERVICE_NAME: worker
    depends_on:
      pgbouncer: { condition: service_started }
      kafka: { condition: service_healthy }
    networks: [app]
    deploy:
      resources:
        limits: { cpus: "1", memory: 512M }

  # ─── Observability collector ──────────────────────────────────────────
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.110.0
    <<: *restart
    command: ["--config=/etc/otelcol/config.yml"]
    volumes:
      - ./observability/otel-collector.yml:/etc/otelcol/config.yml:ro
    networks: [app, observability]

volumes:
  etcd-data:
  pg1-data:
  pg2-data:
  pg3-data:
  kafka-data:

networks:
  edge:     { driver: bridge }
  app:      { driver: bridge }
  state:    { driver: bridge, internal: true }   # no host egress for stateful tier
  observability: { driver: bridge }
```

### Why these specific sizes

- **Postgres**: 2 GiB shared_buffers + connections + WAL ≈ 3 GiB limit. Three of these = 9 GiB.
- **Kafka**: 1 GiB heap + page cache room → 2 GiB limit.
- **Redis cluster**: 6 × 700 MiB = 4.2 GiB total cache budget.
- **API + worker + edge + obs collector**: ~3 GiB.
- **Total**: ~18 GiB. Fits a 24 GiB single node with room for the OS and dev-tools layer.

## `compose.dev.yml`

Goals: 60-second cold start, ports exposed on localhost, no replication, log to stdout.

```yaml
# docker/compose.dev.yml
name: tsm-dev

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app
    ports: ["5432:5432"]
    volumes: [pg-dev:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7.4-alpine
    ports: ["6379:6379"]
    command: ["redis-server", "--save", "''", "--appendonly", "no"]

  kafka:
    image: confluentinc/cp-kafka:7.7.1
    ports: ["9092:9092"]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093,PLAINTEXT_HOST://0.0.0.0:29092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      CLUSTER_ID: "tsm-dev-kraft-000"

  schema-registry:
    image: apicurio/apicurio-registry-mem:2.6.5.Final
    ports: ["8080:8080"]

  api:
    build:
      context: ..
      dockerfile: apps/api/Dockerfile
      target: dev
    command: ["pnpm", "--filter", "@app/api", "dev"]
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://dev:dev@postgres:5432/app
      REDIS_URL: redis://redis:6379
      KAFKA_BROKERS: kafka:9092
      SCHEMA_REGISTRY_URL: http://schema-registry:8080
    ports: ["3000:3000"]
    volumes:
      - ../apps/api:/app/apps/api
      - ../packages:/app/packages
      - /app/node_modules
    depends_on:
      postgres: { condition: service_healthy }
      kafka: { condition: service_started }

volumes:
  pg-dev:
```

Differences from prod-smallest:

- No Patroni, no etcd, no pgbouncer (Drizzle's built-in `pg.Pool` is fine).
- No Redis cluster — single instance, AOF off.
- Single Kafka broker with **two listeners**: `PLAINTEXT://kafka:9092` (inside the network) and `PLAINTEXT_HOST://localhost:29092` (from the host laptop). Required so the host machine can run integration tests against the same broker.
- API mounts source code; runs `pnpm dev` for hot reload via tsx watch.
- All credentials are `dev/dev` — never wire this file into anything that touches the public internet.

## `compose.dev-tools.yml`

Layered on top — UIs only, no state.

```yaml
# docker/compose.dev-tools.yml
name: tsm-dev-tools

services:
  pgadmin:
    image: dpage/pgadmin4:8.12
    profiles: ["tools"]
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@local
      PGADMIN_DEFAULT_PASSWORD: dev
      PGADMIN_CONFIG_SERVER_MODE: "False"
    ports: ["5050:80"]
    volumes:
      - ./dev-tools/pgadmin-servers.json:/pgadmin4/servers.json:ro

  redisinsight:
    image: redis/redisinsight:2.58
    profiles: ["tools"]
    ports: ["5540:5540"]

  kafka-ui:
    image: provectuslabs/kafka-ui:v0.7.2
    profiles: ["tools"]
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_SCHEMAREGISTRY: http://schema-registry:8080/apis/ccompat/v7
    ports: ["8090:8080"]

  apicurio-ui:
    image: apicurio/apicurio-studio:1.0.0.Final
    profiles: ["tools"]
    ports: ["8091:8080"]

  mailhog:
    image: mailhog/mailhog:v1.0.1
    profiles: ["tools"]
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # HTTP UI

  jaeger-ui:
    # When using OTel collector locally; only the UI, no storage.
    image: jaegertracing/all-in-one:1.62
    profiles: ["tools"]
    ports: ["16686:16686"]
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
```

`profiles: ["tools"]` means `docker compose up` is a **no-op for these services** unless invoked with `--profile tools`. Keeps `dev up` fast for engineers who don't want pgAdmin running.

## Environment variable conventions

```
# .env.example  (committed; secrets are placeholders)
PUBLIC_DOMAIN=staging.example.com
REGISTRY=ghcr.io/shaiknoorullah/ts-monorepo-template
TAG=latest

POSTGRES_USER=postgres
POSTGRES_PASSWORD=__CHANGE_ME__
POSTGRES_DB=app

REDIS_PASSWORD=__CHANGE_ME__

OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

Rules:

1. **Required variables use `${VAR:?msg}`** — compose fails fast if unset (see [compose spec interpolation](https://github.com/compose-spec/compose-spec/blob/main/spec.md#interpolation)).
2. **Defaults use `${VAR:-default}`** — only for non-secrets.
3. **`.env.example` is committed; `.env.staging`, `.env.prod` are not.**
4. **No secrets in compose YAML.** Use the `secrets:` top-level field and bind to files; in K8s these become ExternalSecrets.

## Healthchecks and dependencies

Every stateful service has a `healthcheck`. Every app waits with `depends_on: <svc>: { condition: service_healthy }`. The pattern is:

- Postgres: `pg_isready`
- Kafka: `kafka-broker-api-versions`
- Redis: `redis-cli ping`
- HTTP services: `curl -fsS localhost:<port>/healthz`
- Custom apps: ship a `/healthz` route in `@pkg/health` (covered in a separate spec).

## Cross-spec composition

`data-eventing` ships its own `docker/eventing-compose.yml` for Kafka Connect, Apicurio in KafkaSQL mode, Debezium, and ksqlDB. **Do not duplicate** here. Run with:

```bash
docker compose \
  -f docker/compose.prod-smallest.yml \
  -f docker/eventing-compose.yml \
  --env-file .env.staging up -d
```

The merge rule ([docs.docker.com merge](https://docs.docker.com/compose/multiple-compose-files/merge/)) is: services are deep-merged by name; later files override earlier ones; lists are replaced, not concatenated. Networks named identically across files are de-duped.

### `compose.saas-commons.yml` — layered SaaS tooling

The SaaS-commons file groups seven foundational tools (identity, feature flags, search, billing, support, analytics, status page). It uses the [`include:` directive](https://docs.docker.com/compose/compose-file/14-include/) to pull in each tool's individual compose file — so you can either run the master, or pick one tool in isolation via `-f docker/<tool>.compose.yml`.

```bash
# Foundation + SaaS-commons together
docker compose \
  -f docker/compose.prod-smallest.yml \
  -f docker/compose.saas-commons.yml \
  --env-file .env.saas-commons \
  up -d

# Or just one tool — useful for iterating on a single integration
docker compose \
  -f docker/keycloak.compose.yml \
  --env-file .env.saas-commons \
  up -d
```

Networks: each SaaS-commons tool joins the external `saas-commons` network and (where HTTP-exposing) the `obs` network so the existing OTel collector / Prometheus can scrape. Create both networks once:

```bash
docker network create saas-commons
docker network create obs   # if not already created by observability-deps.compose.yml
```

Why each SaaS tool ships its own Postgres/Redis instead of reusing the Patroni cluster: each upstream pins a specific Postgres major (Lago → 14, Chatwoot → 12) and runs migrations that own the schema. Sharing the app's PG 16 cluster would force a version drift and create schema-ownership confusion. The duplication cost is ~3 idle Postgres containers; the simplicity gain is worth it for a self-host template.

## Resource limits — the numbers are non-arbitrary

Each `deploy.resources.limits` was sized from the upstream documentation's "minimum recommended" or our own benchmarks on a 4 vCPU / 8 GiB Contabo S box:

| Service | CPU | RAM | Source |
|---|---|---|---|
| Postgres | 2.0 | 3 G | shared_buffers=512MB + work_mem + connections × 10 MiB |
| Kafka | 2.0 | 2 G | KRaft 1 G heap + 1 G page cache |
| Redis node | 0.5 | 700 M | maxmemory 512 MB + 30% overhead |
| API | 1.0 | 768 M | Node heap 512 MB + libs |
| Worker | 1.0 | 512 M | Node heap 384 MB |
| Traefik | 1.0 | 256 M | Traefik docs |
| OTel collector | 0.5 | 384 M | otel-collector docs |

## TODO

- Add `compose.prod.yml` (full HA — 3 Kafka brokers, 5 Postgres) once we sign off on hardware.
- Move dev-tools `mailhog` to MailPit (`axllent/mailpit`) — better UI, IMAP support.
- Add a Makefile + a tiny TUI (`tsm dev up`, `tsm staging up`) wrapping the compose invocations.
