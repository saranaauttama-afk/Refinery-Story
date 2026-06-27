import { useEffect, useRef, useState } from 'react'
import { Stack, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import AwardModal from '../src/components/AwardModal'
import ChoiceEventModal from '../src/components/ChoiceEventModal'
import ComboDiscoveryBanner from '../src/components/ComboDiscoveryBanner'
import Confetti from '../src/components/Confetti'
import EraBanner from '../src/components/EraBanner'
import MilestoneHeadline from '../src/components/MilestoneHeadline'
import HiddenEventBanner from '../src/components/HiddenEventBanner'
import WinCelebrationModal from '../src/components/WinCelebrationModal'
import { GameProvider, useGame } from '../src/hooks/GameContext'
import { useHaptics } from '../src/hooks/useHaptics'
import { SettingsProvider } from '../src/hooks/SettingsContext'

function GlobalOverlays() {
  const {
    game,
    pendingChoiceEvent,
    pendingAward,
    pendingEraBanner,
    pendingMilestoneHeadline,
    pendingWinCelebration,
    pendingComboDiscovery,
    pendingHiddenEventUnlock,
    chooseEventOption,
    dismissAward,
    dismissEraBanner,
    dismissMilestoneHeadline,
    dismissWinCelebration,
    dismissComboDiscovery,
    dismissHiddenEventUnlock,
  } = useGame()
  const haptics = useHaptics()
  const lastMilestoneCount = useRef<number | null>(null)

  // Confetti: a single incrementing key drives the global burst layer. Every
  // celebration moment below bumps it; Confetti remounts on the new key and
  // replays cleanly even on back-to-back celebrations.
  const [confettiKey, setConfettiKey] = useState(0)
  const burstConfetti = () => setConfettiKey((k) => k + 1)

  // Success haptic + confetti whenever a new milestone completes (regardless
  // of whether it also triggered a choice-event popup).
  useEffect(() => {
    if (!game) return
    const count = game.completedMilestoneKeys.length
    if (lastMilestoneCount.current !== null && count > lastMilestoneCount.current) {
      haptics.success()
      burstConfetti()
    }
    lastMilestoneCount.current = count
  }, [game?.completedMilestoneKeys.length, haptics])

  // Extra-celebratory haptic + confetti when the win condition is first reached.
  useEffect(() => {
    if (pendingWinCelebration) {
      haptics.success()
      burstConfetti()
    }
  }, [pendingWinCelebration, haptics])

  // Success haptic + confetti when a hidden layout combo is discovered.
  useEffect(() => {
    if (pendingComboDiscovery) {
      haptics.success()
      burstConfetti()
    }
  }, [pendingComboDiscovery, haptics])

  // Confetti for a standout year-end result (S or A grade only -- a routine
  // year shouldn't trigger the full celebration).
  useEffect(() => {
    if (pendingAward && (pendingAward.grade === 'S' || pendingAward.grade === 'A')) {
      burstConfetti()
    }
  }, [pendingAward])

  // Success haptic when a Hidden Event newly unlocks (separate system
  // from combos -- gated by the in-game calendar clock, see
  // HiddenEventConfig).
  useEffect(() => {
    if (pendingHiddenEventUnlock) haptics.success()
  }, [pendingHiddenEventUnlock, haptics])

  return (
    <>
      <EraBanner era={pendingEraBanner} onDismiss={dismissEraBanner} />
      <MilestoneHeadline headline={pendingMilestoneHeadline} onDismiss={dismissMilestoneHeadline} />
      <ComboDiscoveryBanner combo={pendingComboDiscovery} onDismiss={dismissComboDiscovery} />
      <HiddenEventBanner event={pendingHiddenEventUnlock} onDismiss={dismissHiddenEventUnlock} />
      <ChoiceEventModal event={pendingChoiceEvent} onChoose={chooseEventOption} />
      <AwardModal record={pendingAward} onDismiss={dismissAward} />
      <WinCelebrationModal visible={pendingWinCelebration} game={game} onDismiss={dismissWinCelebration} />
      <Confetti burstKey={confettiKey} />
    </>
  )
}

function AppShell() {
  const pathname = usePathname()
  const showGlobalOverlays =
    pathname !== '/diamond-ground-prototype' && pathname !== '/factory-scene-prototype'

  return (
    <>
      <StatusBar style="dark" />
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="store" options={{ presentation: 'card' }} />
        <Stack.Screen name="achievements" options={{ presentation: 'card' }} />
      </Stack>
      {showGlobalOverlays ? <GlobalOverlays /> : null}
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <GameProvider>
          <AppShell />
        </GameProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  )
}
