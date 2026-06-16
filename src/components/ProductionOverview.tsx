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

// Dashboard-style panel listing each active product's current stock level
// as a percentage of its storage cap (current/max), one row per product
// with a colored progress bar -- visually similar to the "Production
// Overview" panel in the reference mockup, but using stock-level (not a
// fabricated "production rate %") since that's the metric this game
// already computes honestly for every product via maxXStorage in
// DerivedStats. A full bar means "about to hit cap, sell some or build
// more storage"; an empty bar means "nothing in stock yet."
function ProductionOverview({ rows }: ProductionOverviewProps) {
  if (rows.length === 0) return null

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📊 Production Overview</Text>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
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
