// apps/web-app/app/index.tsx

import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { resolveTenantFromHostname } from '@pkg/tenancy-client'

function getTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  return resolveTenantFromHostname(window.location.hostname, '.app.example.com')
}

export default function Home(): JSX.Element {
  const slug = getTenantSlug()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.body}>
        {slug ? `Tenant: ${slug}` : 'No tenant context.'}
      </Text>
      <Link href="/sign-in" style={styles.link}>
        Sign in
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, color: '#57606a', marginBottom: 24 },
  link: { color: '#1f6feb', fontSize: 16, fontWeight: '600' },
})
