import { StyleSheet, Text, View } from 'react-native'

export default function Home(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.body}>Admin-facing mobile app for tenant operators.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, color: '#57606a' },
})
