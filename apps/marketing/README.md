# @app/marketing

Astro 5 marketing + landing pages. Deploys to Cloudflare Pages.

## Local dev

```bash
pnpm --filter @app/marketing dev
```

Open <http://localhost:4321>.

## Build

```bash
pnpm --filter @app/marketing build
```

Output: `dist/`.

## Deploy

```bash
pnpm --filter @app/marketing exec wrangler pages deploy dist
```

Or CI: `.github/workflows/marketing-deploy.yml`.

## Stack

- Astro 5 with Cloudflare adapter (`@astrojs/cloudflare`)
- `@astrojs/sitemap`, `@astrojs/mdx`, `@astrojs/rss`
- `@pkg/ui`, `@pkg/forms`, `@pkg/consent`, `@pkg/tracking`, `@pkg/seo`
- Forms backed by Cloudflare D1 + Turnstile
- Analytics via Umami + Cloudflare Web Analytics (`@pkg/tracking`)

## Performance budgets

- Lighthouse Performance ≥ 95
- LCP < 1.5s slow-4G
- Initial JS < 50 KB gzipped per page

See `docs/specs/frontend/marketing-and-landing-pages.md`.
