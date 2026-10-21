import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Pause, Bell, Settings, HardHat, FlaskConical } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { ranks } from '../data/ranks'
import { text } from '../i18n'
import { ui } from './theme'
import { GameIcon } from './GameIcon'
import { Enamel, Bolts } from './GameChrome'

export const compact = (n: number) =>
  Math.abs(n) >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : Math.abs(n) >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : Math.abs(n) >= 1e4
        ? `${(n / 1e3).toFixed(1)}K`
        : Math.floor(n).toLocaleString()

/** The approved cream-enamel instrument panel; all values and actions stay live. */
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
        <View style={h.brand}>
          <Enamel dark />
          <Bolts />
          <HardHat size={24} color={ui.gold} fill="#E9A31C" strokeWidth={2.5} />
          <Text style={h.brandText}>{text({ en: 'REFINERY STORY', th: 'REFINERY STORY' })}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: `Notices: ${alerts}`, th: `แจ้งเตือน ${alerts} เรื่อง` })}
          accessibilityState={{ expanded: bellOpen }}
          aria-expanded={bellOpen}
          onPress={onBell}
          style={[h.tool, bellOpen && { backgroundColor: ui.gold }]}
        >
          <Enamel />
          <Bell size={21} color={ui.ink} strokeWidth={2.5} />
          {alerts > 0 && (
            <View style={h.badge}>
              <Text style={h.badgeText}>{alerts}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Settings', th: 'ตั้งค่า' })}
          onPress={onSettings}
          style={h.tool}
        >
          <Enamel />
          <Settings size={23} color={ui.ink} strokeWidth={2.5} />
        </Pressable>
      </View>
      <View style={h.row}>
        <View style={[h.resource, { flex: 1.4 }]}>
          <Enamel />
          <GameIcon name="cash" size={28} />
          <Text
            accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
            numberOfLines={1}
            style={[
              h.num,
              { fontSize: width < 380 ? 18 : 20 },
              s.money < 0 && { color: '#B42318' },
            ]}
          >
            ${Math.abs(s.money) < 1e6 ? Math.floor(s.money).toLocaleString() : compact(s.money)}
          </Text>
        </View>
        <View style={h.resource}>
          <Enamel />
          <GameIcon name="star" size={27} />
          <Text numberOfLines={1} style={h.num}>
            {compact(s.fame)}
          </Text>
        </View>
        <View style={h.resource}>
          <Enamel />
          <FlaskConical size={25} color={ui.ink} fill="#55B5E0" />
          <Text
            accessibilityLabel={text({ en: `Research data ${s.rd}`, th: `ข้อมูลวิจัย ${s.rd}` })}
            numberOfLines={1}
            style={h.num}
          >
            {compact(s.rd)}
          </Text>
        </View>
      </View>
      <View style={h.timeline}>
        <Text
          style={h.date}
          accessibilityLabel={text({
            en: `Year ${d.year}, month ${d.month}, week ${d.week}`,
            th: `ปี ${d.year} เดือน ${d.month} สัปดาห์ ${d.week}`,
          })}
        >
          {text({ en: `Y${d.year} · Month ${d.month}`, th: `ปี ${d.year} · เดือน ${d.month}` })}
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
          style={[h.speedButton, s.speed === 0 && { backgroundColor: ui.paper }]}
        >
          <Enamel />
          {s.speed === 0 ? (
            <Pause size={18} color={ui.ink} />
          ) : (
            <Text style={h.speed}>{s.speed}×</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  panel: {
    backgroundColor: ui.paper,
    borderBottomWidth: 4,
    borderColor: ui.ink,
    padding: 6,
    gap: 4,
    boxShadow: '0px 3px 0px #183347',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brand: {
    flex: 1,
    minWidth: 0,
    height: 44,
    backgroundColor: ui.navy,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
  brandText: { fontFamily: 'PixelifySans_700Bold', fontSize: 22, color: ui.paper, flexShrink: 1 },
  tool: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 7,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resource: {
    flex: 1,
    minWidth: 0,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    backgroundColor: ui.surface,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
  },
  num: { fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: ui.ink, flexShrink: 1 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  date: { fontFamily: 'Kanit_600SemiBold', fontSize: 12, color: ui.ink },
  rank: {
    backgroundColor: '#7853B0',
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  rankText: { fontFamily: 'Kanit_600SemiBold', fontSize: 12, color: ui.paper },
  track: {
    flex: 1,
    minWidth: 12,
    height: 12,
    backgroundColor: ui.navy,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 3,
    overflow: 'hidden',
  },
  speedButton: {
    width: 44,
    height: 40,
    backgroundColor: ui.build,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: ui.ink },
  badge: {
    position: 'absolute',
    top: -4,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.blend,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 11, color: ui.paper },
})
