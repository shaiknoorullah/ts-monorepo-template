# ADR-0009: Expo for mobile and the multi-tenant web app

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

The template needs:

1. Multiple mobile apps, one per persona (customer, admin) — not one app with role flags.
2. A multi-tenant web SaaS surface that **shares code with mobile** (the operator's hard constraint).

The choice is between:

- Native React Native (no Expo).
- Expo SDK 53+ with EAS Build / Submit / Update.
- Flutter / Compose Multiplatform / Kotlin Multiplatform — no shared code with web in TS.
- A web framework (TanStack Start, Next.js) + separate mobile codebase — violates the code-sharing constraint.

## Decision

Adopt **Expo SDK 53+ with expo-router 4** as the framework for:

- `apps/web-app` — multi-tenant SaaS, web (via react-native-web) + iOS + Android.
- `apps/mobile-customer` — native only (iOS + Android).
- `apps/mobile-admin` — native only (iOS + Android).

Code shared across all three lives in `packages/*` per `docs/specs/frontend/frontend-package-architecture.md`.

### Why Expo

- **One codebase, three targets.** Expo for Web compiles to react-native-web; native targets via EAS Build.
- **EAS Build / Submit / Update** — cloud-managed native builds, no local Xcode required for iOS, JS-only OTA updates.
- **expo-router 4** — file-system routing with typed routes + deep links.
- **CNG (Continuous Native Generation)** — `ios/` and `android/` directories generated on demand from `app.json`; we don't commit them.
- MIT licensed. Self-hostable build server option (EAS Build Custom Workers) if we leave Expo's hosted service.

### Why not native RN (bare workflow)

The bare workflow strips Expo modules + EAS conveniences. We'd own:

- Xcode + Gradle build config.
- Native module linking.
- OTA update infrastructure.
- App-icon + splash-screen generators.
- Build queues + signing.

This is real work for marginal benefit. Bare workflow is correct when we hit a native module Expo cannot support — at which point we eject locally.

### Why not Flutter / KMP

- No shared code with the web target — violates the hard constraint.
- Loses the React + TS ecosystem we've invested in.

### Why three apps and not one

The operator's constraint is "multiple mobile apps per persona". Reasons that align with sound architecture:

- Different install footprints (admin app ships native admin SDKs the customer app doesn't need).
- Different store listings, screenshots, marketing copy.
- Easier permission story (customer doesn't see admin-only features at all).
- Independent release cadences.

`apps/web-app` is the only target that ships a web build because the persona apps may install native modules that don't have web equivalents.

## Consequences

### Positive

- One framework owns mobile + the web SaaS surface.
- `packages/ui` (Tamagui) primitives render correctly on all three targets.
- EAS Build + Submit + Update removes most of the native-release pain.
- JS-only OTA updates ship without store review.

### Negative

- Expo for Web on a SaaS dashboard is heavier than a React-on-web framework would be. Acceptable — see `mobile-and-cross-platform.md` performance budgets. Exit: split web into TanStack Start, keep shared logic in packages.
- EAS Build cloud workers cost money beyond the free tier. We accept this.
- Native module compatibility is excellent for the standard surface but niche modules sometimes need config plugins.

### Neutral / Follow-up

- Per-app `app.json` configuration (bundle ID, scheme, plugins) — documented in `docs/specs/frontend/mobile-and-cross-platform.md`.
- Bundle splitting strategy for `apps/web-app` (defer until measured).

## Alternatives considered

- **Bare React Native** — rejected (operational cost).
- **Flutter / KMP** — rejected (loses code sharing with web).
- **TanStack Start + separate RN bare workflow** — rejected (two codebases, two release pipelines).
- **One mobile app with role flags** — rejected (operator constraint + store-listing + permission concerns).
- **Next.js + Capacitor (web-to-native wrapper)** — rejected (Capacitor is a different model; we use real RN modules).

## References

- [Expo docs](https://docs.expo.dev/)
- [expo-router 4](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/eas/)
- [CNG](https://docs.expo.dev/workflow/continuous-native-generation/)
- [react-native-web](https://necolas.github.io/react-native-web/)
- `docs/specs/frontend/mobile-and-cross-platform.md`
- Research: `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md` §5
