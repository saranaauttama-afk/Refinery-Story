import { FeedbackProvider } from '../src/v4/ui/Feedback'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { loadSkia } from '../src/v4/render/loadSkia'
import { GameProvider } from '../src/v4/store/GameProvider'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { Kanit_400Regular, Kanit_600SemiBold } from '@expo-google-fonts/kanit'
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  const [loaded, error] = useFonts({ Kanit_400Regular, Kanit_600SemiBold, PixelifySans_700Bold })
  const [skiaReady, setSkiaReady] = useState(false)
  useEffect(() => {
    loadSkia()
      .then(() => setSkiaReady(true))
      .catch(console.error)
  }, [])
  if ((!loaded && !error) || !skiaReady) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <FeedbackProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </FeedbackProvider>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
