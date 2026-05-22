import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <Stack />
    </SafeAreaProvider>
  )
}
