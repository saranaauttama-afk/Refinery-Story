import { View, Text, Pressable, ScrollView } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { yardAlerts, type Alert } from '../sim/systems/alerts'
import { text } from '../i18n'
import { ui, type } from './theme'

const tabColor: Record<Alert['tab'], string> = {
  blend: '#E2483D',
  customers: '#2FB38E',
  staff: '#3D8FE0',
  lab: '#4FA3D9',
  building: '#F2C230',
}

/** The bell's drop-down: things worth a look, then what just happened. Nothing is forced. */
export function Alerts({ onOpen, onLog }: { onOpen: (a: Alert) => void; onLog: () => void }) {
  const { state: s } = useGame()
  const shown = yardAlerts(s)
  const recent = s.log.slice(-4).reverse()
  return (
    <View
      style={{
        position: 'absolute',
        top: 6,
        left: 8,
        right: 8,
        maxHeight: '80%',
        backgroundColor: ui.paper,
        borderWidth: 3,
        borderColor: ui.ink,
        borderRadius: 8,
        boxShadow: '0px 4px 0px #14110F',
        overflow: 'hidden',
      }}
    >
      <ScrollView>
        <Text style={[type.title, { padding: 12, paddingBottom: 6 }]}>
          {shown.length
            ? text({ en: `${shown.length} to look at`, th: `ต้องดู ${shown.length} เรื่อง` })
            : text({ en: 'All good', th: 'ไม่มีเรื่องค้าง' })}
        </Text>
        {shown.map(a => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={() => onOpen(a)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minHeight: 52,
              paddingHorizontal: 12,
              borderTopWidth: 2,
              borderColor: '#E6DCC4',
              backgroundColor: pressed ? '#FFE7A3' : 'transparent',
            })}
          >
            <View
              style={{ width: 8, height: 32, borderRadius: 3, backgroundColor: tabColor[a.tab] }}
            />
            <Text style={[type.body, { flex: 1 }]}>{text(a)}</Text>
            <ChevronRight size={20} color={ui.ink} />
          </Pressable>
        ))}
        <View style={{ padding: 12, borderTopWidth: 2, borderColor: '#E6DCC4', gap: 4 }}>
          <Text style={[type.small, { fontFamily: 'Kanit_600SemiBold' }]}>
            {text({ en: 'Just happened', th: 'เกิดขึ้นล่าสุด' })}
          </Text>
          {recent.map((l, i) => (
            <Text key={i} style={[type.small, { color: ui.ink }]}>
              • {text(l)}
            </Text>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onLog}
            style={{ minHeight: 40, justifyContent: 'center' }}
          >
            <Text style={[type.small, { color: ui.navy, textDecorationLine: 'underline' }]}>
              {text({ en: 'All events', th: 'ดูเหตุการณ์ทั้งหมด' })}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}
