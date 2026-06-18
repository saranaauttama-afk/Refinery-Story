import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

export type IconStat = {
  key: string
  icon: React.ReactNode
  value: string
  color: string
}

type IconStatBarProps = {
  stats: IconStat[]
}

// Compact icon-led badge row -- replaces the old StatBoxRow (3 large
// boxes with spelled-out uppercase labels) and most of ResourceBar's role
// in the floating top overlay. Per explicit feedback: the old header
// stack (header + StatBoxRow + ResourceBar, each its own row of boxes)
// added up to badges so large they spilled down roughly half the screen.
// This is ONE row of small pill badges, icon-first, with just a short
// value string and no spelled-out label -- the icon IS the label. Wraps
// if there are more stats than fit one line, but the design intent is to
// keep this short enough that it normally doesn't need to.
function IconStatBar({ stats }: IconStatBarProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.key} style={[styles.badge, { borderColor: stat.color }]}>
          {stat.icon}
          <Text style={styles.value} numberOfLines={1}>
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
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
})

export default IconStatBar
