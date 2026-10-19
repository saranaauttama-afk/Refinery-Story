import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { B } from '../data/balance'
import { ranks } from '../data/ranks'
import { text } from '../i18n'

export function HUD() {
  const { state: s, dispatch } = useGame()
  const d = dateAt(s.tick)
  const current = ranks[s.rank - 1]
  const next = ranks[s.rank]
  const progress = next ? (s.fame - current.fame) / (next.fame - current.fame) : 1
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <Text style={[styles.chip, styles.date]}>
          {text({
            en: `Y${d.year} · M${d.month} · W${d.week}`,
            th: `ปี ${d.year} · ด.${d.month} · ส.${d.week}`,
          })}
        </Text>
        <Text style={[styles.chip, { backgroundColor: s.money < 0 ? '#F2A49B' : '#F2C230' }]}>
          ${Math.floor(s.money).toLocaleString()}
        </Text>
        <Text style={styles.chip}>★ {Math.round(s.fame).toLocaleString()}</Text>
        <Text style={styles.chip}>RD {Math.floor(s.rd).toLocaleString()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rank}>
          {next
            ? text({ en: `Rank ${s.rank}→${s.rank + 1}`, th: `แรงก์ ${s.rank}→${s.rank + 1}` })
            : text({ en: `Rank ${s.rank}`, th: `แรงก์ ${s.rank}` })}
        </Text>
        <View style={styles.track}>
          <View
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: '100%',
              backgroundColor: '#F2C230',
            }}
          />
        </View>
        {B.speeds.map(speed => (
          <Pressable
            key={speed}
            accessibilityRole="button"
            accessibilityLabel={speed === 0 ? 'pause' : `${speed}x`}
            onPress={() => dispatch(s => ({ ...s, speed }))}
            style={[styles.button, s.speed === speed && styles.selected]}
          >
            <Text style={styles.buttonText}>{speed === 0 ? 'II' : `${speed}×`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF6E3',
    borderBottomWidth: 2,
    borderColor: '#14110F',
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 14,
    color: '#14110F',
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#FFF6E3',
    overflow: 'hidden',
  },
  date: { backgroundColor: '#14110F', color: '#FFF6E3', fontFamily: 'Kanit_400Regular' },
  rank: { fontFamily: 'Kanit_400Regular', fontSize: 13, color: '#3B3F47' },
  track: {
    flex: 1,
    height: 10,
    borderWidth: 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  button: {
    minWidth: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6E3',
    borderWidth: 2,
    borderRadius: 6,
  },
  selected: { backgroundColor: '#F2C230' },
  buttonText: { fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: '#14110F' },
})
