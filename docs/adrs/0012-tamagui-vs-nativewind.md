# ADR 0012 — Tamagui vs NativeWind (ship both)

**Status:** Accepted
**Date:** 2026-05-22
**Supersedes:** —

## Context

`@pkg/ui` is Tamagui-based. Two product teams pushed back during the
frontend tier rollout:

1. The Marketing app team wants Tailwind ergonomics in the cross-platform
   surface (the marketing site can already use Tailwind via Astro, but
   the upcoming `web-app` landing pages share components).
2. The Mobile team flagged that Tamagui's compile-time style extraction
   tripped on their Hermes setup and they wanted a fallback that does
   nothing at build time.

We considered three options:

- **A.** Keep Tamagui only; teach Tailwind users to live with it.
- **B.** Replace Tamagui with NativeWind. Drop @pkg/ui.
- **C.** Ship both packages with symmetric APIs. App authors pick per app.

## Decision

**Option C.** Ship `@pkg/ui-nativewind` as a sibling to `@pkg/ui`.

- Public APIs are kept symmetric: same component names
  (`Button`, `Card`, `Input`, `Text`, `View`), same prop names
  (`variant`, `size`, `surface`, etc.), same token values.
- Token values are defined in three places and must stay in sync:
  `packages/ui/src/tokens.ts`, `packages/ui-nativewind/src/tokens.ts`,
  `packages/ui-nativewind/tailwind.config.ts`. A future codegen step
  may consolidate this.
- A single app must pick ONE engine. Mixing them in one app trips
  StyleSheet-id collisions on RN.

## When to pick which

| Picker                                             | Pick                                 |
| -------------------------------------------------- | ------------------------------------ |
| Heavy theming, many variants, perf-sensitive lists | `@pkg/ui` (Tamagui)                  |
| Tailwind shop, no compile-time extraction wanted   | `@pkg/ui-nativewind`                 |
| Marketing / docs (web only)                        | Either; Tailwind is more idiomatic   |
| Mobile-first product app                           | Tamagui unless team prefers Tailwind |

## Consequences

**Positive**

- Teams aren't forced into a styling engine they dislike.
- Migration path either way: rewrite imports, not components.

**Negative**

- Two implementations of every primitive. Bug fixes happen twice.
- Tokens duplicated in three files until codegen exists.
- Bundle size if an app accidentally pulls both — guarded by a
  syncpack rule (TODO).

**Mitigation**

- AGENTS.md in each package requires PR authors to update both when
  a token or primitive changes.
- A future ADR may pick a single winner if drift becomes painful.
