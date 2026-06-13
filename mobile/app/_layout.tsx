import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import AwardModal from '../src/components/AwardModal'
import ChoiceEventModal from '../src/components/ChoiceEventModal'
import EraBanner from '../src/components/EraBanner'
import { GameProvider, useGame } from '../src/hooks/GameContext'

function GlobalOverlays() {
  const { pendingChoiceEvent, pendingAward, pendingEraBanner, chooseEventOption, dismissAward, dismissEraBanner } =
    useGame()

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
      <GameProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <GlobalOverlays />
      </GameProvider>
    </GestureHandlerRootView>
  )
}
