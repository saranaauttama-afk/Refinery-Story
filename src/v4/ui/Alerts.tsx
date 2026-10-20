import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useGame } from '../store/useGame'
import { yardAlerts, type Alert } from '../sim/systems/alerts'
import { text } from '../i18n'

const tabColor: Record<Alert['tab'], string> = {
  blend: '#F2A49B',
  customers: '#8ED9C1',
  staff: '#9CC9EA',
  lab: '#4FA3D9',
}

/** Optional nudges over the yard. Tap to open the sheet, ✕ to hide. Nothing is forced. */
export function Alerts({ onOpen }: { onOpen: (a: Alert) => void }) {
  const { state: s } = useGame()
  const [hidden, setHidden] = useState<string[]>([])
  const shown = yardAlerts(s).filter(a => !hidden.includes(a.id))
  if (!shown.length) return null
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 8, left: 8, right: 8, gap: 6, alignItems: 'flex-start' }}
    >
      {shown.slice(0, 2).map(a => (
        <View
          key={a.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            maxWidth: '100%',
            borderWidth: 2,
            borderRadius: 5,
            backgroundColor: '#FFF6E3',
            overflow: 'hidden',
          }}
        >
          <View style={{ width: 8, alignSelf: 'stretch', backgroundColor: tabColor[a.tab] }} />
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(a)}
            style={{
              paddingLeft: 8,
              paddingVertical: 4,
              minHeight: 40,
              justifyContent: 'center',
              flexShrink: 1,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontFamily: 'Kanit_400Regular', fontSize: 13, color: '#14110F' }}
            >
              {text(a)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text({ en: 'Hide notice', th: 'ซ่อนแจ้งเตือน' })}
            hitSlop={8}
            onPress={() => setHidden(h => [...h, a.id])}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              minWidth: 40,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Kanit_400Regular', fontSize: 13, color: '#5E6470' }}>
              ✕
            </Text>
          </Pressable>
        </View>
      ))}
      {shown.length > 2 && (
        <Text style={{ fontFamily: 'Kanit_400Regular', fontSize: 12, color: '#3B3F47' }}>
          +{shown.length - 2}
        </Text>
      )}
    </View>
  )
}
