import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YardScreen } from '../src/v4/ui/YardScreen'
import { useGame } from '../src/v4/store/useGame'
export default function GameScreen() {
  const { setPlaying } = useGame()
  useFocusEffect(
    useCallback(() => {
      setPlaying(true)
      return () => setPlaying(false)
    }, [setPlaying]),
  )
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF6E3' }}>
      <YardScreen />
    </SafeAreaView>
  )
}
