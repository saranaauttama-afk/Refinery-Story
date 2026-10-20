import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Pause, Star, FlaskConical } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { B } from '../data/balance'
import { ranks } from '../data/ranks'
import { text } from '../i18n'
import { ui } from './theme'
const compact = (n: number) =>
  Math.abs(n) >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : Math.abs(n) >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : Math.abs(n) >= 1e4
        ? `${(n / 1e3).toFixed(1)}K`
        : Math.floor(n).toLocaleString()
export function HUD() {
  const { state: s, dispatch } = useGame(),
    d = dateAt(s.tick),
    current = ranks[s.rank - 1],
    next = ranks[s.rank]
  const progress = next ? (s.fame - current.fame) / (next.fame - current.fame) : 1
  return (
    <View style={h.bar}>
      <View style={h.row}>
        <View style={{ flex: 1 }}>
          <Text style={h.date}>
            {text({
              en: `YEAR ${d.year} · MONTH ${d.month} · WEEK ${d.week}`,
              th: `ปี ${d.year} · เดือน ${d.month} · สัปดาห์ ${d.week}`,
            })}
          </Text>
          <Text
            accessibilityLabel={`$${Math.floor(s.money).toLocaleString()}`}
            style={[h.money, s.money < 0 && { color: '#F2A49B' }]}
          >
            ${compact(s.money)}
          </Text>
        </View>
        <View style={h.resource}>
          <Star size={14} color={ui.gold} />
          <Text style={h.value}>{compact(s.fame)}</Text>
        </View>
        <View style={h.resource}>
          <FlaskConical size={14} color="#8FC9EA" />
          <Text style={h.value}>{compact(s.rd)}</Text>
        </View>
      </View>
      <View style={h.row}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={h.rank}>{text({ en: `RANK ${s.rank}`, th: `แรงก์ ${s.rank}` })}</Text>
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
        {B.speeds.map(speed => (
          <Pressable
            key={speed}
            accessibilityRole="button"
            accessibilityState={{ selected: s.speed === speed }}
            accessibilityLabel={text(
              speed === 0
                ? { en: 'Pause', th: 'หยุดเวลา' }
                : { en: `Speed ${speed}×`, th: `ความเร็ว ${speed} เท่า` },
            )}
            onPress={() => dispatch(s => ({ ...s, speed }))}
            style={[h.button, s.speed === speed && { backgroundColor: ui.gold }]}
          >
            {speed === 0 ? (
              <Pause size={16} color={ui.ink} />
            ) : (
              <Text style={h.speed}>{speed}×</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  )
}
const h = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ui.navy,
    borderBottomWidth: 3,
    borderColor: ui.ink,
    gap: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontFamily: 'Kanit_400Regular', fontSize: 11, color: '#D9E2E0' },
  money: { fontFamily: 'PixelifySans_700Bold', fontSize: 26, color: ui.gold },
  resource: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: '#1B303A',
    padding: 6,
    borderRadius: 4,
  },
  value: { fontFamily: 'PixelifySans_700Bold', fontSize: 17, color: ui.paper },
  rank: { fontFamily: 'Kanit_600SemiBold', fontSize: 11, color: ui.paper },
  track: { height: 7, backgroundColor: '#1B303A', borderWidth: 1, borderColor: ui.ink },
  button: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 4,
    backgroundColor: ui.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: { fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: ui.ink },
})
