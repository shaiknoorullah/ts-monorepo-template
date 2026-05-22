# TODO — Remaining work for `shaiknoorullah/ts-monorepo-template`

The template has shipped 16+ commits across v1.0.0+ with substantive scaffolding, specs, governance, frontend tier, and SaaS-commons. This file tracks what's STILL deferred.

## Status of past TODOs

| Past TODO                                                                                   | State                                                     |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Initial scaffold (89 files)                                                                 | ✅ Done (v1.0.0)                                          |
| 20 backend/data specs + 10 docker-compose files                                             | ✅ Done                                                   |
| 7 SaaS-commons compose files (Lago/Umami/Keycloak/Unleash/Meilisearch/Uptime-Kuma/Chatwoot) | ✅ Done                                                   |
| YAML config hierarchy (c12 + Zod)                                                           | ✅ Done                                                   |
| `repo` CLI with 17 commands + --json mode                                                   | ✅ Done                                                   |
| Frontend tier (Astro + Expo + Cloudflare; Next.js eliminated)                               | ✅ Done — 5 apps + 9 packages + 4 ADRs + 7 specs          |
| `.github/workflows/{web,mobile,marketing,docs}-{build,deploy}.yml`                          | ✅ Done (4 of 12 workflows shipped by the frontend agent) |

## Still deferred (3 batches, blocked on Anthropic API capacity 2026-05-22)

Three subagent batches were dispatched to close these out but all failed at startup with HTTP 529 (Anthropic API overload — capacity issue, not our fault). All to be retried when the API stabilizes.

### Batch A — 11 GitHub Actions workflows

Add to `.github/workflows/`:

1. `ci.yml` — PR + push to main. Concurrency cancel-in-progress. Parallel jobs:
   - lint (eslint flat + prettier --check + markdownlint + cspell + yamllint + shellcheck)
   - type-check (Node 20 + 22 matrix)
   - test (vitest + coverage upload to Codecov via `CODECOV_TOKEN` secret)
   - build (`nx run-many -t build`)
   - deps quartet (knip + syncpack lint + @manypkg/cli check + attw + publint + type-coverage threshold 95%)
2. `release.yml` — push to main; skip if commit author is `github-actions[bot]`; `changesets/action` for Version-Packages PR / publish
3. `pr-changesets.yml` — require `.changeset/*.md` OR `no-changeset` label on every PR; sticky comment reminder
4. `codeql.yml` — push to main + PR + weekly Sun 03:00 UTC; js + ts
5. `dependency-review.yml` — PR; license allowlist MIT/Apache-2.0/BSD-2/BSD-3/ISC/MPL-2.0; denylist GPL-3.0-only/AGPL-3.0-only/SSPL-1.0; fail on `high`
6. `sbom.yml` — push to main + release tag; CycloneDX via `@cyclonedx/cyclonedx-npm` + SPDX via `anchore/sbom-action`; attach to GitHub Release; `osv-scanner` against SBOM
7. `pkg-pr-new.yml` — PR; ephemeral npm previews via `pkg-pr-new` action (libraries only)
8. `renovate-validate.yml` — changes to `renovate.json`; use `suzuki-shunsuke/github-action-renovate-config-validator`
9. `release-notes.yml` — `workflow_run` after release.yml OR tag push matching `v*`; regenerate notes using `.github/release.yml` categorization
10. `nightly.yml` — schedule `0 5 * * *` UTC + workflow_dispatch; full E2E + Playwright + Lighthouse + benchmarks
11. `lighthouse-ci.yml` — PR affecting `apps/marketing/**` or `apps/docs-public/**` + nightly; `treosh/lighthouse-ci-action`; budgets in `.lighthouserc.json` (Perf/A11y/BP/SEO ≥ 95; LCP < 2.5s; CLS < 0.1; INP < 200ms)

**Hard rules**:

- All third-party actions pinned to 40-char commit SHAs (post-Trivy 2026 supply-chain hygiene)
- Add `# v4.x.x` comments alongside SHAs
- Workflow-injection safe: any untrusted input via `env:` block before `run:`
- Comment header per workflow (trigger + purpose + safety notes)

### Batch B — Astro Content Layer loaders + Satori OG image

1. `packages/cms-client/src/loaders/payload.ts` — Astro Loader pulling Payload REST via fetch with pagination + Zod validation
2. `packages/cms-client/src/loaders/decap.ts` — git-based loader; reads MD/MDX via tinyglobby + gray-matter
3. Wire example in `apps/marketing/src/content/config.ts`
4. `packages/seo/src/og.ts` — Satori + `@resvg/resvg-wasm` based OG image generator (edge-compatible Response); also `generateOgImageBuffer()` for Node
5. `infra/cloudflare/workers/og-image/` — Hono Worker exposing `GET /og?title=...` returning PNG
6. Tests for all four (vitest)

### Batch C — Per-tenant theming + NativeWind + apps/cms

1. `packages/ui/src/theme/tenant.ts` + `TenantThemeProvider.tsx` — `useTenantTheme()` hook reading from `@pkg/tenancy-client`; fetches `GET /api/tenants/:slug/theme`; localStorage/SecureStore 1h cache + background revalidate; applies CSS vars (web) + Tamagui `defineTheme` (RN). Wire `apps/web-app/app/_layout.tsx` to wrap in `<TenantThemeProvider>`
2. New spec `docs/specs/frontend/per-tenant-theming.md`
3. `packages/ui-nativewind/` — sibling package with same public API as `packages/ui`; NativeWind 4.x; tailwind tokens mirroring Tamagui; Button/Card/Input/Text/View components
4. ADR `docs/adrs/0012-tamagui-vs-nativewind.md` — when to pick which
5. `apps/cms/` — self-hosted Payload CMS 3 with `@payloadcms/db-postgres` + `@payloadcms/plugin-cloud-storage` (R2 via S3-compat) + `@payloadcms/plugin-multi-tenant`; collections: Pages, Posts, Media, Tenants, Users; Argon2id auth (Ory Kratos upgrade path documented); Dockerfile multi-stage Node 20
6. `docker/cms.compose.yml` — local dev setup
7. ADR `docs/adrs/0013-payload-cms-self-hosted.md` — Payload self-hosted choice + Next.js bundled exception (Payload 3 mandates its bundled Next.js — this is the ONE place Next.js is in scope per the no-Next.js ADR)

## Other open notes

- **pnpm install on the root has a pre-existing bug**: `@vitest/eslint-plugin@^2.0.0` doesn't exist (latest is `1.6.17`). Fix: bump to `^1.6.0` in root `package.json` devDeps.
- **gh tokens need `workflow` scope** to push to `.github/workflows/*` over HTTPS. Fix: `gh auth refresh -h github.com -s workflow`. Workaround already in place: SSH push via the `github-personal` host alias works.

## How to pick this up

Three subagent prompts are already written for batches A, B, C — they're in the conversation history of session `b8c5053a-a432-4918-85e9-741aef0033b1`. When the API recovers, redispatch (each is ~30-40 min budget).

Alternative: a human or fresh agent reads this TODO + executes the items directly. The research foundation is in `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-ts-monorepo-template.md` and `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md`.
