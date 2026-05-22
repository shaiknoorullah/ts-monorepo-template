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
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        accessibilityLabel="Password"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      <Button onPress={onSubmit} title="Continue" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  input: { borderColor: '#d0d7de', borderRadius: 8, borderWidth: 1, marginBottom: 12, padding: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
})
