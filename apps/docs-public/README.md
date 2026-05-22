# @app/docs-public

Customer-facing documentation. Astro Starlight on Cloudflare Pages.

## Local dev

```bash
pnpm --filter @app/docs-public dev
```

Open <http://localhost:4322>.

## Build + deploy

```bash
pnpm --filter @app/docs-public build
pnpm --filter @app/docs-public exec wrangler pages deploy dist
```

## Adding a doc

Add a Markdown file under `src/content/docs/`. Frontmatter:

```yaml
---
title: ...
description: ...
---
```

Sidebar is wired in `astro.config.mjs`. `autogenerate: { directory: 'guides' }` will pick up new files under `src/content/docs/guides/` automatically.

## Search

Pagefind. Indexed at build time. No backend required.

See `docs/specs/frontend/documentation-sites.md`.
