import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type FeedstockPriorityRowProps = {
  title: string
  value: number // 0 to 2, in 0.25 steps
  min: number
  max: number
  onAdjust: (delta: number) => void
}

// Stepper row: "- [125%] +", used by the Feedstock Priority card.
// 0% = off (this plant never produces, see useGameLoop.ts), 100% =
// default/unchanged, >100% = priority during scarcity (capped at the
// plant's own normal output).
function FeedstockPriorityRow({ title, value, min, max, onAdjust }: FeedstockPriorityRowProps) {
  const pct = Math.round(value * 100)
  const isOff = value <= 0

  return (
    <View style={styles.row}>
      <Text style={[styles.title, isOff && styles.titleOff]}>{title}</Text>
      <View style={styles.stepper}>
        <Pressable
          disabled={value <= min}
          onPress={() => onAdjust(-1)}
          style={[styles.button, value <= min ? styles.buttonDisabled : styles.buttonActive]}
        >
          <Text style={styles.buttonLabel}>−</Text>
        </Pressable>
        <Text style={[styles.value, isOff && styles.valueOff]}>{pct}%</Text>
        <Pressable
          disabled={value >= max}
          onPress={() => onAdjust(1)}
          style={[styles.button, value >= max ? styles.buttonDisabled : styles.buttonActive]}
        >
          <Text style={styles.buttonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  title: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 14,
  },
  titleOff: {
    color: colors.inkMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.green,
    borderColor: colors.ink,
  },
  buttonDisabled: {
    backgroundColor: colors.white,
    borderColor: colors.creamBorder,
    opacity: 0.5,
  },
  buttonLabel: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  value: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.ink,
    minWidth: 44,
    textAlign: 'center',
  },
  valueOff: {
    color: colors.orangeDark,
  },
})

export default FeedstockPriorityRow
