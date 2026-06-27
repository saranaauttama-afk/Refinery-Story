import { useEffect } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import type { AwardRecord } from '../game/types'
import { colors, fonts, radii, spacing } from '../theme'

const GRADE_COLORS: Record<string, string> = {
  S: colors.gold,
  A: colors.green,
  B: colors.blue,
  C: colors.steelMid,
}

type AwardModalProps = {
  record: AwardRecord | null
  onDismiss: () => void
}

function AwardModal({ record, onDismiss }: AwardModalProps) {
  // Ceremony entrance: the card springs up, then the grade badge pops in with
  // a little overshoot a beat later -- a reveal moment rather than a static
  // dialog. Driven off `record` becoming non-null (the modal stays mounted in
  // GlobalOverlays, so we key on the prop, not mount).
  const cardScale = useSharedValue(0.85)
  const cardOpacity = useSharedValue(0)
  const badgeScale = useSharedValue(0)

  useEffect(() => {
    if (!record) return
    cardScale.value = 0.85
    cardOpacity.value = 0
    badgeScale.value = 0
    cardOpacity.value = withTiming(1, { duration: 200 })
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 })
    badgeScale.value = withDelay(260, withSpring(1, { damping: 9, stiffness: 200 }))
  }, [record, cardScale, cardOpacity, badgeScale])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }))
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }))

  if (!record) return null

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.title}>Year {record.year} Results</Text>
          <Animated.View style={[styles.gradeBadge, badgeStyle, { backgroundColor: GRADE_COLORS[record.grade] ?? colors.steelMid }]}>
            <Text style={styles.gradeText}>{record.grade}</Text>
          </Animated.View>
          <Text style={styles.row}>Score: {record.score}</Text>
          <Text style={styles.row}>Money earned: ${record.moneyEarned.toLocaleString()}</Text>
          <Text style={styles.row}>Payroll: ${record.payroll.toLocaleString()}</Text>
          <Text style={styles.row}>Net profit: ${record.netProfit.toLocaleString()}</Text>
          <Text style={styles.row}>Cash bonus: +${record.cashReward.toLocaleString()}</Text>
          <Text style={styles.row}>Gasoline produced: {record.gasolineProduced.toLocaleString()}</Text>
          <Text style={styles.row}>Contracts completed: {record.contractsCompleted}</Text>
          {record.couldNotAfford && (
            <Text style={styles.warning}>⚠️ Payroll exceeded cash on hand -- reputation took a small hit.</Text>
          )}

          {record.rivals.length > 0 && (
            <View style={styles.rivalsBox}>
              <Text style={styles.rivalsTitle}>Annual Ranking (#{record.playerRank} of {record.rivals.length + 1})</Text>
              <ScrollView style={styles.rivalsList}>
                <Text style={styles.rivalRow}>You · {record.score} ({record.grade})</Text>
                {record.rivals.map((r) => (
                  <Text key={r.key} style={styles.rivalRow}>
                    {r.name.en} · {r.score} ({r.grade})
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissLabel}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 19,
    fontFamily: fonts.display,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  gradeBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    marginBottom: spacing.sm,
  },
  gradeText: {
    fontSize: 26,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  row: {
    fontSize: 13,
    color: colors.ink,
    marginBottom: 2,
  },
  warning: {
    fontSize: 12,
    color: colors.red,
    marginTop: spacing.xs,
  },
  rivalsBox: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.creamBorder,
    paddingTop: spacing.sm,
  },
  rivalsTitle: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  rivalsList: {
    maxHeight: 100,
  },
  rivalRow: {
    fontSize: 12,
    color: colors.inkMuted,
    paddingVertical: 1,
  },
  dismissButton: {
    marginTop: spacing.md,
    backgroundColor: colors.green,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dismissLabel: {
    fontWeight: '800',
    color: colors.ink,
  },
})

export default AwardModal
