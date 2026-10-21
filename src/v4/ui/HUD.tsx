import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { icons } from './icons'
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

/** Two rows in the mockup's riveted navy frame: money, fame, RD; then date, rank, bell, speed. */
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
      {[h.boltTL, h.boltTR, h.boltBL, h.boltBR].map((b, i) => (
        <View key={i} style={[h.bolt, b]} />
      ))}
      <View style={h.row}>
        <View style={[h.chip, { flex: 1.35 }]}>
          <Image source={icons.cash} style={h.icon} />
          <Text
            accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
            numberOfLines={1}
            style={[h.num, s.money < 0 && { color: '#B42318' }]}
          >
            ${compact(s.money)}
          </Text>
        </View>
        <View style={h.chip}>
          <Image source={icons.star} style={h.icon} />
          <Text numberOfLines={1} style={h.num}>
            {compact(s.fame)}
          </Text>
        </View>
        <View style={h.chip}>
          <Image source={icons.rd} style={h.icon} />
          <Text numberOfLines={1} style={h.num}>
            {compact(s.rd)}
          </Text>
        </View>
      </View>
      <View style={h.row}>
        <View style={[h.chip, { flex: 1.05 }]}>
          <Image source={icons.calendar} style={h.iconSmall} />
          <Text numberOfLines={1} style={h.date}>
            {text({
              en: `Y${d.year} · M${d.month} · W${d.week}`,
              th: `ปี ${d.year} · ด.${d.month} · ส.${d.week}`,
            })}
          </Text>
        </View>
        <View style={[h.chip, h.rankChip]}>
          <Image source={icons.crown} style={h.iconSmall} />
          <Text style={[h.date, { color: ui.paper }]}>{s.rank}</Text>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: `Notices: ${alerts}`, th: `แจ้งเตือน ${alerts} เรื่อง` })}
          accessibilityState={{ expanded: bellOpen }}
          onPress={onBell}
          style={({ pressed }) => [h.button, (bellOpen || pressed) && { backgroundColor: ui.gold }]}
        >
          <Bell size={20} color={ui.ink} strokeWidth={2.5} />
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
          style={({ pressed }) => [
            h.button,
            { width: 58, backgroundColor: s.speed === 0 ? ui.paper : '#F08A24' },
            pressed && { transform: [{ translateY: 2 }], boxShadow: '0px 1px 0px #14110F' },
          ]}
        >
          {s.speed === 0 ? (
            <Pause size={18} color={ui.ink} />
          ) : (
            <Text style={h.speed}>▶{s.speed}×</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  bar: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#263D49',
    borderBottomWidth: 4,
    borderColor: ui.ink,
    gap: 6,
  },
  bolt: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#73818F',
    borderWidth: 1,
    borderColor: '#14110F',
  },
  boltTL: { top: 3, left: 3 },
  boltTR: { top: 3, right: 3 },
  boltBL: { bottom: 3, left: 3 },
  boltBR: { bottom: 3, right: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    flex: 1,
    minWidth: 0,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    backgroundColor: ui.paper,
    borderWidth: 2.5,
    borderColor: ui.ink,
    borderRadius: 6,
    boxShadow: 'inset 0px -3px 0px #E6DCC4',
  },
  rankChip: { flex: 1, backgroundColor: '#3B2A6B', boxShadow: 'inset 0px -3px 0px #2A1D4F' },
  icon: { width: 26, height: 26 },
  iconSmall: { width: 22, height: 22 },
  num: {
    flex: 1,
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 18,
    color: ui.ink,
    textAlign: 'right',
  },
  date: { fontFamily: 'Kanit_600SemiBold', fontSize: 13, color: ui.ink },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: '#14110F',
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#14110F',
    overflow: 'hidden',
  },
  button: {
    width: 42,
    height: 38,
    borderWidth: 2.5,
    borderColor: ui.ink,
    borderRadius: 6,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 0px #14110F',
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
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 15, color: ui.ink },
})
