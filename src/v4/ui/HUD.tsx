import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Pause, Bell } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { ranks } from '../data/ranks'
import { text } from '../i18n'
import { ui } from './theme'

export const compact = (n: number) =>
  Math.abs(n) >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : Math.abs(n) >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : Math.abs(n) >= 1e4
        ? `${(n / 1e3).toFixed(1)}K`
        : Math.floor(n).toLocaleString()

/** Two rows: resources + bell + speed, then date and rank progress. */
export function HUD({
  alerts,
  bellOpen,
  onBell,
}: {
  alerts: number
  bellOpen: boolean
  onBell: () => void
}) {
  const { state: s, dispatch } = useGame(),
    d = dateAt(s.tick),
    current = ranks[s.rank - 1],
    next = ranks[s.rank]
  const progress = next ? (s.fame - current.fame) / (next.fame - current.fame) : 1
  // One button cycles the speed: 1× → 2× → 4× → pause → 1×.
  const order = [1, 2, 4, 0] as const
  const nextSpeed = order[(order.indexOf(s.speed as 1 | 2 | 4 | 0) + 1) % order.length]
  return (
    <View style={h.bar}>
      <View style={h.row}>
        <Text
          accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
          style={[h.num, { color: s.money < 0 ? '#F2A49B' : ui.gold, flex: 1 }]}
        >
          ${compact(s.money)}
        </Text>
        <Text style={h.num}>★ {compact(s.fame)}</Text>
        <Text style={[h.num, { color: '#9CC9EA' }]}>RD {compact(s.rd)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: `Notices: ${alerts}`, th: `แจ้งเตือน ${alerts} เรื่อง` })}
          accessibilityState={{ expanded: bellOpen }}
          onPress={onBell}
          style={[h.button, bellOpen && { backgroundColor: ui.gold }]}
        >
          <Bell size={20} color={ui.ink} />
          {alerts > 0 && (
            <View style={h.badge}>
              <Text style={h.badgeText}>{alerts}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({
            en: `Speed ${s.speed === 0 ? 'paused' : `${s.speed}×`}, tap to change`,
            th: `ความเร็ว ${s.speed === 0 ? 'หยุด' : `${s.speed} เท่า`} กดเพื่อเปลี่ยน`,
          })}
          onPress={() => dispatch(s => ({ ...s, speed: nextSpeed }))}
          onLongPress={() => dispatch(s => ({ ...s, speed: 0 }))}
          style={[h.button, { width: 52, backgroundColor: s.speed === 0 ? ui.paper : ui.gold }]}
        >
          {s.speed === 0 ? (
            <Pause size={18} color={ui.ink} />
          ) : (
            <Text style={h.speed}>{s.speed}×</Text>
          )}
        </Pressable>
      </View>
      <View style={h.row}>
        <Text style={h.small}>
          {text({
            en: `Y${d.year} · M${d.month} · W${d.week} · Rank ${s.rank}`,
            th: `ปี ${d.year} · ด.${d.month} · ส.${d.week} · แรงก์ ${s.rank}`,
          })}
        </Text>
        <View style={h.track}>
          <View
            style={{
              height: '100%',
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              backgroundColor: ui.gold,
            }}
          />
        </View>
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: ui.navy,
    borderBottomWidth: 3,
    borderColor: '#18303B',
    gap: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { fontFamily: 'PixelifySans_700Bold', fontSize: 17, color: ui.paper },
  small: { fontFamily: 'Kanit_400Regular', fontSize: 12, color: '#C9D3DC' },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#142C37',
    borderRadius: 3,
    overflow: 'hidden',
  },
  button: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#E2483D',
    borderWidth: 2,
    borderColor: ui.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 11, color: ui.paper },
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 17, color: ui.ink },
})
