// apps/web-app/app/_layout.tsx
//
// Root layout. Stack navigator + providers (tenancy, auth, query, theme).
//
// Tenant resolution: pulled from the `x-tenant` header set by the
// cf-tenant-router Worker on `*.app.example.com`. On native the slug
// comes from an env var the bootstrapper writes. Both paths funnel
// through `getTenantSlug()`.

import { TenantThemeProvider } from '@pkg/ui'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

function getTenantSlug(): string {
  // Web: window.__TENANT__ injected by the edge router.
  // Native: EXPO_PUBLIC_TENANT_SLUG (build-time).
  // Fallback: 'default'.
  const g = globalThis as { window?: { __TENANT__?: string } }
  if (g.window?.__TENANT__) return g.window.__TENANT__
  const fromEnv = process.env.EXPO_PUBLIC_TENANT_SLUG
  return fromEnv && fromEnv.length > 0 ? fromEnv : 'default'
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <TenantThemeProvider baseUrl={API_BASE} slug={getTenantSlug()}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal', title: 'Sign in' }} />
        </Stack>
      </TenantThemeProvider>
    </SafeAreaProvider>
  )
}
