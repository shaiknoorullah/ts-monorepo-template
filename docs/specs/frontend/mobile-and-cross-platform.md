---
title: Mobile and cross-platform
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://docs.expo.dev/
  - https://docs.expo.dev/router/introduction/
  - https://docs.expo.dev/eas/
  - https://necolas.github.io/react-native-web/
  - https://tamagui.dev/
  - https://www.nativewind.dev/
  - https://docs.expo.dev/workflow/continuous-native-generation/
---

# Mobile and cross-platform

Three Expo apps, one shared package layer.

## Apps

| App                    | Targets                                  | Persona                                 |
| ---------------------- | ---------------------------------------- | --------------------------------------- |
| `apps/web-app`         | iOS, Android, **Web** (react-native-web) | All tenants — multi-tenant SaaS surface |
| `apps/mobile-customer` | iOS, Android                             | Customer / end user                     |
| `apps/mobile-admin`    | iOS, Android                             | Tenant admin / staff                    |

`apps/web-app` is the only one that ships a web build; the persona-specific mobile apps are native-only. This lets the persona apps install native modules (biometrics, secure-enclave hardware key, kiosk-mode) without polluting the web target.

## Stack

- **Expo SDK 53+** — current major. <https://docs.expo.dev/>
- **expo-router 4** — file-system routing, deep linking, typed routes. <https://docs.expo.dev/router/introduction/>
- **EAS Build** — cloud-managed native builds (no local Xcode needed for iOS). <https://docs.expo.dev/eas/>
- **EAS Submit** — App Store + Play Store automation.
- **EAS Update** — JS-only OTA updates.
- **CNG (Continuous Native Generation)** — `ios/` and `android/` are generated on demand from `app.json`. Don't commit them. <https://docs.expo.dev/workflow/continuous-native-generation/>

## Code sharing

```
apps/web-app          (Expo Web — react-native-web)
apps/mobile-customer  (Expo native)
apps/mobile-admin     (Expo native)
  └── all import from
        packages/ui           (Tamagui primitives — universal)
        packages/forms        (RHF + Zod)
        packages/auth-client  (Ory client)
        packages/api-client   (typed fetch)
        packages/tenancy-client
```

Rules:

1. **No `Platform.OS` checks in `apps/*`.** If you need a divergence between web and native, lift the divergence into a `packages/*` module that exports `.web.ts` and `.native.ts` variants. Apps consume one symbol.
2. **No web-only libraries in shared packages.** A package that ships to mobile must compile on RN. If a web-only API is needed (e.g., `document.cookie`), keep it in `apps/web-app/` directly.
3. **Tamagui is the default UI primitive layer.** See `ui-package-shared-components.md`.

## Multi-tenancy on web

The web build serves multiple tenants from `*.app.example.com`. Tenant resolution flow:

1. Worker sitting in front (Cloudflare Worker) reads the hostname, derives `tenant_slug`, sets `x-tenant: <slug>` request header.
2. `apps/web-app` reads the header (via SSR Worker handoff) and seeds `packages/tenancy-client` context.
3. All API calls from `packages/api-client` automatically carry the tenant header.

Native apps resolve the tenant differently: deep link `myapp://t/<slug>/...` or post-login profile lookup. Both routes converge on the same `packages/tenancy-client` API.

## EAS configuration

Each Expo app ships an `eas.json` with three profiles:

- `development` — internal distribution, debug build.
- `preview` — internal distribution, release build. Used for QA on real devices.
- `production` — store build.

EAS Update channels mirror the profile names.

## Versioning

`app.json` ships `expo.runtimeVersion = { "policy": "appVersion" }`. JS-only changes don't bump native version; native module changes do. EAS Update will refuse to ship a JS bundle to a binary it isn't compatible with.

## Performance budgets (mobile)

- App-cold start (TTI on mid-range Android): < 2.5s.
- JS bundle (per app, gzipped): < 1.5 MB.
- Frame drop budget on lists: < 1% jank on iPhone 14.

Measure with Sentry Mobile (`@sentry/react-native`) — already in saas-commons.

## Performance budgets (web build)

`apps/web-app` is heavier than a pure web framework would be. Acceptable budgets:

- LCP on 4G: < 3s (vs Astro marketing < 1s — different surface, different budget).
- JS bundle initial route: < 350 KB gzipped.
- Time-to-Interactive: < 4s on mid-range mobile browser.

If we blow these, the exit is "move web-app to TanStack Start, keep shared logic in `packages/*`". Not the first move; an option.

## Adding a new mobile app

```bash
repo new app mobile <persona>
```

Templates from `internal/templates/app-mobile/`.

Required follow-ups after scaffolding:

1. Add bundle identifier (`com.example.<persona>`) in `app.json`.
2. Add to `commitlint.config.cjs` `scope-enum`.
3. Add EAS project ID via `eas init`.
4. Add to `.changeset/config.json` `ignore` (apps don't publish).
