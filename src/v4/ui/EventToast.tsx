import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { text } from '../i18n'

const SHOW_MS = 3500

/**
 * Shows each new log line (events, finds, gifts) briefly over the yard, so the player
 * sees what happened without opening the Company sheet. The full list stays there.
 */
export function EventToast() {
  const { state: s } = useGame()
  const seen = useRef<number | null>(null)
  const [queue, setQueue] = useState<{ key: string; en: string; th: string }[]>([])
  useEffect(() => {
    const last = s.log.at(-1)?.tick ?? -1
    if (seen.current === null) {
      // Do not replay the history of a loaded save.
      seen.current = last
      return
    }
    const fresh = s.log.filter(l => l.tick > (seen.current ?? -1))
    if (!fresh.length) return
    seen.current = last
    setQueue(q =>
      [...q, ...fresh.map((l, i) => ({ key: `${l.tick}:${i}:${l.en}`, en: l.en, th: l.th }))].slice(
        -4,
      ),
    )
  }, [s.log])
  useEffect(() => {
    if (!queue.length) return
    const id = setTimeout(() => setQueue(q => q.slice(1)), SHOW_MS)
    return () => clearTimeout(id)
  }, [queue])
  const now = queue[0]
  if (!now) return null
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 12, right: 72, bottom: 12, alignItems: 'flex-start' }}
    >
      <View
        style={{
          backgroundColor: '#24384A',
          borderWidth: 2,
          borderColor: '#14110F',
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          maxWidth: '100%',
        }}
      >
        <Text style={{ fontFamily: 'Kanit_400Regular', fontSize: 14, color: '#FFF6E3' }}>
          {text(now)}
          {queue.length > 1 ? `  (+${queue.length - 1})` : ''}
        </Text>
      </View>
    </View>
  )
}
