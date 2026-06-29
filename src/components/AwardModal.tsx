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
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'
import { getRivalConfig } from '../game/data/rivals'

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

const MEDALS = ['🥇', '🥈', '🥉']

function AwardModal({ record, onDismiss }: AwardModalProps) {
  const { t } = useLang()
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
          {record.maintenance ? (
            <Text style={styles.row}>Maintenance: ${record.maintenance.toLocaleString()}</Text>
          ) : null}
          <Text style={styles.row}>Net profit: ${record.netProfit.toLocaleString()}</Text>
          <Text style={styles.row}>Cash bonus: +${record.cashReward.toLocaleString()}</Text>
          <Text style={styles.row}>Gasoline produced: {record.gasolineProduced.toLocaleString()}</Text>
          <Text style={styles.row}>Contracts completed: {record.contractsCompleted}</Text>
          {typeof record.morale === 'number' && (
            <Text style={styles.row}>
              Staff morale: {record.morale}%{' '}
              {record.morale >= 75 ? '😊' : record.morale < 40 ? '😟' : '😐'}
            </Text>
          )}
          {record.couldNotAfford && (
            <Text style={styles.warning}>⚠️ Payroll exceeded cash on hand -- reputation took a small hit.</Text>
          )}

          {record.rivals.length > 0 && (() => {
            // Combined leaderboard, sorted by score — the player is one of the
            // four. Highlight the player's row + medals + a rank-movement line.
            const board = [
              { key: '__you', name: t(text.award.you), score: record.score, isPlayer: true },
              ...record.rivals.map((r) => ({ key: r.key, name: t(r.name), score: r.score, isPlayer: false })),
            ].sort((a, b) => b.score - a.score)
            const myIndex = board.findIndex((e) => e.isPlayer)
            const rank = record.playerRank
            const prev = record.previousRank
            // Rank movement (lower rank number = better).
            const move =
              rank === 1 ? t(text.award.rankTop)
              : prev === undefined ? t(text.award.rankHeld(rank))
              : rank < prev ? t(text.award.rankClimbed(rank))
              : rank > prev ? t(text.award.rankSlipped(rank))
              : t(text.award.rankHeld(rank))
            const moveColor = rank === 1 ? colors.gold : prev !== undefined && rank < prev ? colors.green : prev !== undefined && rank > prev ? colors.orange : colors.steelMid
            // Rivalry beat: the rival directly above you taunts; if you're #1 the
            // runner-up concedes; otherwise nudge the player to catch the target.
            const target = myIndex > 0 ? board[myIndex - 1] : null
            const targetCfg = target && !target.isPlayer ? getRivalConfig(target.key) : null
            const runnerUp = rank === 1 ? board[1] : null
            const runnerUpCfg = runnerUp ? getRivalConfig(runnerUp.key) : null
            const beat = runnerUpCfg ? t(runnerUpCfg.concede)
              : targetCfg ? t(targetCfg.taunt)
              : null
            const beatNudge = rank === 1 ? t(text.award.defendLead)
              : target ? t(text.award.catchThem(target.name)) : null

            return (
              <View style={styles.rivalsBox}>
                <View style={styles.rankHeader}>
                  <Text style={styles.rivalsTitle}>{t(text.award.annualRanking)}</Text>
                  <Text style={[styles.rankMove, { color: moveColor }]}>{move}</Text>
                </View>
                <ScrollView style={styles.rivalsList}>
                  {board.map((e, i) => (
                    <View key={e.key} style={[styles.rivalRowBox, e.isPlayer && styles.rivalRowYou]}>
                      <Text style={[styles.rivalRow, e.isPlayer && styles.rivalRowYouText]}>
                        {i < 3 ? MEDALS[i] : `#${i + 1}`} {e.name}
                      </Text>
                      <Text style={[styles.rivalScore, e.isPlayer && styles.rivalRowYouText]}>{e.score.toLocaleString()}</Text>
                    </View>
                  ))}
                </ScrollView>
                {beat && <Text style={styles.rivalTaunt}>{beat}</Text>}
                {beatNudge && <Text style={styles.rivalNudge}>{beatNudge}</Text>}
              </View>
            )
          })()}

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
    maxHeight: 130,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rankMove: {
    fontSize: 12,
    fontWeight: '800',
  },
  rivalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  rivalRowYou: {
    backgroundColor: 'rgba(242,193,46,0.18)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  rivalRow: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  rivalScore: {
    fontSize: 12.5,
    color: colors.inkMuted,
    fontWeight: '700',
  },
  rivalRowYouText: {
    color: colors.ink,
    fontWeight: '800',
  },
  rivalTaunt: {
    fontSize: 12,
    color: colors.ink,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  rivalNudge: {
    fontSize: 12,
    color: colors.blue,
    fontWeight: '800',
    marginTop: 2,
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
