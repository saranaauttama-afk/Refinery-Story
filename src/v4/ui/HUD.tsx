import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Pause, Bell, Settings } from 'lucide-react-native'
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

/** Minimal two-row HUD: resources + bell, then date, rank progress, speed and settings. */
export function HUD({
  alerts,
  bellOpen,
  onBell,
  onSettings,
}: {
  alerts: number
  bellOpen: boolean
  onBell: () => void
  onSettings: () => void
}) {
  const { state: s, dispatch } = useGame(),
    d = dateAt(s.tick)
  const { width } = useWindowDimensions()
  const current = ranks[s.rank - 1],
    next = ranks[s.rank]
  const progress = next ? (s.fame - current.fame) / (next.fame - current.fame) : 1
  const order = [1, 2, 4, 0] as const
  const nextSpeed = order[(order.indexOf(s.speed as 1 | 2 | 4 | 0) + 1) % order.length]
  return (
    <View style={h.panel}>
      <View style={h.row}>
        <View style={[h.chip, { flex: 1.35 }]}>
          <GameIcon name="cash" size={24} />
          <Text
            accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
            numberOfLines={1}
            style={[
              h.num,
              { fontSize: width < 380 ? 16 : 18 },
              s.money < 0 && { color: '#B42318' },
            ]}
          >
            ${Math.abs(s.money) < 1e6 ? Math.floor(s.money).toLocaleString() : compact(s.money)}
          </Text>
        </View>
        <View style={h.chip}>
          <GameIcon name="star" size={22} />
          <Text numberOfLines={1} style={h.num}>
            {compact(s.fame)}
          </Text>
        </View>
        <View style={h.chip}>
          <GameIcon name="rd" size={22} />
          <Text
            accessibilityLabel={text({ en: `Research data ${s.rd}`, th: `ข้อมูลวิจัย ${s.rd}` })}
            numberOfLines={1}
            style={h.num}
          >
            {compact(s.rd)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: `Notices: ${alerts}`, th: `แจ้งเตือน ${alerts} เรื่อง` })}
          accessibilityState={{ expanded: bellOpen }}
          aria-expanded={bellOpen}
          onPress={onBell}
          style={[h.tool, bellOpen && { backgroundColor: ui.gold }]}
        >
          <Bell size={18} color={ui.ink} strokeWidth={2.5} />
          {alerts > 0 && (
            <View style={h.badge}>
              <Text style={h.badgeText}>{alerts}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <View style={h.row}>
        <Text
          style={h.date}
          numberOfLines={1}
          accessibilityLabel={text({
            en: `Year ${d.year}, month ${d.month}, week ${d.week}`,
            th: `ปี ${d.year} เดือน ${d.month} สัปดาห์ ${d.week}`,
          })}
        >
          {text({ en: `Y${d.year} · M${d.month}`, th: `ปี ${d.year} · ด.${d.month}` })}
        </Text>
        <View style={h.rank}>
          <Text style={h.rankText}>{text({ en: `Rank ${s.rank}`, th: `แรงก์ ${s.rank}` })}</Text>
        </View>
        <View style={h.track}>
          <View
            style={{
              height: '100%',
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              backgroundColor: ui.gold,
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({
            en: `Speed ${s.speed === 0 ? 'paused' : `${s.speed}×`}, tap to change`,
            th: `ความเร็ว ${s.speed === 0 ? 'หยุด' : `${s.speed} เท่า`} กดเพื่อเปลี่ยน`,
          })}
          onPress={() => dispatch(s => ({ ...s, speed: nextSpeed }))}
          onLongPress={() => dispatch(s => ({ ...s, speed: 0 }))}
          style={[h.small, { backgroundColor: s.speed === 0 ? ui.paper : ui.build }]}
        >
          {s.speed === 0 ? (
            <Pause size={14} color={ui.ink} />
          ) : (
            <Text style={h.speed}>{s.speed}×</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Settings', th: 'ตั้งค่า' })}
          onPress={onSettings}
          style={h.small}
        >
          <Settings size={15} color={ui.ink} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  panel: {
    backgroundColor: '#263D49',
    borderBottomWidth: 3,
    borderColor: ui.ink,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chip: {
    flex: 1,
    minWidth: 0,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 5,
    backgroundColor: ui.paper,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
  },
  tool: {
    width: 36,
    height: 34,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: 'PixelifySans_700Bold', fontSize: 17, color: ui.ink, flexShrink: 1 },
  date: { fontFamily: 'Kanit_600SemiBold', fontSize: 12, color: ui.paper },
  rank: {
    backgroundColor: '#7853B0',
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 4,
    paddingHorizontal: 5,
  },
  rankText: { fontFamily: 'Kanit_600SemiBold', fontSize: 11, color: ui.paper },
  track: {
    flex: 1,
    minWidth: 12,
    height: 8,
    backgroundColor: '#14110F',
    borderRadius: 3,
    overflow: 'hidden',
  },
  small: {
    width: 36,
    height: 24,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: ui.ink },
  badge: {
    position: 'absolute',
    top: -6,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.blend,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 10, color: ui.paper },
})
