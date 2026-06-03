# ADR-0008: Astro for content sites (marketing + docs)

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

The template needs a content-first surface for marketing, landing pages, and customer-facing documentation. Two non-negotiables:

1. **Zero JS by default.** A marketing page is mostly read-once; shipping a React tree for hydration is waste.
2. **Cloudflare-deployable.** No reliance on a single PaaS's proprietary build output.

Candidates surveyed (full notes in `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md`):

- Astro 5
- Eleventy 3
- Vike
- Hono + JSX
- Next.js App Router (rejected — see ADR-0010)
- Qwik
- VitePress (existing, kept for internal docs only)

## Decision

Adopt **Astro 5** for `apps/marketing` (marketing + landing pages) and **Astro Starlight** for `apps/docs-public` (customer-facing docs).

### Why Astro 5

- Zero JS by default; islands ship JS only where opted-in.
- Content Layer API supports both local Markdown collections and remote CMS via a single typed loader.
- Server Islands for personalized fragments without going full SSR.
- Built-in `<Image />` with Sharp + AVIF/WebP negotiation.
- View Transitions API integrated; no per-page plumbing.
- First-class Cloudflare adapter — Pages + Workers + the `runtime: { mode: 'local' }` for dev parity. <https://docs.astro.build/en/guides/integrations-guide/cloudflare/>
- Official sitemap + RSS + robots integrations — no third-party patchwork.
- MIT licensed.

### Why Starlight for customer docs

- Pagefind search (offline-indexed, no backend).
- Sidebar, version selector, i18n, dark mode out of the box.
- Same Astro runtime — one mental model.
- MIT licensed.

### Why NOT the others (one-line)

- **Eleventy** — no native TS, no image pipeline, no islands. We'd rebuild what Astro gives.
- **Vike** — flexible page-level rendering modes, but Astro's adapter ecosystem for our CF target is more polished.
- **Hono** — backend-at-edge tool, not a page-rendering framework. Use Hono for Workers (webhooks, edge auth), not marketing.
- **Next.js** — eliminated (ADR-0010).
- **Qwik** — no native bridge; can't share with mobile via RN.

## Consequences

### Positive

- Marketing pages routinely hit Lighthouse ≥ 95 with no perf engineering.
- One framework (Astro) covers marketing, landing, and customer docs — single mental model.
- Cloudflare Pages deploy is one wrangler command per app.
- Content Layer means CMS choice can change without touching consumer code.

### Negative

- Astro's component model is its own — `.astro` files. Engineers used to "everything is React" pay an onboarding moment.
- Server Islands force the page to be dynamic-ish (CF Worker hits a function). We use islands sparingly.
- Tamagui primitives in `packages/ui` are React; integrating them in Astro means React islands. Pay the React island cost only where interactive UI is needed.

### Neutral / Follow-up

- Internal docs continue on VitePress — already wired; no migration value.
- A future "ops console" surface that's too interactive for Astro will use TanStack Start (ADR pending).

## Alternatives considered

(See research file for full notes.)

- **Next.js App Router** — eliminated. ADR-0010.
- **TanStack Start** — for app-like surfaces; not for static-first content.
- **Vike** — viable but Astro wins on ecosystem maturity.
- **Eleventy** — too thin for our needs.
- **Qwik** — niche choice, ecosystem too small for our cross-platform reuse.

## References

- [Astro 5 announcement](https://astro.build/blog/astro-5/)
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Starlight](https://starlight.astro.build/)
- [Pagefind](https://pagefind.app/)
- `docs/specs/frontend/framework-choices.md`
- `docs/specs/frontend/marketing-and-landing-pages.md`
- `docs/specs/frontend/documentation-sites.md`
- Research: `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md` §2.1, §6.1
