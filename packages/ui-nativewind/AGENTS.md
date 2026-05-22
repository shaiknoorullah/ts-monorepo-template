# AGENTS — @pkg/ui-nativewind

NativeWind 4.x sibling to `@pkg/ui`. Public API is intentionally
symmetric — `Button`, `Card`, `Input`, `Text`, `View` mirror the Tamagui
components 1:1. Token values come from `src/tokens.ts` and the tailwind
preset in `tailwind.config.ts`. Both must change together.

## Invariants

- **No platform forks.** Every component renders on iOS, Android, and
  react-native-web. Never reach for `Platform.OS` branching inside a
  primitive — push that to feature code.
- **Tokens are the source of truth.** Component code must not hard-code
  hex / px values. Use `bg-surface`, `text-fg-muted`, `p-md`, etc.
- **No `style={...}` prop on primitives.** Use `className` strings only —
  this lets NativeWind compile to atomic styles.
- **API symmetry with `@pkg/ui` is load-bearing.** A consumer should be
  able to do a global search-and-replace `@pkg/ui` → `@pkg/ui-nativewind`
  and have the app still compile.

## Adding a component

1. Add the component to `@pkg/ui` first (Tamagui side).
2. Mirror it here with the same prop names.
3. Update both READMEs in the same commit.
4. Add a snapshot or render test in `src/__tests__/`.

## Token changes

Edit `src/tokens.ts` AND `tailwind.config.ts` AND `@pkg/ui/src/tokens.ts`
in one commit. There is no automated check yet — if these drift, apps
that mix both packages will render inconsistently.
