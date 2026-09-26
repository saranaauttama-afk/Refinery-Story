import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2'
import {
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans'

import ErrorBoundary from '../src/components/ErrorBoundary'
import { setBgmEnabled } from '../src/audio/soundManager'
import { SettingsProvider, useSettingsContext } from '../src/hooks/SettingsContext'

/**
 * V3 is the only game. The old engine's provider, tick loop, save writer and
 * overlays are not mounted anywhere (V3-17 production cutover).
 */
function AppShell() {
  const { settings } = useSettingsContext()
  useEffect(() => {
    setBgmEnabled(settings.musicEnabled)
  }, [settings.musicEnabled])
  return (
    <>
      <StatusBar style="light" />
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  // Load the custom display font before showing the app. We proceed once the
  // load settles either way (loaded OR errored) so a font-load failure can't
  // brick the app -- the family names just fall back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
  })
  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SettingsProvider>
          <AppShell />
        </SettingsProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}
