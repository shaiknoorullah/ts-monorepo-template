import { StyleSheet, Text, View } from 'react-native'

export default function Home(): JSX.Element {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>{{name}}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  c: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  t: { fontSize: 32, fontWeight: '700' },
})
