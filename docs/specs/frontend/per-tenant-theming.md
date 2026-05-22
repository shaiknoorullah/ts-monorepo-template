# Per-tenant theming

**Status:** Accepted
**Owner:** frontend tier
**Last revised:** 2026-05-22

## Goal

Let each tenant override the brand palette + logo without a deploy. The
override must apply to:

- Astro marketing pages (server-rendered)
- Expo web-app (RN-Web + Tamagui)
- Expo native (iOS + Android)
- Email templates (out of scope here — see `governance-saas/email`)

## Source of truth

`GET /api/tenants/:slug/theme` returns a `TenantThemePayload`:

```ts
{
  brand?: string
  surface?: string
  surfaceMuted?: string
  border?: string
  text?: string
  textMuted?: string
  success?: string
  warning?: string
  danger?: string
  info?: string
  logoUrl?: string
}
```

Every field is optional — missing fields fall back to the base palette
(`@pkg/ui` `lightTheme` / `darkTheme`).

## Client cache

- Web: `localStorage` key `pkg-ui:tenant-theme:<slug>`
- Native: `expo-secure-store` (same key)
- TTL: **1 hour**, stale-while-revalidate

The provider:

1. Reads cache on mount; if present, renders immediately.
2. If cached entry is older than TTL OR absent, fires a background
   fetch and updates state when it lands.
3. Writes `{ data, fetchedAt }` back to storage on success.

Errors are surfaced via `useTenantTheme().error` but never block
rendering — the provider always has a usable theme (base or cached).

## Apply path

### Web

The provider writes CSS custom properties on
`document.documentElement.style`:

```css
:root {
  --brand: #ff5722;
  --surface: #fff;
  /* ... */
}
```

Tailwind / Tamagui consumers read `var(--brand)`. The marketing
Astro app does the same at SSR time via a small inline `<script>`
that reads the same `/api/tenants/:slug/theme` endpoint at request
time and emits the CSS vars in the document `<head>`.

### Native

`toTamaguiTheme(resolved)` returns a Tamagui-compatible theme object
that apps push into `TamaguiProvider`'s themes map. For
`@pkg/ui-nativewind` apps the colors are read via `useTenantTheme()`
and applied through `className`-time interpolation (see the
ui-nativewind README).

## Tenant resolution

| Surface | Slug source |
| --- | --- |
| Marketing (Astro) | `Host` header parsed by middleware |
| Web-app (Cloudflare Worker `cf-tenant-router`) | `x-tenant` header, injected as `window.__TENANT__` |
| Native | `EXPO_PUBLIC_TENANT_SLUG` build-time env |

Apps that fail to resolve a slug must fall back to `'default'`.

## Failure modes

- **API unreachable on first load** — fall back to base theme; no
  cache populated; next visit will retry.
- **Malformed payload** — drop it; `error` is set; theme stays at
  base.
- **Cache corrupted** — caught by `try { JSON.parse }`; cache key is
  ignored and refetched.

## Out of scope

- Per-user (not per-tenant) theme overrides — different mechanism.
- Real-time theme push from the backend — clients pull only.
- A11y contrast validation on the supplied palette — TODO.
