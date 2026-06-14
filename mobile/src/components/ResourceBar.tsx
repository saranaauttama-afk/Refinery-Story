import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type Stat = {
  label: string
  value: string
  color: string
}

type ResourceBarProps = {
  stats: Stat[]
}

// Wraps into rows of 3 instead of horizontal-scrolling -- on some devices
// horizontal ScrollViews inside a screen with other gesture handlers
// (Pressable header, bottom tabs) didn't scroll reliably, and a wrapping
// grid means every stat is visible without any gesture at all.
function ResourceBar({ stats }: ResourceBarProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.chip, { borderColor: stat.color }]}>
          <Text style={[styles.label, { color: stat.color }]} numberOfLines={1}>
            {stat.label}
          </Text>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
})

export default ResourceBar
