import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import AwardModal from '../src/components/AwardModal'
import ChoiceEventModal from '../src/components/ChoiceEventModal'
import EraBanner from '../src/components/EraBanner'
import { GameProvider, useGame } from '../src/hooks/GameContext'
import { useHaptics } from '../src/hooks/useHaptics'
import { SettingsProvider } from '../src/hooks/SettingsContext'

function GlobalOverlays() {
  const { game, pendingChoiceEvent, pendingAward, pendingEraBanner, chooseEventOption, dismissAward, dismissEraBanner } =
    useGame()
  const haptics = useHaptics()
  const lastMilestoneCount = useRef<number | null>(null)

  // Success haptic whenever a new milestone completes (regardless of
  // whether it also triggered a choice-event popup).
  useEffect(() => {
    if (!game) return
    const count = game.completedMilestoneKeys.length
    if (lastMilestoneCount.current !== null && count > lastMilestoneCount.current) {
      haptics.success()
    }
    lastMilestoneCount.current = count
  }, [game?.completedMilestoneKeys.length, haptics])

  return (
    <>
      <EraBanner era={pendingEraBanner} onDismiss={dismissEraBanner} />
      <ChoiceEventModal event={pendingChoiceEvent} onChoose={chooseEventOption} />
      <AwardModal record={pendingAward} onDismiss={dismissAward} />
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
            <Stack.Screen name="store" options={{ presentation: 'card' }} />
            <Stack.Screen name="achievements" options={{ presentation: 'card' }} />
          </Stack>
          <GlobalOverlays />
        </GameProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  )
}
