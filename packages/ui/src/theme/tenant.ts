// packages/ui/src/theme/tenant.ts
//
// Per-tenant theming. Resolves a `TenantTheme` from
// `GET /api/tenants/:slug/theme` with a 1h client-side cache (localStorage
// on web, expo-secure-store on native) and a stale-while-revalidate
// refresh on mount.
//
// The provider applies the resolved palette in two ways:
//
//   * **Web**: writes CSS custom properties on `document.documentElement`.
//     This is what Tailwind/Tamagui pick up via `var(--brand)` etc.
//   * **Native**: calls Tamagui's `defineTheme` and re-injects the theme
//     into `TamaguiProvider`. Apps without Tamagui can ignore the native
//     branch and just consume `useTenantTheme()` for raw colors.

import type { ReactNode } from 'react'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { Theme } from '../types'

import { darkTheme, lightTheme } from '../tokens'

export interface ResolvedTenantTheme extends Theme {
  logoUrl?: string
  tenantSlug: string
}

/** Theme payload returned by the backend. All colors optional — falls back. */
export interface TenantThemePayload {
  border?: string
  brand?: string
  danger?: string
  info?: string
  logoUrl?: string
  success?: string
  surface?: string
  surfaceMuted?: string
  text?: string
  textMuted?: string
  warning?: string
}

interface TenantThemeContextValue {
  error: Error | null
  loading: boolean
  refetch: () => Promise<void>
  theme: ResolvedTenantTheme
}

const ONE_HOUR_MS = 60 * 60 * 1000
const CACHE_PREFIX = 'pkg-ui:tenant-theme:'

/** Storage adapter — abstracted so RN can pass SecureStore. */
export interface TenantThemeStorage {
  getItem: (key: string) => null | Promise<null | string> | string
  setItem: (key: string, value: string) => Promise<void> | void
}

const memoryStorage: TenantThemeStorage = (() => {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v)
    },
  }
})()

function applyCssVars(theme: Theme): void {
  if (typeof globalThis === 'undefined') return
  const doc = (globalThis as { document?: { documentElement: { style: CSSStyleDeclaration } } })
    .document
  if (!doc) return
  const s = doc.documentElement.style
  for (const [k, v] of Object.entries(theme.colors)) {
    s.setProperty(`--${k.replaceAll(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, v)
  }
}

function defaultStorage(): TenantThemeStorage {
  if (typeof globalThis !== 'undefined') {
    const win = (globalThis as { window?: { localStorage?: Storage } }).window
    if (win?.localStorage) {
      return {
        getItem: (k) => win.localStorage!.getItem(k),
        setItem: (k, v) => {
          win.localStorage!.setItem(k, v)
        },
      }
    }
  }
  return memoryStorage
}

function mergeTheme(base: Theme, override: TenantThemePayload): Theme {
  return {
    colors: {
      border: override.border ?? base.colors.border,
      brand: override.brand ?? base.colors.brand,
      danger: override.danger ?? base.colors.danger,
      info: override.info ?? base.colors.info,
      success: override.success ?? base.colors.success,
      surface: override.surface ?? base.colors.surface,
      surfaceMuted: override.surfaceMuted ?? base.colors.surfaceMuted,
      text: override.text ?? base.colors.text,
      textMuted: override.textMuted ?? base.colors.textMuted,
      warning: override.warning ?? base.colors.warning,
    },
    name: base.name,
  }
}

const TenantThemeContext = createContext<null | TenantThemeContextValue>(null)

export interface TenantThemeProviderProps {
  /** API base URL. Default `''` (same-origin). */
  baseUrl?: string
  children: ReactNode
  /** Color scheme for the base theme (light/dark). Default `light`. */
  colorScheme?: 'dark' | 'light'
  /** Optional fetch override (e.g. for testing or auth headers). */
  fetcher?: typeof fetch
  /** Tenant slug — resolves the theme. */
  slug: string
  /** Storage adapter. Default: localStorage on web, in-memory elsewhere. */
  storage?: TenantThemeStorage
  /** TTL in ms. Default 1h. */
  ttl?: number
}

export function TenantThemeProvider({
  baseUrl = '',
  children,
  colorScheme = 'light',
  fetcher,
  slug,
  storage = defaultStorage(),
  ttl = ONE_HOUR_MS,
}: TenantThemeProviderProps): ReactNode {
  const base = colorScheme === 'dark' ? darkTheme : lightTheme
  const [payload, setPayload] = useState<null | TenantThemePayload>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const inflight = useRef<null | Promise<void>>(null)

  const cacheKey = `${CACHE_PREFIX}${slug}`
  const doFetch = useCallback(async () => {
    try {
      const f = fetcher ?? globalThis.fetch
      const res = await f(`${baseUrl}/api/tenants/${encodeURIComponent(slug)}/theme`)
      if (!res.ok) throw new Error(`tenant-theme HTTP ${res.status}`)
      const data = (await res.json()) as TenantThemePayload
      setPayload(data)
      setError(null)
      await storage.setItem(cacheKey, JSON.stringify({ data, fetchedAt: Date.now() }))
    } catch (error_) {
      setError(error_ as Error)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, slug, fetcher, storage, cacheKey])

  // Boot: read from cache, decide whether to revalidate.
  useEffect(() => {
    if (inflight.current) return
    void (async () => {
      const raw = await storage.getItem(cacheKey)
      if (raw) {
        try {
          const { data, fetchedAt } = JSON.parse(raw) as {
            data: TenantThemePayload
            fetchedAt: number
          }
          setPayload(data)
          setLoading(false)
          if (Date.now() - fetchedAt < ttl) return
        } catch {
          // ignore parse errors and fall through to fetch
        }
      }
      inflight.current = doFetch()
      await inflight.current
      inflight.current = null
    })()
  }, [cacheKey, doFetch, storage, ttl])

  const theme = useMemo<ResolvedTenantTheme>(() => {
    const merged = payload ? mergeTheme(base, payload) : base
    const logoUrl = payload?.logoUrl
    return logoUrl === undefined
      ? { ...merged, tenantSlug: slug }
      : { ...merged, logoUrl, tenantSlug: slug }
  }, [base, payload, slug])

  // Apply CSS vars on every theme change (web only — no-op on RN).
  useEffect(() => {
    applyCssVars(theme)
  }, [theme])

  const value: TenantThemeContextValue = useMemo(
    () => ({ error, loading, refetch: doFetch, theme }),
    [theme, loading, error, doFetch],
  )

  return createElement(TenantThemeContext.Provider, { value }, children)
}

/**
 * Build a Tamagui-compatible theme object from a resolved tenant theme.
 * Apps using Tamagui should call this and pass the result to
 * `TamaguiProvider`'s `defaultTheme` / `themes` map.
 */
export function toTamaguiTheme(theme: ResolvedTenantTheme): Record<string, string> {
  return {
    background: theme.colors.surface,
    backgroundHover: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    brand: theme.colors.brand,
    color: theme.colors.text,
    colorMuted: theme.colors.textMuted,
    danger: theme.colors.danger,
    info: theme.colors.info,
    success: theme.colors.success,
    warning: theme.colors.warning,
  }
}

/* ------------------ Tamagui adapter (optional, RN) ------------------- */

export function useTenantTheme(): TenantThemeContextValue {
  const ctx = useContext(TenantThemeContext)
  if (!ctx) {
    throw new Error('useTenantTheme: missing <TenantThemeProvider>')
  }
  return ctx
}
