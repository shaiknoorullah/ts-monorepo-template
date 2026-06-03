# AGENTS.md

> The universal agent spec — read natively by Claude Code, OpenAI Codex CLI, Cursor, Aider, Devin, GitHub Copilot, Gemini CLI, Windsurf, and Amazon Q. The nearest `AGENTS.md` wins (child overrides parent). See [agents.md](https://agents.md).

This file tells AI coding assistants how to be productive in **this** repository without breaking it.

---

## 1. What this repo is

`ts-monorepo-template` is a **GitHub repository template** for production TypeScript microservice monorepos. Consumers click "Use this template" to bootstrap their own org's monorepo. It is intentionally opinionated.

**Foundational choices** (do not change without an ADR — see `docs/adrs/`):

- **Package manager:** pnpm 10.15+ with workspaces + catalogs.
- **Orchestrator:** Nx 21 (`nx affected`, remote caching).
- **Bundler:** `tsdown` (Rolldown). Not tsup — tsup is in maintenance mode.
- **Test runner:** Vitest 4 with `test.projects` (NOT the deprecated `vitest.workspace.ts`).
- **Linter:** ESLint 9 flat config + typescript-eslint + sonarjs + unicorn + perfectionist + import-x + security + promise.
- **Formatter:** Prettier 3 (`prettier-plugin-packagejson`).
- **Releases:** `@changesets/cli` with **independent** versioning (`fixed: []`, `linked: []`).
- **Git hooks:** Lefthook.
- **CI:** GitHub Actions, third-party actions pinned to **40-character commit SHAs** (post-Trivy March-2026 incident).
- **Dep automation:** Renovate (primary) + Dependabot (GitHub Actions only).

---

## 2. Workspace layout

```
apps/                  Microservices (deployable). Containerized. NEVER published to npm.
  api-gateway/         HTTP entry point (Fastify).
  worker/              Background worker (BullMQ).
packages/              Shared libraries. Published to npm.
  logger/              Structured logger (pino).
  config/              Env loader with zod schema.
  db-client/           Postgres client wrapper.
  types/               Shared TypeScript types.
internal/              Private workspace packages. ALWAYS "private": true. Never published.
  test-utils/          Test helpers shared across the repo.
  scripts/             One-off generators, codemods, recipes.
  eslint-config/       Shared ESLint config (kept here, not in packages/, because consumers don't install it).
  tsconfig/            Shared TS configs.
docs/                  VitePress site (architecture, ADRs, recipes).
docker/                Local dev compose + base Dockerfiles.
.changeset/            Pending releases.
.github/workflows/     CI/CD (12 workflows; see workflows/ section below).
```

**Dependency direction is one-way:** `apps/* → packages/* → packages/types`. Packages **must not** depend on apps. `internal/*` may depend on `packages/*` but not the other way around. Manypkg enforces this.

---

## 3. Commands you will run

All commands run from the repo root unless noted.

### Bootstrap

```bash
corepack enable
corepack use pnpm@10.15.0
pnpm install --frozen-lockfile
pnpm prepare           # installs lefthook git hooks
```

### Day-to-day

```bash
pnpm dev               # nx run-many -t dev (all apps)
pnpm test              # nx run-many -t test (uses cache)
pnpm test:affected     # nx affected -t test --base=origin/main
pnpm lint              # ESLint across all projects
pnpm lint:fix
pnpm type-check        # tsc -b across project references
pnpm build             # tsdown bundles + tsc -b emits types
pnpm format
pnpm format:check
```

### Hygiene quartet — run before opening a PR

```bash
pnpm doctor            # runs manypkg + syncpack + knip + type-check in sequence
# Individually:
pnpm dead              # knip — dead files, dead exports, unused deps
pnpm deps              # syncpack lint — version drift across workspaces
pnpm manypkg           # manypkg check — package.json schema rules
pnpm attw              # @arethetypeswrong/cli — verify type exports
pnpm publint           # publint — npm-publish lint
pnpm type-coverage     # type-coverage — ≥ 95% target
```

### Release flow

```bash
pnpm changeset                 # describe semver-meaningful changes
git add .changeset/ && git commit -m "chore(release): add changeset"
# Push. CI opens a "Version Packages" PR.
# Merging that PR triggers npm publish with --provenance.
```

### Docs

```bash
pnpm docs:dev          # VitePress dev server on :5173
pnpm docs:build
```

---

## 4. Coding conventions

### TypeScript

- `strict: true` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Code that compiles is code that ships.
- **Explicit return types on every exported function.** This is enforced by typescript-eslint and is a non-negotiable invariant.
- `verbatimModuleSyntax: true` — use `import type { ... }` for type-only imports.
- No `any`. Use `unknown` then narrow.
- No `// @ts-ignore`. Use `// @ts-expect-error <reason>` with a real reason.
- Module resolution is `Bundler` everywhere (we never run raw `node` on `.ts`; `tsx` or `tsdown` always sits in between).

### Imports

- Sort imports via `eslint-plugin-perfectionist` (auto-fix on save).
- Workspace packages by their published name: `import { logger } from '@pkg/logger'`, never relative paths across workspaces.
- Side-effect-only imports go last.

### Errors

- Throw `Error` subclasses with discriminant `code` strings, never bare `Error` for domain failures.
- Catch `unknown`, narrow with `instanceof` or zod.

### Testing

- Co-locate tests under `src/__tests__/<name>.test.ts`.
- Use Vitest, not Jest — APIs are mostly compatible but the runner is wired for the monorepo.
- Avoid mocking when a real implementation costs <100ms. Use Testcontainers for Postgres, MSW for HTTP.
- Coverage thresholds: lines/statements/functions ≥ 80%, branches ≥ 70%. Don't paper over with `/* istanbul ignore */`.

### TODO discipline

- `// AGENT-TODO(name-or-issue): <why>` — items an AI agent should pick up.
- `// TODO(name): <why>` — human-only work.
- `// FIXME` and `// XXX` warn in ESLint — replace before merge.

---

## 5. Commit / PR conventions

### Commit message

[Conventional Commits](https://www.conventionalcommits.org) — enforced by commitlint:

```
<type>(<scope>): <Subject in sentence case>

<body, wrapped at 120>

<footer — e.g. "Closes #123">
```

- **type:** `feat | fix | refactor | perf | docs | test | build | ci | chore | revert | style`
- **scope:** package or app name (`api-gateway`, `logger`, `config`, …) or cross-cutting (`ci`, `deps`, `docs`, `release`, `security`)
- **subject:** sentence case, no trailing period, ≤ 100 chars

Example:

```
feat(logger): add OpenTelemetry trace-context injection

Wires pino-opentelemetry-transport so every log record carries the
active trace_id / span_id without per-log boilerplate.

Closes #42
```

### PR checklist

- [ ] Changeset added (`pnpm changeset`) OR PR labeled `no-changeset`.
- [ ] `pnpm doctor` passes locally.
- [ ] Tests added/updated for the change.
- [ ] If a public API changed, type-coverage stays ≥ 95% and `pnpm attw` is clean.
- [ ] If new dep added: in the right `packages.json`, version drift checked (`pnpm deps`).
- [ ] If touched a microservice in `apps/`: container builds locally (`docker compose build`).

---

## 6. Adding new things

### A new microservice (`apps/<name>`)

1. Copy `apps/api-gateway` to `apps/<name>`.
2. Update `package.json` (`name: "@app/<name>"`, version `0.0.0`, `private: true`).
3. Add a per-app `AGENTS.md` describing the service.
4. Add to `nx.json` if you need custom targets (usually inferred).
5. Reference from root `tsconfig.json`.
6. Add scope to `commitlint.config.cjs` `scope-enum`.
7. Add to `.changeset/config.json` `ignore` list (apps don't publish to npm).

### A new shared package (`packages/<name>`)

1. Copy `packages/types` (the simplest package as a template).
2. Update `package.json` (`name: "@pkg/<name>"`, version `0.0.0`).
3. Implement; export the public surface from `src/index.ts`.
4. Add an `AGENTS.md` with the package-specific rules.
5. Reference from root `tsconfig.json`.
6. Add scope to commitlint.

### A breaking change

Open an ADR in `docs/adrs/`. Don't merge breaking changes without one.

---

## 7. Out of scope — escalate, don't touch

These changes need a human in the loop:

- Switching package manager, orchestrator, bundler, test runner, or linter.
- Editing CI workflow permissions blocks.
- Editing the `.changeset/config.json` `fixed`/`linked` arrays.
- Adding new secrets (`secrets.*`) to a workflow.
- Editing pinned action SHAs (`uses: <action>@<40-char-sha>` lines).
- Adding new top-level directories.
- Anything in `.github/CODEOWNERS`.

---

## 8. Per-package overrides

If a sub-directory has its own `AGENTS.md`, **that one wins** for files inside it. See:

- [`apps/api-gateway/AGENTS.md`](./apps/api-gateway/AGENTS.md)
- [`apps/worker/AGENTS.md`](./apps/worker/AGENTS.md)
- [`packages/logger/AGENTS.md`](./packages/logger/AGENTS.md)
- [`packages/config/AGENTS.md`](./packages/config/AGENTS.md)
- [`packages/db-client/AGENTS.md`](./packages/db-client/AGENTS.md)
- [`packages/types/AGENTS.md`](./packages/types/AGENTS.md)

---

## 9. Governance — the authoritative rule docs

Conventions are not described in this file (this file is a lighthouse). The **rules** live in:

- [`docs/specs/governance-saas/repo-governance.md`](./docs/specs/governance-saas/repo-governance.md) — naming, style, TypeScript, API, DB, logging, testing, security, docs, releases, PR & ADR processes. **Read this before opening a PR.**
- [`docs/specs/governance-saas/temporal-when-and-when-not.md`](./docs/specs/governance-saas/temporal-when-and-when-not.md) — decision rule for Temporal vs Kafka vs RPC vs cron; determinism, versioning, worker anatomy, replay tests.
- [`docs/specs/governance-saas/saas-commons.md`](./docs/specs/governance-saas/saas-commons.md) — OSS defaults for every SaaS-essential subsystem (billing, analytics, identity, flags, search, email, storage, CMS, audit) with license caveats.
- [`docs/specs/governance-saas/package-architecture-rules.md`](./docs/specs/governance-saas/package-architecture-rules.md) — what goes in `apps/*` vs `packages/*` vs `internal/*`, forbidden patterns, coordinated-deploy rules.
- [`docs/specs/governance-saas/multi-tenancy-isolation-rules.md`](./docs/specs/governance-saas/multi-tenancy-isolation-rules.md) — tenant-context propagation, cross-tenant query rules, deletion + migration playbooks.
- [`docs/specs/governance-saas/governance-process.md`](./docs/specs/governance-saas/governance-process.md) — how to amend the rules; ADR process; review cadence.
- [`GOVERNANCE.md`](./GOVERNANCE.md) — top-level pointer.

If the rules here in `AGENTS.md` ever appear to disagree with the governance docs, **the governance docs win** and this file needs updating.

---

## 10. The `repo` CLI

Everything a developer does in this repo **except writing business logic** runs through a single CLI: **`repo`**. It lives at `internal/cli/`, is built on [citty](https://github.com/unjs/citty), and is `private: true` (never published).

### What it covers

```
repo new        app | package | adr | changeset | workflow | runbook
repo env        render | validate | show
repo dev        up | down | tools | logs | reset
repo db         migrate | status | diff | seed | psql
repo deps       check | sync | audit
repo release    changeset | version | publish
repo lint | format | test | build | type-check | ci | doctor | clean | version | completion
```

Every command accepts `--json` and emits `{ status, message, data? }` — agents can call it safely.

### Common workflows

```bash
repo doctor                  # verify your local env (node/pnpm/docker/configs)
repo dev up                  # bring up postgres / redis / kafka / temporal
repo env render dev          # YAML hierarchy -> docker/.env.rendered
repo new package timing      # scaffold packages/timing/ from template
repo new adr "feature flags via OpenFeature"
repo ci                      # mirror of the CI gate (run before pushing)
```

### Where templates live

Scaffolding templates are at `internal/templates/<kind>/` — files with `{{placeholder}}` tokens. The renderer is a small regex-based copy (no Handlebars). See `internal/cli/AGENTS.md` for how to add a new command or template.

### Adding a new subcommand (quick reference)

1. Create `internal/cli/src/commands/<group>/<sub>.ts` exporting `defineCommand({...})`.
2. Wire it into the parent group's `subCommands` map.
3. If it's a top-level group, also add it to `cli.ts`.
4. Update `TOP` / `SUBS` in `src/commands/completion.ts` for shell completion.
5. Add a test under `internal/cli/src/__tests__/`.

Full guide: [`internal/cli/AGENTS.md`](./internal/cli/AGENTS.md).

---

## 11. Frontend tier

The repo ships a frontend stack alongside the backend microservices. **Next.js is intentionally not in the toolbox** — see ADR-0010.

### Matrix

| Surface                                                 | Framework                                   | Path                         |
| ------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| Marketing + landing pages                               | **Astro 5**                                 | `apps/marketing`             |
| Customer-facing docs                                    | **Astro Starlight**                         | `apps/docs-public`           |
| Internal docs / ADRs                                    | VitePress (existing)                        | `docs/`                      |
| Multi-tenant SaaS web app (`*.app.example.com`)         | **Expo + react-native-web + expo-router 4** | `apps/web-app`               |
| Customer mobile (iOS + Android)                         | **Expo + expo-router 4**                    | `apps/mobile-customer`       |
| Admin mobile (iOS + Android)                            | **Expo + expo-router 4**                    | `apps/mobile-admin`          |
| Edge endpoints (Cloudflare Workers)                     | **Hono**                                    | `infra/cloudflare/workers/*` |
| Heavy-interaction web NOT shared with mobile (reserved) | TanStack Start                              | (no app yet)                 |

### Shared frontend packages

`packages/ui`, `packages/forms`, `packages/tracking`, `packages/consent`, `packages/auth-client`, `packages/tenancy-client`, `packages/api-client`, `packages/cms-client`, `packages/seo`.

See `docs/specs/frontend/` for the full architecture (7 specs).

### Scaffolding

```bash
repo new app marketing my-campaign       # Astro
repo new app docs ops-runbook            # Starlight
repo new app web internal-tool           # Expo + react-native-web
repo new app mobile partner              # Expo native
repo new app api orders                  # Fastify (existing pattern)
repo new app worker temporal-orders      # Temporal worker (existing pattern)
```

Templates under `internal/templates/app-{web,mobile,marketing,docs}/`.

---

## 12. Cloudflare deployment

All public surfaces deploy to **Cloudflare** free tier:

- `apps/marketing`, `apps/docs-public`, `apps/web-app` (web build) → **Pages**
- Edge logic (tenant routing, webhook receivers) → **Workers** (Hono)
- Static assets, CMS media → **R2** (S3-compatible, zero egress)
- Marketing forms data → **D1** (SQLite at edge)
- Edge config, feature flags → **KV**
- CAPTCHA → **Turnstile**
- Page-view analytics → **Cloudflare Web Analytics** (alongside Umami)
- Local-dev tunnels → **cloudflared** (`repo dev tunnels`)

Wrangler is the only IaC tool — see `infra/cloudflare/`. ADR-0011 documents the rationale; `docs/specs/frontend/cloudflare-deployment.md` documents the configuration.

---

## 13. Useful references

- [`docs/adrs/0001-tsdown-over-tsup.md`](./docs/adrs/0001-tsdown-over-tsup.md)
- [`docs/adrs/0002-changesets-over-release-please.md`](./docs/adrs/0002-changesets-over-release-please.md)
- [`docs/adrs/0003-eslint-over-biome.md`](./docs/adrs/0003-eslint-over-biome.md)
- [`docs/adrs/0004-nx-over-turborepo.md`](./docs/adrs/0004-nx-over-turborepo.md)
- [`docs/adrs/0005-sha-pinned-github-actions.md`](./docs/adrs/0005-sha-pinned-github-actions.md)
- [`docs/adrs/0006-yaml-config-with-c12.md`](./docs/adrs/0006-yaml-config-with-c12.md)
- [`docs/adrs/0007-repo-cli-as-dev-interface.md`](./docs/adrs/0007-repo-cli-as-dev-interface.md)
- [`docs/adrs/0008-astro-for-content-sites.md`](./docs/adrs/0008-astro-for-content-sites.md)
- [`docs/adrs/0009-expo-for-mobile-and-web-app.md`](./docs/adrs/0009-expo-for-mobile-and-web-app.md)
- [`docs/adrs/0010-eliminating-or-limiting-nextjs.md`](./docs/adrs/0010-eliminating-or-limiting-nextjs.md)
- [`docs/adrs/0011-cloudflare-edge-deployment.md`](./docs/adrs/0011-cloudflare-edge-deployment.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)
- [`GOVERNANCE.md`](./GOVERNANCE.md)

---

## Platform foundation spec

The authoritative architecture for this repo is [`docs/superpowers/specs/2026-06-03-platform-foundation-design.md`](docs/superpowers/specs/2026-06-03-platform-foundation-design.md). Read it before touching `apps/`, `packages/`, `internal/`, `infra/`, or `profiles/`.

Cascade rule (spec section 15.8): the nearest `AGENTS.md` wins. Agents walk from the current directory upward, merging shallow, child overrides parent.
