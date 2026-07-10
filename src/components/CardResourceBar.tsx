import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii, spacing } from '../theme'
import GameIcon from './GameIcon'

type StatCard = {
  icon: string | React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  color?: string
  warn?: boolean
  onPress?: () => void
}

type CardResourceBarProps = {
  stats: StatCard[]
}

/**
 * CardResourceBar — Card-based resource display.
 *
 * Groups related stats into clean cards instead of a cramped horizontal row.
 * Each card has:
 * - Icon on the left
 * - Value (large, prominent)
 * - Label below
 * - Optional subtitle (for rates, trends)
 * - Optional press handler
 *
 * Layout adapts to available width — wraps to multiple rows if needed.
 *
 * Example:
 * ╭────────┐ ╭────────┐ ╭────────┐ ╭────────┐
 * │ 💰     │ │ 🛢️     │ │ ⛽     │ │ ⭐     │
 * │ $12.5K │ │ 45     │ │ 78     │ │ 142    │
 * │ Money  │ │ Crude  │ │ Gas    │ │ Rep ⓘ  │
 * │+$1.2K  │ │ →full  │ │ +5/min │ │ ESG 72 │
 * ╰────────┘ ╰────────┘ ╰────────┘ ╰────────┘
 */
export default function CardResourceBar({ stats }: CardResourceBarProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => {
        const Content = (
          <View style={[styles.card, stat.warn && styles.cardWarn]}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              {typeof stat.icon === 'string' ? (
                <Text style={styles.iconEmoji}>{stat.icon}</Text>
              ) : (
                stat.icon
              )}
            </View>

            {/* Value + Label */}
            <View style={styles.textBlock}>
              <Text
                style={[styles.value, stat.color ? { color: stat.color } : null]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stat.value}
              </Text>
              <View style={styles.labelRow}>
                <Text style={styles.label} numberOfLines={1}>
                  {stat.label}
                </Text>
                {stat.onPress && <Text style={styles.expandDot}>⋯</Text>}
              </View>
              {stat.subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {stat.subtitle}
                </Text>
              )}
            </View>
          </View>
        )

        if (stat.onPress) {
          return (
            <Pressable key={index} style={styles.pressable} onPress={stat.onPress}>
              {Content}
            </Pressable>
          )
        }

        return <View key={index}>{Content}</View>
      })}
    </View>
  )
}

/**
 * MeterColor — utility for coloring stat values based on health.
 * Red < 40, Orange < 60, default green/white.
 */
export function getMeterColor(value: number): string {
  if (value < 40) return colors.red
  if (value < 60) return colors.orange
  return colors.green
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pressable: {
    flex: 1,
    minWidth: '22%',
  },
  card: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: 'rgba(20, 28, 40, 0.92)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  cardWarn: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandDot: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  subtitle: {
    fontSize: 9,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 1,
  },
})
