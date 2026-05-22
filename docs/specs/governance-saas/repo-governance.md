---
title: Repository Governance — Single Source of Truth
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://www.conventionalcommits.org/en/v1.0.0/
  - https://semver.org/
  - https://github.com/changesets/changesets
  - https://eslint.org/docs/latest/use/configure/configuration-files
  - https://typescript-eslint.io/users/configs/#strict-type-checked
  - https://www.rfc-editor.org/rfc/rfc9562  # UUIDv7
  - https://www.rfc-editor.org/rfc/rfc7807  # Problem Details for HTTP APIs
  - https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header
  - https://cloudevents.io/
  - https://spec.openapis.org/oas/v3.1.0
  - https://www.w3.org/TR/trace-context/
  - https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
  - https://cyclonedx.org/
  - https://github.com/dependency-review-action
  - https://adr.github.io/
---

# Repository Governance

This is the **single source of truth** for "how we write code in this repo". `AGENTS.md` and `CONTRIBUTING.md` reference this document; if those documents disagree with this one, this one wins and they need updating.

If a rule is not enforceable by tooling, it is still a rule — but raise an issue: undefended rules erode.

---

## 1. Naming

### 1.1 Package names

- Apps (deployable, containerized): `@app/<service>` — e.g., `@app/api-gateway`, `@app/billing-worker`.
- Public shared libraries (published to npm): `@pkg/<lib>` — e.g., `@pkg/logger`, `@pkg/db-client`.
- Internal build tooling (`"private": true`, never published): `@internal/<tool>` — e.g., `@internal/eslint-config`, `@internal/test-utils`.

Hyphens, not underscores. Lowercase. No abbreviations that aren't already industry-standard (`db`, `http`, `api`, `id` ok; `bllg` not ok).

### 1.2 File names

- Source files: **kebab-case** — `user-service.ts`, `idempotency-key.ts`.
- React components: **PascalCase** files, one component per file — `UserCard.tsx`.
- Types/classes/interfaces (inside files): **PascalCase** — `class UserService`, `type IdempotencyKey`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Functions/variables: `camelCase`.

Tests sit beside source: `user-service.ts` ↔ `user-service.test.ts`. No `__tests__/` directory at the same level as source (the ESLint config allows it for legacy code only).

### 1.3 Branch names

`<type>/<short-slug>` where `<type>` ∈ `feat | fix | chore | refactor | docs | test | perf | ci | build | revert`. Slug is kebab-case, ≤ 50 chars, no ticket IDs in branch (ticket goes in the commit body's `Refs:` trailer).

```
feat/billing-saga
fix/idempotency-race
chore/bump-vitest
```

### 1.4 Commit messages — Conventional Commits

Format: `type(scope): subject` where `scope` is the **workspace name without the prefix** (e.g., `logger`, `api-gateway`, `db-client`). Subject is imperative, no period, ≤ 72 chars.

```
feat(billing-worker): retry dunning sequence with exponential backoff
fix(db-client): release pool client on rollback
chore(deps): bump pino to 9.x
docs(governance-saas): add temporal decision tree
```

Body explains **why**, not what. Trailers:

- `Refs: ORG-1234` for tickets.
- `BREAKING CHANGE: <description>` for major bumps.
- `Co-authored-by:` if you really did pair (do not add by default).

Commitlint enforces this (`commitlint.config.cjs`).

### 1.5 Topic / event names

`<bounded-context>.<entity>.<event-type>` — all lowercase, dot-separated, present-tense for facts:

```
billing.invoice.issued
billing.invoice.paid
billing.invoice.payment-failed
tenancy.tenant.provisioned
identity.user.invited
```

This is also the CloudEvents `type` attribute. Kafka topics use the same string with `.v<n>` suffix for schema major version: `billing.invoice.issued.v1`. See `data-eventing/` specs.

### 1.6 Kubernetes resources

`<service>-<role>` — kebab-case. Examples:

- `api-gateway-deployment`, `api-gateway-service`, `api-gateway-hpa`
- `pg-tenant-statefulset`, `pg-tenant-headless`
- `billing-worker-deployment`, `billing-worker-temporal-tq` (when name encodes the task queue)

Namespaces follow `<bounded-context>` (e.g., `billing`, `tenancy`, `identity`). Cross-namespace traffic is opt-in via NetworkPolicy.

### 1.7 Database schemas

- Per-tenant data: `tenant_<uuidv7>` (the leading `tenant_` is mandatory because some Postgres tooling chokes on bare UUIDs as schema names).
- Shared metadata: `public` (the default) or `platform` for things like `tenants`, `users`, `feature_flags`.
- Audit log: `audit` (often a separate database; see `multi-tenancy-isolation-rules.md`).
- Test fixtures: `test_<random>` — created in setup, dropped in teardown.

---

## 2. Style — ESLint + Prettier

The ESLint flat config (`eslint.config.mjs`, see repo root) loads:

- `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked` — non-negotiable.
- `unicorn/recommended` — with two project-wide opt-outs already in config (`prevent-abbreviations`, `no-null`).
- `sonarjs/recommended` — `cognitive-complexity` capped at 15.
- `perfectionist/recommended-natural` — import + key ordering.
- `import-x` — typescript-aware, cycles forbidden.
- `promise` + `security` — recommended.
- `@vitest/eslint-plugin` — only in test files.

**Disabling a rule** requires an inline comment with **(a) reason** and **(b) ticket reference**:

```ts
// eslint-disable-next-line security/detect-object-injection -- key is validated by Zod above (ORG-742)
const value = config[key]
```

A bare `eslint-disable` without that trailer fails CI (custom rule in `@internal/eslint-config`).

**Prettier** (`.prettierrc.json`) is immutable in this template. Width 100, single quotes, no semicolons, trailing comma `all`, `arrowParens: 'always'`. Do not propose changes — the bikeshed cost is greater than the benefit.

---

## 3. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. See `tsconfig.base.json`.
- **No `any`** without `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason> (ORG-xxx)`.
- Prefer **`unknown`** as the boundary type; narrow with Zod / type guards.
- **Avoid `string` where a literal union or branded type works**. Tenant IDs, user IDs, money are branded types (`type TenantId = string & { readonly __brand: 'TenantId' }`).
- **Result types over throwing** for *expected* failures (validation, business-rule rejection, "not found" with non-404 semantics). Use `neverthrow`'s `Result<T, E>` or a project equivalent. Throwing is reserved for **bugs and infrastructure faults**.
- `type-coverage` ≥ 95% across the repo (`pnpm type-coverage`).
- `@arethetypeswrong/cli` clean for every published package (`pnpm attw`).

---

## 4. API design

- **RESTful** for resource-style HTTP: `GET /v1/tenants`, `POST /v1/tenants/:id/invitations`, `DELETE /v1/users/:id`. Verbs only when there is no resource analog (`POST /v1/sessions:refresh`).
- **Versioning** in the path: `/v1/...`, `/v2/...`. Never via header.
- **HTTP status codes**: 2xx success only on actual success; 400 for client validation; 401 unauthenticated; 403 authorized-but-forbidden; 404 not-found and only that; 409 idempotency replay with different body; 422 semantic validation failure; 429 rate-limited (with `Retry-After`); 5xx for server faults only.
- **Error envelope**: RFC 7807 Problem Details — `{ type, title, status, detail, instance, errors? }`. Every service exports `@pkg/errors` which gives a typed builder.
- **Pagination**: cursor by default — `?cursor=<opaque>&limit=<int>` returning `{ data: [], next_cursor: string | null }`. Offset pagination is forbidden on large tables. Limit cap = 100.
- **Idempotency-Key**: required on every non-GET mutation that creates resources or moves money. Header name `Idempotency-Key` (draft RFC). Stored for 24h in `@pkg/idempotency` with a hash of the request body; replays with same key + same body return the cached response, same key + different body return 409.
- **Tracing**: every request carries / propagates `traceparent` and `tracestate` (W3C Trace Context). The framework middleware does this; do not roll your own.

---

## 5. Database

- **Schema-per-tenant** for tenant data; **shared** for platform metadata. Cross-tenant queries forbidden in app code (see `multi-tenancy-isolation-rules.md`).
- **Migrations**: one migration = one logical change. Named `NNNN_<verb-slug>.sql` (`0042_add_invoice_status_index.sql`). Migrations are **forward-only**; rollback is a new forward migration. No `DROP COLUMN` in the same release as the code that stops using it — two-step expand/contract.
- **Foreign keys are mandatory** — no orphan rows. Where ORM defaults are weaker, override.
- **Primary keys**: UUID v7 (time-sortable, RFC 9562) for new tables. Reasons: globally unique, no PII leakage, monotonic-ish for index locality.
- **Soft delete** via `deleted_at TIMESTAMPTZ NULL` + a partial index `WHERE deleted_at IS NULL`. Hard delete is a deliberate, audited operation.
- **Timestamps**: `created_at`, `updated_at` mandatory, `TIMESTAMPTZ`, UTC. App code never trusts client-sent timestamps.

---

## 6. Logging

- **Structured JSON** only. `pino` via `@pkg/logger`. No `console.log` in apps (lint rule).
- Every log line carries: `level`, `time`, `msg`, `traceId`, `spanId`, `tenantId` (where applicable), `service`, `releaseSha`.
- **Correlation ID propagation**: `X-Request-Id` header in/out; if absent, the gateway generates a UUID v7. Tracing's `traceparent` is the canonical correlation, `X-Request-Id` is the human-readable mirror.
- **Levels**: `debug` (off in prod by default), `info` (state transitions, request start/end), `warn` (recoverable anomalies), `error` (bug or infra fault — pages someone if rate exceeds threshold).
- **Never log secrets** — tokens, passwords, full card numbers, PII beyond what's necessary. `@pkg/logger` ships a redaction config; new field added to redact list any time a new sensitive field is introduced.

---

## 7. Testing

- Coverage gates (per package, enforced in CI): **statements ≥ 80, lines ≥ 80, functions ≥ 80, branches ≥ 70**. Lower is acceptable for `apps/*` with explicit reason in the package's `vitest.config.ts`.
- **Vitest 4** with `test.projects` — one project per workspace. Never `vitest.workspace.ts` (deprecated).
- **Unit tests**: pure, fast, no I/O.
- **Integration tests**: `testcontainers` for Postgres / Redis / Kafka / Temporal. CI parallelism is configured to handle them.
- **E2E**: Playwright; one suite per app boundary; runs against an ephemeral preview deploy.
- **Replay tests**: see `temporal-when-and-when-not.md` §7 — mandatory for every deployed workflow.
- **No mocks of code we own** — refactor to inject. Mock only third-party SDKs at the seam.

---

## 8. Security

- **Secrets** via ESO from Azure Key Vault. No `.env` in the repo, no secrets in CI logs (action permissions are read-only by default, see `security-hardening-for-github-actions`).
- **No long-lived service tokens** — OIDC federation for CI; short-lived workload identities for runtime.
- **Pin GitHub Actions to 40-char SHAs** — not tags, not majors. Renovate keeps them updated.
- **SBOM** per release — CycloneDX JSON, attached to GH release, included in container image labels.
- **`dependency-review-action`** gates every PR — blocks critical CVEs and license violations (no GPL, no AGPL in `@app/*` runtime deps).
- **Container images**: distroless or `cgr.dev/chainguard/<base>`, non-root, read-only rootfs where feasible.
- **SAST / DAST**: Semgrep in CI for SAST. DAST against staging on release candidates.

---

## 9. Documentation

- Every package has a `README.md` (consumer-facing) and `AGENTS.md` (AI/contributor instructions for that package).
- **ADRs** for non-trivial decisions, in `docs/adrs/NNNN-<slug>.md` — context / decision / consequences. Superseded ADRs stay; mark with `Status: Superseded by ADR-NNNN`.
- Every HTTP endpoint described in **OpenAPI 3.1** in the service's `openapi.yaml`; generated client lives in `@pkg/<service>-client`.
- Every event described in **CloudEvents** + JSON Schema in the service's `events/` directory; schema registry lives in `data-eventing/`.

---

## 10. Releases & versioning

- **Changesets** with **independent** versioning (`fixed: []`, `linked: []`). Each changeset entry maps to one or more packages.
- **Apps** (`@app/*`) are listed in `.changeset/config.json` `ignore` — they ship as containers, not npm packages.
- **Semver** strictly. A breaking change requires a **major** bump and a `BREAKING CHANGE` footer in the commit + an ADR.
- Release notes are auto-generated from changesets; do not edit the generated `CHANGELOG.md`.

---

## 11. PR process

- **Small PRs.** One logical change. If a reviewer says "this could be three PRs", split it.
- **One required reviewer**, two for security-sensitive paths (`auth/`, `crypto/`, anything touching `secrets`).
- **CI must be green.** Force-merging is allowed for documented infra incidents only.
- **A changeset is required** for any change to `packages/*` or `apps/*`. The PR template enforces this.
- **No squash on releases.** Merge commits preserve the history that changesets relies on. Squash is fine for feature branches that don't span releases.

---

## 12. ADR process

- Number sequentially, never reused: `0001-tsdown-over-tsup.md`, `0002-changesets-over-release-please.md`, etc.
- Four sections: **Context**, **Decision**, **Consequences** (positive + negative), **References**.
- Statuses: `Proposed | Accepted | Superseded by NNNN | Deprecated`. Never deleted.
- Discussed in PR; merged only after one accept reviewer.

See `docs/adrs/` for examples. The `adr-tools` CLI is optional but recommended for scaffolding.

---

## 13. Developer workflow — the `repo` CLI

Every workflow described above is exposed via the `repo` CLI (defined in `internal/cli/`). Use it as the canonical entry point — `pnpm run <script>` is retained for backward compatibility but is no longer the documented path.

### Setup (first time)

```bash
corepack enable
corepack use pnpm@10.15.0
pnpm install
repo doctor                # validates node / pnpm / docker / config files
```

### Daily

```bash
repo dev up                # bring up postgres / redis / kafka / temporal locally
repo env render dev        # YAML -> docker/.env.rendered (compose consumes this)
repo new package <name>    # scaffold a new shared library
repo new adr "<title>"     # capture a decision before merging it
repo lint                  # ESLint + Prettier + markdownlint + cspell
repo test                  # vitest via nx
repo ci                    # mirror of the CI gate — run before pushing
```

### Release

```bash
repo new changeset                   # describe the change
git add .changeset && git commit -m "chore(release): add changeset"
repo release version                 # bumps + updates CHANGELOGs
repo release publish                 # changeset publish (npm + provenance)
```

### Why a CLI

See [ADR-0007](../../adrs/0007-repo-cli-as-dev-interface.md). TL;DR: composition, discoverability, and a `--json` mode for agents.

---

## 14. Frontend conventions

Authoritative source: [`docs/specs/frontend/`](../frontend/). The rules condensed:

- **Framework choice is dictated by surface, not preference.** See [framework-choices.md](../frontend/framework-choices.md). Astro for content; Expo for app + mobile; Hono for edge endpoints. Next.js is out (ADR-0010).
- **Routing.**
  - Astro: file-system in `src/pages/`. Use Astro Actions for typed server functions.
  - Expo: `app/` directory with `expo-router` typed routes (`experiments.typedRoutes: true`).
- **Accessibility baseline: WCAG 2.2 AA.** Verified via `axe-core` in CI on every Pages preview deploy.
- **Performance budgets (marketing, docs):** Lighthouse Performance ≥ 95; LCP < 1.5 s; initial JS < 50 KB gzipped.
- **Performance budgets (web-app):** LCP < 3 s on 4G; initial-route JS < 350 KB gzipped; TTI < 4 s mid-range mobile.
- **Performance budgets (native):** TTI < 2.5 s on mid-range Android; JS bundle < 1.5 MB gzipped per app.
- **No client-side JS without a reason** on marketing/docs pages. Islands are opt-in.
- **All tracking is consent-gated** via `@pkg/consent`. `@pkg/tracking` refuses to fire without the relevant category granted. No third-party tracker SDKs (GTM, Segment, etc.).
- **All forms go through `@pkg/forms`.** RHF + Zod for interactive; Conform for SSR/progressive-enhancement.
- **Cross-platform divergence** lives in `.web.ts` / `.native.ts` file variants inside `packages/*`. No `Platform.OS` branches in apps.
- **Deploy target: Cloudflare.** Pages for static + SSR; Workers for edge logic; R2/D1/KV for storage; Turnstile for CAPTCHA. See ADR-0011 and [cloudflare-deployment.md](../frontend/cloudflare-deployment.md).
- **OpenAPI types** flow into `@pkg/api-client` (generated via `openapi-typescript`). No hand-rolled request/response types.

---

## 15. Where this document fits

- `AGENTS.md` is the **lighthouse** for AI agents. It points here for the rules.
- `CONTRIBUTING.md` is the **lighthouse** for human contributors. It points here for the rules.
- `GOVERNANCE.md` (repo root) points at this document and the other `docs/specs/governance-saas/` files.
- Per-package `AGENTS.md` files may **tighten** rules (e.g., a security-sensitive package can require 90% branch coverage) but never **loosen** them.

If you need to break a rule, open an ADR. Do not silently disable lints, lower coverage thresholds, or rewrite history.
