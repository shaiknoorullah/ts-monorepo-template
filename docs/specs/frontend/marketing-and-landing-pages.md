---
title: Marketing and landing pages
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://docs.astro.build/
  - https://astro.build/blog/astro-5/
  - https://docs.astro.build/en/guides/integrations-guide/cloudflare/
  - https://payloadcms.com/docs
  - https://decapcms.org/docs/
  - https://react-hook-form.com/
  - https://conform.guide/
  - https://cookieconsent.orestbida.com/
  - https://umami.is/docs
  - https://sonner.emilkowal.ski/
  - https://docs.astro.build/en/guides/integrations-guide/sitemap/
---

# Marketing and landing pages

`apps/marketing` is the public face. Astro 5, Cloudflare Pages, content from a mix of local Markdown + headless CMS.

## Routes

```
apps/marketing/src/pages/
├── index.astro                      → /
├── about.astro                      → /about
├── pricing.astro                    → /pricing
├── blog/
│   └── [...slug].astro              → /blog/*
├── landing/
│   └── [campaign].astro             → /landing/<campaign>
├── contact.astro                    → /contact
└── legal/
    ├── privacy.astro
    ├── terms.astro
    └── cookies.astro
```

## Content sources

Two-tier:

1. **Local content** — `src/content/<collection>/*.md(x)`. Permanent pages (about, pricing copy, legal). Versioned in git.
2. **CMS content** — campaign landing pages, blog posts, marketing announcements. Loaded via Astro Content Layer from Payload CMS (or Decap CMS).

The Content Layer loader for Payload lives in `packages/cms-client/src/astro-loader.ts`. Both sources are exposed via `getCollection('<name>')` with Zod-validated frontmatter.

## CMS choice

**Default: Payload CMS 3** (TS-native, MIT, self-host). See <https://payloadcms.com/>.

**Lighter: Decap CMS** (git-backed, MIT, no Node service required). See <https://decapcms.org/>.

Pick at template-init time; not at runtime.

## Forms

- **React Hook Form + Zod** for client-side interactive forms (booking widgets, multi-step funnels).
- **@conform-to/react** for forms that must work without JS (newsletter signups, contact forms posted via Astro endpoint).

Form endpoints live at `apps/marketing/src/pages/api/<form>.ts`. Spam protection via **Cloudflare Turnstile** — free, replaces reCAPTCHA. Submissions land in:

- **D1** (Cloudflare SQLite at edge) for marketing-form metadata.
- **R2** for any attachments.
- (Optionally) a webhook to the SaaS app's API for sales-ready leads.

## Consent / Cookies

- `packages/consent` wraps **vanilla-cookieconsent v3** with a typed API.
- Categories: necessary, functional, analytics, marketing.
- The consent banner appears on first visit; preferences are stored in localStorage + a `consent` cookie.
- `packages/tracking` reads consent state and refuses to fire analytics events when the relevant category is not granted.

## Tracking / Analytics

- **Primary: Umami v2** — self-hosted, MIT, already in `docker/umami.compose.yml`.
- **Backup: Cloudflare Web Analytics** — free, no cookies, no on-page JS in observe-only mode.
- All tracking calls go through `packages/tracking`. Single API:

```ts
import { track } from '@pkg/tracking'

track('cta_click', { campaign: 'spring-2026', variant: 'A' })
```

- Tracking is consent-gated. No tracker fires without the `analytics` consent category.

## Toasts / Alerts

- Marketing uses **sonner** (web-only, MIT).
- Toast styles live in `packages/ui`. The marketing site imports the web variants only.

## SEO

- `@astrojs/sitemap` — sitemap.xml generated on build.
- `@astrojs/rss` — RSS feeds for blog.
- `packages/seo` — OpenGraph helpers + JSON-LD builders (Organization, Article, FAQPage, BreadcrumbList).
- Robots.txt template at `apps/marketing/public/robots.txt`.
- Per-route OG image generation via Astro's image pipeline + `satori`-based dynamic OG.

## Performance budgets

- Lighthouse Performance ≥ 95 on every page.
- LCP < 1.5s on slow 4G.
- CLS < 0.05.
- Initial JS payload < 50 KB gzipped per page (islands only).
- No render-blocking 3rd-party scripts above the fold.

CI checks these via `treosh/lighthouse-ci-action` on every preview deploy.

## Deploy

Cloudflare Pages.

```bash
pnpm --filter @app/marketing build
pnpm --filter @app/marketing wrangler pages deploy dist
```

Or via CI: `.github/workflows/marketing-deploy.yml` runs on every push to main + preview deploys on PR.

## Adding a landing page

```bash
repo new app marketing            # would create a new sibling marketing app (rare)
```

For a **route within the existing marketing app**:

```bash
# manual — add src/pages/landing/<campaign>.astro
```

Or, if the campaign needs full isolation (different theme, no shared header/footer), create a sibling app:

```bash
repo new app marketing lp-spring-2026
```

This adds `apps/lp-spring-2026/`.

## A/B testing

Server Islands + Cloudflare Workers + KV. Variant decision made at edge:

1. Worker reads `assignment` cookie or sets one based on a hash of the visitor's CF-Ray.
2. Worker rewrites the Astro response via HTMLRewriter to swap server-island slots.
3. Conversion tracked via `packages/tracking`.

This avoids client-side flicker (no FOUC) and avoids vendor lock-in to a paid A/B service.

## Open follow-ups

- AGENT-TODO: scaffold Payload Astro Content Layer loader in `packages/cms-client`.
- AGENT-TODO: scaffold OG image generator under `packages/seo`.
- AGENT-TODO: Lighthouse CI workflow.
