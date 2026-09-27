import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

export type StatBox = {
  key: string
  label: string
  value: string
  color: string
}

type StatBoxRowProps = {
  boxes: StatBox[]
}

// A row of grouped stat boxes (label + big value, each its own card),
// closer to the reference mockup's "Era / Money / Crude / Reputation"
// boxes than the existing flat ResourceBar strip. Deliberately doesn't
// show a per-hour rate next to each value like the mockup does -- this
// game doesn't compute one (production is tick-based, not a clean
// per-hour figure), so each box only shows real values the game already
// has, no fabricated numbers.
function StatBoxRow({ boxes }: StatBoxRowProps) {
  return (
    <View style={styles.row}>
      {boxes.map((box) => (
        <View key={box.key} style={styles.box}>
          <Text style={styles.label} numberOfLines={1}>
            {box.label}
          </Text>
          <Text style={[styles.value, { color: box.color }]} numberOfLines={1}>
            {box.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  box: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
})

export default StatBoxRow
