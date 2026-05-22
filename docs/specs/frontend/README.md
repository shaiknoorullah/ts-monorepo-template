---
title: Frontend specs index
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
---

# Frontend specs

The chosen frontend stack for this monorepo and the rules for using it.

| Spec                                                                   | Purpose                                                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [framework-choices.md](./framework-choices.md)                         | Decision tree: when to use Astro, Expo, TanStack Start, Hono. Eliminates Next.js.                                            |
| [mobile-and-cross-platform.md](./mobile-and-cross-platform.md)         | Expo SDK + expo-router 4. Code sharing with web via react-native-web. Per-persona mobile apps.                               |
| [marketing-and-landing-pages.md](./marketing-and-landing-pages.md)     | Astro 5 marketing site. CMS, forms, consent, toasts, tracking, SEO.                                                          |
| [documentation-sites.md](./documentation-sites.md)                     | Astro Starlight for customer docs. VitePress for internal.                                                                   |
| [cloudflare-deployment.md](./cloudflare-deployment.md)                 | Cloudflare Pages + Workers + R2 + D1 + KV + Turnstile. Free-tier deploy.                                                     |
| [ui-package-shared-components.md](./ui-package-shared-components.md)   | `packages/ui` design — Tamagui by default; NativeWind alternative.                                                           |
| [frontend-package-architecture.md](./frontend-package-architecture.md) | Layout of shared frontend packages — ui, forms, tracking, consent, auth-client, tenancy-client, api-client, cms-client, seo. |

Foundational research: `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md`.

ADRs that govern this section:

- ADR-0008 — Astro for content sites
- ADR-0009 — Expo for mobile and web-app
- ADR-0010 — Eliminating Next.js
- ADR-0011 — Cloudflare edge deployment
