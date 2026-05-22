# @pkg/ui-nativewind

NativeWind 4.x sibling to `@pkg/ui` (Tamagui). Same public API, same tokens —
different styling engine.

## When to pick which

| Need                                             | Pick                 |
| ------------------------------------------------ | -------------------- |
| Maximum theming + style-extraction perf          | `@pkg/ui` (Tamagui)  |
| Tailwind ergonomics, no JSX-time extraction      | `@pkg/ui-nativewind` |
| RSC / Astro web                                  | Either               |
| Heavy variant trees (50+ variants per component) | `@pkg/ui`            |

See `docs/adrs/0012-tamagui-vs-nativewind.md`.

## Setup

```bash
pnpm add @pkg/ui-nativewind
```

Add to your app's `tailwind.config.ts`:

```ts
import preset from '@pkg/ui-nativewind/tailwind.config'

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui-nativewind/src/**/*.{ts,tsx}'],
}
```

Use the components:

```tsx
import { Button, Card, Text } from '@pkg/ui-nativewind'
;<Card elevated>
  <Text variant="heading">Hello</Text>
  <Button variant="primary" onPress={() => {}}>
    Click me
  </Button>
</Card>
```

## Components

- `Button` — `variant`: `primary | secondary | ghost | danger`, `size`: `sm | md | lg`
- `Card` — `elevated?: boolean`
- `Input` — `invalid?: boolean`
- `Text` — `variant`: `body | caption | heading | title`, `muted?: boolean`
- `View` — `surface`: `default | muted | transparent`, `padded?: boolean`
