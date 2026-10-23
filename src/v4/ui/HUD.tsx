import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Pause, Bell } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { ranks } from '../data/ranks'
import { text } from '../i18n'
import { ui } from './theme'
import { GameIcon } from './GameIcon'

export const compact = (n: number) =>
  Math.abs(n) >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : Math.abs(n) >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : Math.abs(n) >= 1e4
        ? `${(n / 1e3).toFixed(1)}K`
        : Math.floor(n).toLocaleString()

/** Compact one-row HUD: resources, date and rank, speed and bell; a thin rank bar underneath.
 *  Settings live in the Company menu. */
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
    d = dateAt(s.tick)
  const { width } = useWindowDimensions()
  const current = ranks[s.rank - 1],
    next = ranks[s.rank]
  const progress = next ? (s.fame - current.fame) / (next.fame - current.fame) : 1
  const order = [1, 2, 4, 0] as const
  const nextSpeed = order[(order.indexOf(s.speed as 1 | 2 | 4 | 0) + 1) % order.length]
  const narrow = width < 380
  return (
    <View style={h.panel}>
      <View style={h.row}>
        <View style={[h.chip, { flex: 1.4 }]}>
          <GameIcon name="cash" size={18} />
          <Text
            accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
            numberOfLines={1}
            style={[h.num, s.money < 0 && { color: '#B42318' }]}
          >
            ${Math.abs(s.money) < 1e5 ? Math.floor(s.money).toLocaleString() : compact(s.money)}
          </Text>
        </View>
        <View style={h.chip}>
          <GameIcon name="star" size={16} />
          <Text numberOfLines={1} style={h.num}>
            {compact(s.fame)}
          </Text>
        </View>
        <View style={h.chip}>
          <GameIcon name="rd" size={16} />
          <Text
            accessibilityLabel={text({ en: `Research data ${s.rd}`, th: `ข้อมูลวิจัย ${s.rd}` })}
            numberOfLines={1}
            style={h.num}
          >
            {compact(s.rd)}
          </Text>
        </View>
        <View
          style={h.when}
          accessibilityLabel={text({
            en: `Year ${d.year}, month ${d.month}, rank ${s.rank}`,
            th: `ปี ${d.year} เดือน ${d.month} แรงก์ ${s.rank}`,
          })}
        >
          <Text style={h.date} numberOfLines={1}>
            {text({ en: `Y${d.year}·M${d.month}`, th: `ปี${d.year}·ด.${d.month}` })}
          </Text>
          <Text style={h.rankText} numberOfLines={1}>
            {text({ en: `Rank ${s.rank}`, th: narrow ? `R${s.rank}` : `แรงก์ ${s.rank}` })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({
            en: `Speed ${s.speed === 0 ? 'paused' : `${s.speed}×`}, tap to change`,
            th: `ความเร็ว ${s.speed === 0 ? 'หยุด' : `${s.speed} เท่า`} กดเพื่อเปลี่ยน`,
          })}
          hitSlop={6}
          onPress={() => dispatch(s => ({ ...s, speed: nextSpeed }))}
          onLongPress={() => dispatch(s => ({ ...s, speed: 0 }))}
          style={[h.tool, { backgroundColor: s.speed === 0 ? ui.paper : ui.build }]}
        >
          {s.speed === 0 ? (
            <Pause size={13} color={ui.ink} />
          ) : (
            <Text style={h.speed}>{s.speed}×</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: `Notices: ${alerts}`, th: `แจ้งเตือน ${alerts} เรื่อง` })}
          accessibilityState={{ expanded: bellOpen }}
          aria-expanded={bellOpen}
          hitSlop={6}
          onPress={onBell}
          style={[h.tool, bellOpen && { backgroundColor: ui.gold }]}
        >
          <Bell size={15} color={ui.ink} strokeWidth={2.5} />
          {alerts > 0 && (
            <View style={h.badge}>
              <Text style={h.badgeText}>{alerts}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <View
        style={h.track}
        accessibilityLabel={text({
          en: `Rank progress ${Math.round(progress * 100)}%`,
          th: `ความคืบหน้าแรงก์ ${Math.round(progress * 100)}%`,
        })}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            backgroundColor: ui.gold,
          }}
        />
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  panel: {
    backgroundColor: '#263D49',
    borderBottomWidth: 2,
    borderColor: ui.ink,
    paddingHorizontal: 5,
    paddingTop: 4,
    paddingBottom: 3,
    gap: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip: {
    flex: 1,
    minWidth: 0,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    backgroundColor: ui.paper,
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 5,
  },
  when: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, minWidth: 48 },
  tool: {
    width: 30,
    height: 28,
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: ui.ink, flexShrink: 1 },
  date: { fontFamily: 'Kanit_600SemiBold', fontSize: 11, lineHeight: 13, color: ui.paper },
  rankText: { fontFamily: 'Kanit_600SemiBold', fontSize: 11, lineHeight: 13, color: '#D9C2FF' },
  track: { height: 3, backgroundColor: '#14110F', borderRadius: 2, overflow: 'hidden' },
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 13, color: ui.ink },
  badge: {
    position: 'absolute',
    top: -6,
    right: -5,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 4,
    backgroundColor: ui.blend,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 9, color: ui.paper },
})
