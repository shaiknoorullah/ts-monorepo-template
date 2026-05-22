// packages/ui/src/index.ts
//
// Public surface for @pkg/ui. Universal cross-platform UI primitives.

export { tokens, lightTheme, darkTheme } from './tokens'
export { useColorScheme } from './hooks/useColorScheme'
export { useToast } from './hooks/useToast'
export type { Theme, ColorScheme } from './types'
export {
  TenantThemeProvider,
  useTenantTheme,
  toTamaguiTheme,
} from './theme/tenant'
export type {
  TenantThemePayload,
  ResolvedTenantTheme,
  TenantThemeProviderProps,
  TenantThemeStorage,
} from './theme/tenant'
