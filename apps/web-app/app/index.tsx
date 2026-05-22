// apps/web-app/app/index.tsx

import { resolveTenantFromHostname } from '@pkg/tenancy-client'
import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

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

function getTenantSlug(): null | string {
  if (globalThis.window === undefined) return null
  return resolveTenantFromHostname(globalThis.location.hostname, '.app.example.com')
}

const styles = StyleSheet.create({
  body: { color: '#57606a', fontSize: 16, marginBottom: 24 },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  link: { color: '#1f6feb', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
})
