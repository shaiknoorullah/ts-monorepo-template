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

## 9. Useful references

- [`docs/adrs/0001-tsdown-over-tsup.md`](./docs/adrs/0001-tsdown-over-tsup.md)
- [`docs/adrs/0002-changesets-over-release-please.md`](./docs/adrs/0002-changesets-over-release-please.md)
- [`docs/adrs/0003-eslint-over-biome.md`](./docs/adrs/0003-eslint-over-biome.md)
- [`docs/adrs/0004-nx-over-turborepo.md`](./docs/adrs/0004-nx-over-turborepo.md)
- [`docs/adrs/0005-sha-pinned-github-actions.md`](./docs/adrs/0005-sha-pinned-github-actions.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)
