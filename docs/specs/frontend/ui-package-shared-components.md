---
title: UI package — shared components
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://tamagui.dev/
  - https://www.nativewind.dev/
  - https://ui.shadcn.com/
  - https://www.radix-ui.com/primitives
  - https://www.w3.org/WAI/WCAG22/quickref/
---

# `packages/ui` — shared components

One package. Universal primitives. Tamagui by default.

## Decision

**Default: Tamagui.** Reasons in research §5.3. Compile-time optimizer extracts CSS for web → smaller JS payload than naive react-native-web. Same component API across web + RN.

**Alternative: NativeWind + a thin component layer.** Documented as a fallback for teams that are Tailwind-fluent and don't want a full primitive library.

We pick **one** at template-init time. Switching later is a refactor across `apps/*` consumers.

## Package layout

```
packages/ui/
├── package.json
├── tsconfig.json
├── tamagui.config.ts          (or `tailwind.config.ts` if NativeWind path)
├── src/
│   ├── index.ts               (barrel — exports the public surface)
│   ├── tokens/                (color, spacing, type, radius, shadow tokens)
│   ├── theme/                 (light + dark theme builders)
│   ├── primitives/
│   │   ├── Stack.tsx
│   │   ├── Text.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Sheet.tsx
│   │   └── Toast.tsx
│   ├── patterns/
│   │   ├── FormField.tsx
│   │   ├── Modal.tsx
│   │   └── Tabs.tsx
│   └── icons/                 (lucide-react-native re-exports)
└── README.md
```

## Tokens

All design decisions live in `src/tokens/`:

- **color** — semantic tokens (`brand`, `accent`, `surface`, `surfaceMuted`, `border`, `text`, `textMuted`, `success`, `warning`, `danger`, `info`), each with light + dark resolutions.
- **spacing** — 4px base; tokens `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`.
- **radius** — `none`, `sm`, `md`, `lg`, `full`.
- **type** — font-family stack, size scale (`xs`..`6xl`), weight, line-height tokens.
- **shadow** — `sm`, `md`, `lg`, `xl`.

These are Tamagui tokens (`createTokens(...)`) consumed by every primitive.

## Themes

Light, dark, and (defer) high-contrast. Theme switch via `<Theme name="dark">` wrapper at the app root.

Per-tenant theming (defer to a follow-up spec): each tenant could override brand color tokens via a runtime `Theme.brand` slot.

## Dark mode

System-preference detection on first paint (`Appearance.getColorScheme()` on RN; `prefers-color-scheme` on web). User override stored in `packages/ui`'s `themeStore` (Zustand) — persisted to AsyncStorage / localStorage.

## Accessibility

Baseline: **WCAG 2.2 AA**. <https://www.w3.org/WAI/WCAG22/quickref/>

Component rules:

- Every interactive primitive has `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` (RN) and equivalent ARIA on web.
- Focus rings are visible and never `outline: none` without a replacement.
- Color contrast 4.5:1 minimum for body text (3:1 for large text).
- All form inputs have associated labels.
- Modals trap focus + restore on close.
- Toasts are announced via `aria-live` region.

Tests:

- `axe-core` smoke test runs in CI on every preview deploy of `apps/marketing` and `apps/web-app`'s web build.
- RN side: manual VoiceOver / TalkBack audit per release.

## Icons

`lucide-react-native` (MIT). Re-exported via `packages/ui/icons` to give us a single import surface and the freedom to swap icon libraries.

## Toasts

Web: `sonner` under the hood, wrapped by `<Toaster />` from `packages/ui`.
Native: Tamagui's `<Toast>` primitive.

Public API:

```ts
import { useToast } from '@pkg/ui'

const toast = useToast()
toast.success('Saved')
toast.error('Failed to save', { description: '...' })
```

The hook resolves to the correct platform implementation at build time via `.web.ts` / `.native.ts` files.

## Forms

Form composition primitives live in `packages/forms` (separate package). `packages/ui` provides the visual primitives (Input, Label, Field, FieldError) that `packages/forms` composes with RHF + Zod.

## What's NOT in this package

- Business components (e.g., `<InvoiceCard>`). Those live in the consuming app.
- Page layouts beyond a `<Page>` and `<Page.Header>` primitive — full layout templates per app.
- Animations beyond Tamagui's built-in animation driver — if we need Lottie or Reanimated-3 sequences, they live in the consuming app.

## NativeWind alternative (if chosen)

If the team picks NativeWind:

- `tailwind.config.ts` replaces `tamagui.config.ts`.
- `clsx` + `tailwind-merge` for conditional classes.
- Primitives become thin wrappers around RN's `View`/`Text`/`Pressable` with className-driven styles.
- Bundle size on web is similar to Tamagui after CSS purge.
- Loss: compile-time optimizer benefits.

Decision is captured in an ADR when made.

## Versioning

`@pkg/ui` is independently versioned (changesets). Major bumps for breaking primitive API changes; minor for new primitives; patch for token/theme tweaks.

## Public surface

Exported from `src/index.ts`:

```ts
// Tokens + theming
export { tokens, lightTheme, darkTheme } from './tokens'
export { Theme, useTheme } from './theme'

// Primitives
export { Stack, Text, Button, Input, Card, Sheet, Toast } from './primitives'

// Patterns
export { FormField, Modal, Tabs } from './patterns'

// Hooks
export { useToast, useColorScheme } from './hooks'

// Types
export type { Theme as ThemeType, Tokens } from './types'
```
