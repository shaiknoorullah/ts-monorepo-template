---
title: Package Architecture Rules
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://martinfowler.com/bliki/BoundedContext.html
  - https://github.com/changesets/changesets
  - https://nx.dev/concepts/module-boundaries
  - https://www.npmjs.com/package/manypkg
  - https://www.npmjs.com/package/syncpack
  - https://docs.npmjs.com/about-semantic-versioning
---

# Package Architecture Rules

The repo has three workspace roots: `apps/`, `packages/`, `internal/`. The rules here govern **what code lives where**. Violating them produces the two failure modes we want to avoid: business logic accidentally shared across services (coupling drift), and infrastructure plumbing rewritten in every app (mass).

The dependency direction is one-way and enforced by Nx module boundaries + manypkg:

```
apps/* ──▶ packages/* ──▶ packages/types
   ▲
   └── internal/*  (build-time only; never imported at runtime by apps)
```

---

## 1. What goes in `packages/*` (shared, published)

The litmus test: **could two unrelated services need this same thing, and if both rewrote it would they end up with the same code?** If yes, it belongs in a shared package.

Canonical contents:

- **`@pkg/logger`** — structured pino wrapper, redaction config, level helpers, trace context bridge.
- **`@pkg/config`** — Zod-validated env loader; emits typed config object; fail-fast on missing/invalid.
- **`@pkg/db-client`** — Postgres pool wrapper, migration runner integration, query helpers, tenant-scoped client factory (see `multi-tenancy-isolation-rules.md`).
- **`@pkg/redis`** — Valkey/Redis connection wrapper with sane defaults, health check, cluster support.
- **`@pkg/telemetry`** — OpenTelemetry SDK setup, span helpers, exporter config.
- **`@pkg/contracts`** — pure TypeScript types shared across services (event types, API DTOs). No runtime code. Generated where possible from OpenAPI / JSON Schema.
- **`@pkg/errors`** — RFC 7807 Problem Details builder, typed error classes, mapping to HTTP status codes.
- **`@pkg/validation`** — Zod helpers (branded-type schemas, common refinements like ISO date, UUID v7, money).
- **`@pkg/retry`** — exponential backoff with jitter, circuit-breaker, deadline propagation. Used by activities and HTTP clients.
- **`@pkg/idempotency`** — `Idempotency-Key` middleware: header parsing, body hashing, cached response replay.
- **`@pkg/tenancy`** — `getTenantId()` from request context, tenant resolver middleware, `requireTenant()` guard. **No business logic.**
- **`@pkg/outbox`** — transactional outbox pattern: write to `outbox` table inside the same TX as the business write, separate poller publishes to Kafka, marks delivered.
- **`@pkg/feature-flags`** — OpenFeature SDK wrapper with our provider; typed flag registry generated from a YAML manifest.
- **`@pkg/auth-middleware`** — session/token verification (Ory or Keycloak adapter), `RequestContext` augmentation with `user`, `tenant`, `roles`.

**Rules for `packages/*`:**

- **Pure infrastructure**: no business rules, no domain models, no per-service knowledge.
- **No app-specific config**: a shared package never reads its own env vars directly; the consuming app constructs and injects config.
- **Stable interface**: changes that affect consumer signatures require a major bump (changesets).
- **Documented**: every package has a `README.md` (consumer API) + `AGENTS.md` (how to extend it).
- **Tested ≥ 80% statements**. Shared infra bugs amplify.
- **No transitive dependencies on `apps/*`** — manypkg enforces.

---

## 2. What goes in `apps/<service>/src/` (per-service)

The litmus test: **does this encode a business rule, a workflow, or a route of _this_ service?** Then it belongs to the service.

Canonical contents:

- **Business logic** — domain models, services, invariants, calculations.
- **Route handlers** — HTTP endpoints (Fastify routes), wired to the framework here, not in `packages/*`.
- **Temporal workflow definitions** — in `apps/<svc>/src/workflows/`. One file per workflow type.
- **Temporal activity implementations** — in `apps/<svc>/src/activities/`. Activities may import freely from `@pkg/*`.
- **Kafka consumers** — in `apps/<svc>/src/consumers/`. One file per topic group.
- **DB migrations** — in `apps/<svc>/db/migrations/`. Owned by the service that owns the schema.
- **OpenAPI spec** — `apps/<svc>/openapi.yaml`. Versioned with the service.
- **Event schemas** — `apps/<svc>/events/*.schema.json`. Registered in the schema registry on deploy.

**Rules for `apps/*`:**

- **Containerized, never published to npm.** Listed in `.changeset/config.json` `ignore`.
- **One bounded context per app.** If `billing-worker` is also handling tenant provisioning, split it.
- **No cross-app imports.** App A cannot `import { ... } from '@app/b'`. Communication is RPC or events only.
- **Owns its data.** App A cannot read App B's schema directly. If you need B's data, B publishes events or exposes an API.
- **Apps may pin to a specific `@pkg/*` version** when coordinating a breaking change across two services.

---

## 3. What goes in `internal/*` (build tooling)

The litmus test: **is this consumed at runtime by an app?** If yes, it does **not** go in `internal/`.

Canonical contents:

- **`@internal/eslint-config`** — shared ESLint flat config, plugin presets.
- **`@internal/tsconfig`** — base `tsconfig.json` + variants for node/library/test.
- **`@internal/test-utils`** — test helpers: testcontainers wrappers, fixture factories, replay test harness.
- **`@internal/scripts`** — codemods, one-off generators (e.g., generate-flag-registry, generate-event-schema-index).
- **`@internal/release-tools`** — changeset helpers, version-printer.

**Rules for `internal/*`:**

- **`"private": true` always.** Never published; manypkg enforces.
- **Apps may import at build time only** (e.g., `@internal/eslint-config` in `eslint.config.mjs`). Apps must not import `@internal/*` from runtime code paths.
- **Loosely tested.** Coverage rules are advisory here; build tooling is exercised by virtue of the rest of CI.
- **Free to break.** No semver guarantees within `internal/*`. Move fast.

---

## 4. Forbidden patterns

- **Shared business logic in `@pkg/*`.** "We have a `@pkg/billing-rules`" → wrong. Billing rules live in `apps/billing-worker/`. Other services that need billing facts subscribe to events.
- **App-to-app imports.** No `import { foo } from '@app/billing-worker'` from anywhere except in tests that explicitly mark themselves as cross-service integration.
- **App importing `internal/*` from runtime.** Build-time only.
- **Circular dependencies.** `import-x/no-cycle` is `error`.
- **Package importing its own transitive consumer.** `@pkg/db-client` cannot import `@pkg/auth-middleware` if auth-middleware imports db-client.
- **Sneaky monorepo `paths` aliases** in `tsconfig.base.json` that bypass workspace boundaries. Use workspace package names; do not alias `~/lib/foo`.

---

## 5. Versioning

- **`packages/*`** — independent semver, changesets. A breaking change to one package does not force a major bump of another.
- **`apps/*`** — versioned by container tag (`v<git-sha>`); no npm version. Listed in `.changeset/config.json` `ignore`.
- **`internal/*`** — versioned but never published. Changes are absorbed by whichever workspace consumes them at the next build.

**Breaking change to a `@pkg/*` consumed by multiple apps**:

1. Write the changeset describing the break.
2. Update **all** consuming apps in the **same PR**. Do not stage; do not "I'll update billing-worker next week".
3. Note the coordinated deploy in the PR description so ops knows to roll forward all services together.

The reason for the coordinated-deploy rule: shared packages travel through CI as binary artifacts. A `db-client` v2 that lands in `api-gateway` before `billing-worker` produces a window where the two apps speak different versions of the pool API to the same Postgres — a class of bug that's tedious to triage.

---

## 6. Tooling enforcement

| Rule                                   | Enforced by                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `apps/* → packages/*` only             | Nx module boundaries (`nx.json` `enforceModuleBoundaries`)               |
| No publish from `apps/*`, `internal/*` | manypkg + changesets `ignore`                                            |
| No version drift across workspaces     | syncpack (`pnpm deps`)                                                   |
| Type exports correct                   | attw (`pnpm attw`)                                                       |
| Publish-readiness                      | publint (`pnpm publint`)                                                 |
| Dead exports, unused deps              | knip (`pnpm dead`)                                                       |
| Cycles                                 | `import-x/no-cycle`                                                      |
| Imports allowed                        | `import-x/no-restricted-paths` (configured in `@internal/eslint-config`) |

All of these run in `pnpm doctor`. CI runs `pnpm doctor` on every PR.

---

## 7. Adding a new shared package — checklist

1. Confirm it meets the §1 litmus test. If it's borderline, prefer leaving it in the app for now.
2. `pnpm exec nx g @nx/js:lib <name> --directory=packages/<name>`.
3. Set `package.json` `name` to `@pkg/<name>`, `version` `0.0.0`, `private: false`.
4. Add `README.md` (consumer API) and `AGENTS.md` (internals).
5. Tests + 80% coverage gate in `vitest.config.ts`.
6. Add to `@internal/tsconfig` references if other packages will use it.
7. Open PR. CI runs `pnpm doctor`; reviewer checks the litmus test.

---

## 8. Decommissioning a package

1. Mark `package.json` `"deprecated": "<reason; use @pkg/<other> instead>"`.
2. Publish a final version that prints a console warning on import.
3. After all consumers migrate (verify with `pnpm why @pkg/<name>`), delete the workspace.
4. Leave the npm tombstone published — do not unpublish, do not delete the package on npm.
5. Add an ADR if the change is non-obvious.

This avoids breaking downstream consumers (in our case, the template's users) silently.
