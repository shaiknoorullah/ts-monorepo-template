---
title: Frontend package architecture
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
---

# Frontend package architecture

Frontend shared code lives in `packages/<name>/`. Apps consume packages; packages never consume apps.

## Packages

| Package | Purpose | Consumers |
|---|---|---|
| `@pkg/ui` | Cross-platform UI primitives (Tamagui or NativeWind). Tokens, themes, primitives, patterns, icons. | `apps/web-app`, `apps/mobile-*`, `apps/marketing`, `apps/docs-public` |
| `@pkg/forms` | RHF + Zod helpers, FormField primitives, Conform progressive-enhancement helpers. | `apps/web-app`, `apps/mobile-*`, `apps/marketing` |
| `@pkg/tracking` | Unified `track(event, props)` API. Routes to Umami + CF Web Analytics. Consent-gated. | All apps |
| `@pkg/consent` | vanilla-cookieconsent v3 wrapper. Category management, preference store. | `apps/marketing`, `apps/docs-public`, `apps/web-app` (web) |
| `@pkg/auth-client` | Ory/Keycloak client. Web + RN variants. | `apps/web-app`, `apps/mobile-*` |
| `@pkg/tenancy-client` | Tenant resolution: subdomain on web, deep link / profile on native. | `apps/web-app`, `apps/mobile-*` |
| `@pkg/api-client` | Typed fetch wrapper. Reads tenancy + auth context. | All app-side surfaces |
| `@pkg/cms-client` | Payload / Decap CMS fetch helpers + Astro Content Layer loader. | `apps/marketing`, `apps/docs-public` |
| `@pkg/seo` | OpenGraph helpers, JSON-LD builders, sitemap helpers. | `apps/marketing`, `apps/docs-public` |

## Dependency rules

- **`packages/* → packages/*`** allowed if the import direction is acyclic. `manypkg` enforces this.
- **`packages/* → apps/*`** forbidden. Manypkg enforces.
- **A package that ships to mobile** must not import web-only globals (`window`, `document`). Lint rule: `no-restricted-globals` in shared package configs.
- **Platform-specific code** lives in `.web.ts` / `.native.ts` variants — bundlers resolve.

## Public surface conventions

Each package exports from `src/index.ts`. Sub-paths exist for tree-shaking-sensitive consumers:

- `@pkg/ui` → primary surface
- `@pkg/ui/icons` → icons (don't ship icons if you only need primitives)
- `@pkg/ui/web` → web-only patterns
- `@pkg/seo/jsonld` → JSON-LD builders (don't pull the whole package for one helper)

Sub-paths declared in `package.json` `exports`. `attw` verifies.

## Versioning

All frontend packages are **independently versioned** via changesets — same as the rest of the repo.

## `packages/ui` (already detailed in ui-package-shared-components.md)

See that spec.

## `packages/forms`

Composition primitives:

```
packages/forms/
├── src/
│   ├── index.ts
│   ├── createForm.ts          (RHF + Zod resolver wrapper)
│   ├── fields/
│   │   ├── TextField.tsx
│   │   ├── NumberField.tsx
│   │   ├── SelectField.tsx
│   │   ├── CheckboxField.tsx
│   │   └── DateField.tsx
│   ├── conform/
│   │   └── (Conform helpers for Astro / SSR forms)
│   └── schemas/
│       └── (common Zod schemas — Email, Phone, etc.)
└── README.md
```

Public API sketch:

```ts
import { createForm, TextField, SelectField } from '@pkg/forms'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(10),
})

function ContactForm() {
  const form = createForm({ schema: ContactSchema, onSubmit: (values) => api.contact(values) })
  return (
    <form.Form>
      <TextField name="name" label="Name" />
      <TextField name="email" label="Email" />
      <TextField name="message" label="Message" multiline />
      <form.Submit>Send</form.Submit>
    </form.Form>
  )
}
```

## `packages/tracking`

```
packages/tracking/
├── src/
│   ├── index.ts
│   ├── providers/
│   │   ├── umami.ts
│   │   └── cf-web-analytics.ts
│   ├── consent.ts             (consent-gate; reads packages/consent state)
│   ├── track.ts               (unified API)
│   └── types.ts
└── README.md
```

Public API:

```ts
import { track, identify, page } from '@pkg/tracking'

track('cta_click', { campaign: 'spring-2026' })
identify(user.id, { plan: 'pro' })
page('/pricing')
```

Tracking refuses to fire if `analytics` consent is not granted. No events are queued without consent — drops loud.

## `packages/consent`

```
packages/consent/
├── src/
│   ├── index.ts
│   ├── banner.ts              (vanilla-cookieconsent v3 wrapper)
│   ├── categories.ts          (necessary | functional | analytics | marketing)
│   ├── store.ts               (Zustand persisted to storage)
│   └── react.ts               (useConsent() hook)
└── README.md
```

Single source of truth for consent state. Other packages consume `useConsent()` to gate behaviour.

## `packages/auth-client`

```
packages/auth-client/
├── src/
│   ├── index.ts
│   ├── client.web.ts          (browser — cookie-based session)
│   ├── client.native.ts       (RN — Secure Store + biometric)
│   ├── hooks.ts               (useUser, useSession, useSignIn, useSignOut)
│   └── types.ts
└── README.md
```

Wraps Ory Kratos (default) or Keycloak. Same public API regardless of backend; backend choice is a build-time config.

## `packages/tenancy-client`

```
packages/tenancy-client/
├── src/
│   ├── index.ts
│   ├── resolver.web.ts        (subdomain → tenant_slug)
│   ├── resolver.native.ts     (deep link / profile lookup)
│   ├── context.tsx            (React context provider)
│   └── hooks.ts               (useTenant, useTenantSlug)
└── README.md
```

The tenant context flows into `packages/api-client` automatically.

## `packages/api-client`

```
packages/api-client/
├── src/
│   ├── index.ts
│   ├── fetcher.ts             (typed wrapper — adds auth + tenancy headers)
│   ├── openapi-types.ts       (generated from api-gateway's OpenAPI doc)
│   └── react.ts               (React Query integration)
└── README.md
```

Types are generated from the API gateway's OpenAPI spec via `openapi-typescript`. Hand-coded types are forbidden in this package.

## `packages/cms-client`

```
packages/cms-client/
├── src/
│   ├── index.ts
│   ├── payload/               (Payload REST + GraphQL client)
│   ├── decap/                 (Decap git-backed reader)
│   ├── astro-loader.ts        (Astro Content Layer loader for either backend)
│   └── types.ts
└── README.md
```

A single `getCollection<T>()` interface regardless of CMS backend.

## `packages/seo`

```
packages/seo/
├── src/
│   ├── index.ts
│   ├── og.ts                  (OpenGraph + Twitter meta builders)
│   ├── jsonld.ts              (Organization, Article, FAQPage, BreadcrumbList, Product)
│   ├── sitemap.ts             (typed sitemap entry builders)
│   └── robots.ts              (robots.txt builders)
└── README.md
```

Adapters for Astro (`<SEO />` component), React (`<Head>` portal), and Expo Web (head injection).

## Tests

Each package ships unit tests under `src/__tests__/`. Coverage budgets per repo-governance.md (≥ 80%).

## Documentation

Each package ships:

- `README.md` — what it does, how to use, examples.
- `AGENTS.md` — rules an AI agent must follow inside this package.
- TSDoc on every exported symbol.

## Adding a frontend package

```bash
repo new package ui-some-helper
```

The default `internal/templates/package/` template works. Add a frontend-specific template only if the new package needs RN-aware exports (`.web.ts` / `.native.ts`).
