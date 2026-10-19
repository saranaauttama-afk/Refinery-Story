import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useGame } from '../store/useGame'
import { dateAt } from '../sim/time'
import { B } from '../data/balance'
export function HUD() {
  const { state: s, dispatch } = useGame()
  const d = dateAt(s.tick)
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>
        Y{d.year} M{d.month} W{d.week} ${Math.floor(s.money).toLocaleString()} ★{s.fame} RD {s.rd}
      </Text>
      <View style={styles.row}>
        {B.speeds.map(speed => (
          <Pressable
            key={speed}
            onPress={() => dispatch(s => ({ ...s, speed }))}
            style={[styles.button, s.speed === speed && styles.selected]}
          >
            <Text>{speed === 0 ? 'Ⅱ' : `${speed}×`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  bar: {
    padding: 10,
    backgroundColor: '#FFF6E3',
    borderBottomWidth: 2,
    borderColor: '#14110F',
    gap: 6,
  },
  label: { fontFamily: 'PixelifySans_700Bold', fontSize: 17 },
  row: { flexDirection: 'row', gap: 8 },
  button: { padding: 10, backgroundColor: '#D8D2C4', borderWidth: 1, borderRadius: 6 },
  selected: { backgroundColor: '#F2C230' },
})
