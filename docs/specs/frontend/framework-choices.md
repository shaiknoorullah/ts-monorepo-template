---
title: Frontend framework choices
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://docs.astro.build/
  - https://docs.expo.dev/
  - https://tanstack.com/start/
  - https://hono.dev/
  - https://opennext.js.org/cloudflare
  - https://nextjs.org/docs
---

# Framework choices

A small, opinionated set of frameworks. Each owns a distinct surface. **Next.js is intentionally not in this set** — see ADR-0010.

## The matrix

| Surface | Framework | Repo path |
|---|---|---|
| Marketing site (`www.*`) | Astro 5 | `apps/marketing` |
| Per-campaign landing pages | Astro 5 (routes within marketing, or a sibling app) | `apps/marketing/src/pages/landing/*` |
| Customer-facing docs (`docs.*`) | Astro Starlight | `apps/docs-public` |
| Internal docs / ADRs | VitePress (already in repo) | `docs/` |
| Multi-tenant SaaS web app (`app.*.example.com`) | Expo + react-native-web + expo-router 4 | `apps/web-app` |
| Customer mobile (iOS + Android) | Expo + expo-router 4 | `apps/mobile-customer` |
| Admin mobile (iOS + Android) | Expo + expo-router 4 | `apps/mobile-admin` |
| Edge endpoint / webhook / lightweight API at edge | Hono on Cloudflare Workers | `apps/<name>-worker` (Hono) |
| Heavy-interaction web surface NOT shared with mobile | TanStack Start | (not in initial scope — documented fallback) |
| Anything else | **ASK before defaulting** | — |

## Decision tree

```
[ Is the surface content-first (mostly read, occasional interaction)? ]
         |                                 |
        YES                                NO
         |                                 |
[ Customer-facing docs site? ]    [ Is the surface shared with mobile? ]
   |             |                       |              |
  YES            NO                     YES             NO
   |             |                       |              |
Starlight     Astro 5                   Expo +         [ Is it heavy-interaction? ]
                                       react-native-     |             |
                                       web              YES            NO
                                                        |              |
                                                  TanStack Start    Astro (islands)
```

## Rules

1. **Default to the lightest viable framework.** If Astro can do it with islands, it should.
2. **One codebase across web + native demands Expo.** Don't try to share code between Astro/TanStack Start and React Native by hand.
3. **Hono is for backend-at-the-edge.** Not for rendering whole pages. (For a page-rendering edge runtime, use Astro's CF adapter.)
4. **TanStack Start is reserved.** It's documented as a fallback for a future surface that doesn't fit the rules above. Do not add a TanStack Start app without an ADR.
5. **Never add Next.js to this repo.** A consumer who clones the template can add Next.js themselves; the template ships without it. See ADR-0010.

## Why these and not others

- **Eleventy** — pure SSG, no native TS, no out-of-the-box image pipeline. Astro covers the same ground better.
- **Vike** — flexible, but Astro's adapter ecosystem is more polished for our CF deploy target.
- **Qwik** — interesting resumability model, but no native bridge — we'd lose the cross-platform reuse Expo gives us.
- **Rsbuild / Rspack** — for migrating off webpack. Not relevant to greenfield.
- **React Router v7 (Remix successor)** — competitive with TanStack Start. Picked Start for superior type-safety.
- **Next.js** — eliminated. ADR-0010 has the full argument.

## Adding a new app

Use the CLI:

```bash
repo new app marketing my-campaign       # Astro
repo new app docs ops-runbook            # Starlight
repo new app web internal-tool           # Expo + react-native-web
repo new app mobile partner              # Expo (native only)
repo new app api orders                  # Fastify (existing pattern)
repo new app worker temporal-orders      # Temporal worker (existing pattern)
```

The archetype determines the template under `internal/templates/app-<archetype>/`.

## When to ASK

- A surface that doesn't fit any row in the matrix.
- A consumer's hard requirement for Next.js (App Router specifics, RSC ergonomics).
- A need for a non-Expo native framework (Flutter, Compose Multiplatform).
- A surface needing real-time collaborative editing at edge — likely a Durable Object + Hono pattern, not in the default matrix.

Open an ADR before adding anything not in the matrix.
