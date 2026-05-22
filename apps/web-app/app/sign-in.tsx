// apps/web-app/app/sign-in.tsx

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'

export default function SignIn(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(): void {
    // TODO: wire @pkg/auth-client.signIn
    router.replace('/')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        accessibilityLabel="Email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Continue" onPress={onSubmit} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d0d7de', borderRadius: 8, padding: 12, marginBottom: 12 },
})
