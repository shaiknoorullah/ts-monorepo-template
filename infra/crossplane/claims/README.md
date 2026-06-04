<!-- infra/crossplane/claims/README.md -->

# Crossplane Claims (per env)

Per-environment XR claim manifests for the Day-1 reference apps
(`go-hello`, `py-hello`, `rs-hello`).

Layout:

- `dev/` — claims rendered against `EnvironmentConfig/env-dev` (size `xs`)
- `staging/` — claims rendered against `EnvironmentConfig/env-staging` (size `s`)
- `prod/` — claims rendered against `EnvironmentConfig/env-prod` (size `m`)

Per app:

- `<app>-pg.yaml` — `PostgresClusterClaim` (XPostgresCluster)
- `<app>-redis.yaml` — `RedisClusterClaim` (XRedisCluster)
- `<app>-obs.yaml` — `ServiceObservabilityClaim` (XServiceObservability)
- `<app>-keycloak.yaml` — `KeycloakClientClaim` (XKeycloakClient)

Shared:

- `shared-topics.yaml` — one `KafkaTopicClaim` for `user.events.v1`
- `shared-bucket.yaml` — one `BucketClaim` for shared assets

Sizing is injected by `function-environment-configs` from Phase 8.
Claims do not hard-code replica/storage values — only `env`, `size`,
and contract-level fields.

See spec Section 8 (claims layout) and Section 12 (reference apps).
