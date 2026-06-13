import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type Stat = {
  label: string
  value: string
  color: string
}

type ResourceBarProps = {
  stats: Stat[]
}

function ResourceBar({ stats }: ResourceBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.chip, { borderColor: stat.color }]}>
          <Text style={[styles.label, { color: stat.color }]}>{stat.label}</Text>
          <Text style={styles.value}>{stat.value}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 84,
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
