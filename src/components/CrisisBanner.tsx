import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActiveCrisis } from '../game/types'
import { colors, radii, spacing } from '../theme'
import { TICK_MS } from '../game/utils/gameCalculations'

type Props = {
  crisis: ActiveCrisis | null
  currentTick: number
  money: number
  onFix: () => void
  onIgnore: () => void
}

const URGENCY_COLOR = {
  low:    '#F2C12E',
  medium: '#E8833A',
  high:   '#E05252',
}

export default function CrisisBanner({ crisis, currentTick, money, onFix, onIgnore }: Props) {
  if (!crisis) return null

  const ticksLeft = Math.max(0, crisis.expiresAtTick - currentTick)
  const secondsLeft = Math.round((ticksLeft * TICK_MS) / 1000)
  const minutesLeft = Math.floor(secondsLeft / 60)
  const timeLabel = minutesLeft > 60
    ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
    : minutesLeft > 0
      ? `${minutesLeft}m`
      : `${secondsLeft}s`

  const urgencyColor = URGENCY_COLOR[crisis.urgency]
  const canFix = money >= crisis.fixCost
  const pct = crisis.urgency === 'high' ? 0.8 : crisis.urgency === 'medium' ? 0.5 : 0.3

  return (
    <View style={[styles.wrap, { borderColor: urgencyColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: urgencyColor }]}>{crisis.title}</Text>
        <View style={[styles.timer, { backgroundColor: urgencyColor + '22' }]}>
          <Text style={[styles.timerText, { color: urgencyColor }]}>⏱ {timeLabel}</Text>
        </View>
      </View>
      <Text style={styles.desc}>{crisis.description}</Text>
      <Text style={styles.penalty}>If ignored: {crisis.penaltyDescription}</Text>
      <View style={styles.actions}>
        <Pressable
          style={[styles.fixBtn, !canFix && styles.fixBtnOff]}
          onPress={onFix}
        >
          <Text style={styles.fixBtnLabel}>
            {canFix ? `Fix Now — $${crisis.fixCost.toLocaleString()}` : `Need $${crisis.fixCost.toLocaleString()}`}
          </Text>
        </Pressable>
        <Pressable style={styles.ignoreBtn} onPress={onIgnore}>
          <Text style={styles.ignoreBtnLabel}>Ignore</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 104,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#1C2634',
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.sm,
    zIndex: 35,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 13, fontWeight: '900' },
  timer: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timerText: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 15 },
  penalty: { fontSize: 10, color: '#E05252', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  fixBtn: {
    flex: 2,
    backgroundColor: colors.green,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  fixBtnOff: { backgroundColor: '#2E3D50' },
  fixBtnLabel: { fontSize: 12, fontWeight: '800', color: '#fff' },
  ignoreBtn: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ignoreBtnLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
})
