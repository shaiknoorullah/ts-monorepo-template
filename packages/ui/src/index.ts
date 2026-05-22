// packages/ui/src/index.ts
//
// Public surface for @pkg/ui. Universal cross-platform UI primitives.

export { useColorScheme } from './hooks/useColorScheme'
export { useToast } from './hooks/useToast'
export {
  TenantThemeProvider,
  toTamaguiTheme,
  useTenantTheme,
} from './theme/tenant'
export type {
  ResolvedTenantTheme,
  TenantThemePayload,
  TenantThemeProviderProps,
  TenantThemeStorage,
} from './theme/tenant'
export { darkTheme, lightTheme, tokens } from './tokens'
export type { ColorScheme, Theme } from './types'
