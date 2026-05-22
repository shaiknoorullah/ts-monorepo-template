# TODO — Follow-up work

The initial scaffold (89 files) landed at v1.0.0, but two areas need to be
populated in a follow-up:

## 1. `.github/workflows/` — empty

The 12 workflows specified in the build prompt were not populated before the
build subagent's output was blocked by content filtering. The directory exists
but contains no `.yml` files.

Workflows to add (per the research file at
`~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-ts-monorepo-template.md`):

- `ci.yml` — lint + type-check + test + build matrix, with knip + syncpack +
  manypkg + attw + publint + type-coverage
- `release.yml` — changesets action on push to main
- `pr-changesets.yml` — gate every PR on a changeset (or `no-changeset` label)
- `codeql.yml`
- `dependency-review.yml`
- `sbom.yml`
- `docker-build.yml` (per-microservice, with Trivy)
- `docs-deploy.yml` (VitePress → Pages)
- `pkg-pr-new.yml` (per-PR npm preview)
- `renovate-validate.yml`
- `release-notes.yml`
- `nightly.yml`

All third-party actions must be pinned to 40-char commit SHAs (post-Trivy
March-2026 incident; not version tags).

## 2. `docs/adrs/` — empty

Five Architecture Decision Records were planned but not written:

- `0001-tsdown-over-tsup.md` — why tsdown, not tsup (tsup is in maintenance)
- `0002-changesets-over-release-please.md` — independent per-package versioning
- `0003-eslint-over-biome.md` — Biome pins exact versions; flat-config ESLint chosen
- `0004-agents-md-universal-spec.md` — AGENTS.md is read by all major AI coding agents
- `0005-pin-actions-to-shas.md` — supply-chain hygiene

## 3. Sample app/package `src/` directories

`apps/api-gateway/src/`, `apps/worker/src/`, and the four `packages/*/src/` exist
but may be empty. Per the research, populate with:

- `api-gateway` — Fastify or Hono `GET /health`
- `worker` — BullMQ or similar background job stub
- `logger` — Pino-based shared logger
- `config` — Zod env config loader
- `db-client` — drizzle-orm or kysely Postgres wrapper
- `types` — shared TypeScript types

Each `src/__tests__/index.test.ts` with a minimal passing test.

## How to finish

Open a new Claude Code session, point at the research file, and ask:
"Read `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-ts-monorepo-template.md`
and finish the populating the workflows in `.github/workflows/`, the ADRs in
`docs/adrs/`, and the `src/` directories per the research. SHA-pin all
third-party GitHub Actions. Commit and push."

The template flag is already set on the repo, so anyone can use
`gh repo create my-monorepo --template shaiknoorullah/ts-monorepo-template`
right now — they'll get the scaffold, just without the workflows + ADRs.
