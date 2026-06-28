import { StyleSheet, Text, View } from 'react-native'

import { colors, radii } from '../theme'

// Per-product demand-saturation readout for the sell UI. Each product's market
// level (1.0 = full price, down to the saturation floor) is shown as a bar so
// you can see at a glance which products are flooded and should be held back —
// dumping a saturated product just tanks its own price further. Unlike the crude
// price wave this isn't forecastable (it depends on how much you sell), so it's
// a live gauge, not a line chart.
export default function SaturationBars({ rows }: { rows: { label: string; level: number }[] }) {
  if (rows.length === 0) return null
  return (
    <View style={styles.wrap}>
      {rows.map((r) => {
        const pct = Math.round(r.level * 100)
        const c = r.level >= 0.85 ? colors.green : r.level >= 0.65 ? colors.gold : colors.orange
        return (
          <View key={r.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>{r.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c }]} />
            </View>
            <Text style={[styles.pct, { color: c }]}>{pct}%</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 74, fontSize: 11, fontWeight: '700', color: colors.ink },
  track: { flex: 1, height: 8, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  pct: { width: 34, fontSize: 11, fontWeight: '800', textAlign: 'right' },
})
