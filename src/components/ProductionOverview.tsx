import { StyleSheet, Text, View } from 'react-native'
import ProgressBar from './ProgressBar'
import { colors, spacing } from '../theme'

export type ProductionOverviewRow = {
  key: string
  label: string
  current: number
  max: number
  color: string
}

type ProductionOverviewProps = {
  rows: ProductionOverviewRow[]
}

// Rows-only -- the caller wraps this in a CollapsibleCard (see
// app/game/(tabs)/index.tsx) which provides the card chrome (border,
// title, tap-to-collapse header) and shows the active product count as
// the collapsed-state summary.
function ProductionOverview({ rows }: ProductionOverviewProps) {
  if (rows.length === 0) return null

  return (
    <View>
      {rows.map((row) => {
        const pct = row.max > 0 ? Math.round((row.current / row.max) * 100) : 0
        return (
          <View key={row.key} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {row.label}
            </Text>
            <ProgressBar current={row.current} target={row.max} color={row.color} />
            <Text style={styles.pct}>{pct}%</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    width: 78,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  pct: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
  },
})

export default ProductionOverview
