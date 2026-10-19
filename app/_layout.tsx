import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Baloo2_400Regular, Baloo2_700Bold } from '@expo-google-fonts/baloo-2'
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  const [loaded, error] = useFonts({ Baloo2_400Regular, Baloo2_700Bold, PixelifySans_700Bold })
  if (!loaded && !error) return null
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
