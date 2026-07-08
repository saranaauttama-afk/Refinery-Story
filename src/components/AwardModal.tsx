import { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import type { AwardRecord } from '../game/types'
import { colors, fonts, radii, spacing } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'
import { getRivalConfig } from '../game/data/rivals'
import { formatCompactNumber } from '../game/utils/gameCalculations'
import Dialog, { DialogButton } from './Dialog'

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
  // The grade badge pops in with a little overshoot a beat after the card
  // springs up (Dialog owns the card entrance) — a reveal moment, not a static
  // dialog. Keyed on `record` since the modal stays mounted in GlobalOverlays.
  const badgeScale = useSharedValue(0)

  useEffect(() => {
    if (!record) return
    badgeScale.value = 0
    badgeScale.value = withDelay(280, withSpring(1, { damping: 9, stiffness: 200 }))
  }, [record, badgeScale])

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }))

  return (
    <Dialog
      visible={!!record}
      dismissOnBackdrop={false}
      title={record ? `Year ${record.year} Results` : undefined}
      scroll
      footer={<DialogButton label="Continue" variant="primary" onPress={onDismiss} />}
    >
      {record ? (
        <>
          <Animated.View style={[styles.gradeBadge, badgeStyle, { backgroundColor: GRADE_COLORS[record.grade] ?? colors.steelMid }]}>
            <Text style={styles.gradeText}>{record.grade}</Text>
          </Animated.View>

          <View style={styles.statsPanel}>
            <Row label="Score" value={formatCompactNumber(record.score)} />
            <Row label="Money earned" value={`$${formatCompactNumber(record.moneyEarned)}`} />
            <Row label="Payroll" value={`$${formatCompactNumber(record.payroll)}`} />
            {record.maintenance ? <Row label="Maintenance" value={`$${formatCompactNumber(record.maintenance)}`} /> : null}
            <Row label="Net profit" value={`$${formatCompactNumber(record.netProfit)}`} />
            <Row label="Cash bonus" value={`+$${formatCompactNumber(record.cashReward)}`} />
            <Row label="Gasoline produced" value={formatCompactNumber(record.gasolineProduced)} />
            <Row label="Contracts completed" value={`${record.contractsCompleted}`} />
            {typeof record.morale === 'number' && (
              <Row
                label="Staff morale"
                value={`${record.morale}% ${record.morale >= 75 ? '😊' : record.morale < 40 ? '😟' : '😐'}`}
              />
            )}
          </View>

          {record.couldNotAfford && (
            <Text style={styles.warning}>⚠️ Payroll exceeded cash on hand — reputation took a small hit.</Text>
          )}

          {(record.rivals?.length ?? 0) > 0 && (() => {
            const board = [
              { key: '__you', name: t(text.award.you), score: record.score, isPlayer: true },
              ...(record.rivals ?? []).map((r) => ({ key: r.key, name: t(r.name), score: r.score, isPlayer: false })),
            ].sort((a, b) => b.score - a.score)
            const myIndex = board.findIndex((e) => e.isPlayer)
            const rank = record.playerRank
            const prev = record.previousRank
            const move =
              rank === 1 ? t(text.award.rankTop)
              : prev === undefined ? t(text.award.rankHeld(rank))
              : rank < prev ? t(text.award.rankClimbed(rank))
              : rank > prev ? t(text.award.rankSlipped(rank))
              : t(text.award.rankHeld(rank))
            const moveColor = rank === 1 ? colors.gold : prev !== undefined && rank < prev ? colors.green : prev !== undefined && rank > prev ? colors.orange : colors.steelMid
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
                      <Text style={[styles.rivalScore, e.isPlayer && styles.rivalRowYouText]}>{formatCompactNumber(e.score)}</Text>
                    </View>
                  ))}
                </ScrollView>
                {beat && <Text style={styles.rivalTaunt}>{beat}</Text>}
                {beatNudge && <Text style={styles.rivalNudge}>{beatNudge}</Text>}
              </View>
            )
          })()}
        </>
      ) : null}
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  gradeBadge: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gradeText: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: '#241a02',
  },
  statsPanel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.6)' },
  rowValue: { fontSize: 13, fontFamily: fonts.heading, color: '#EAF1F8' },
  warning: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#F3B4AC',
    marginTop: spacing.sm,
  },
  rivalsBox: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: spacing.md,
  },
  rivalsTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#EAF1F8',
    marginBottom: 4,
  },
  rivalsList: { maxHeight: 150 },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rankMove: { fontSize: 12, fontFamily: fonts.heading },
  rivalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  rivalRowYou: {
    backgroundColor: 'rgba(242,193,46,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242,193,46,0.55)',
  },
  rivalRow: { fontSize: 12.5, fontFamily: fonts.body, color: 'rgba(255,255,255,0.6)' },
  rivalScore: { fontSize: 12.5, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.6)' },
  rivalRowYouText: { color: '#F7F3E6' },
  rivalTaunt: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  rivalNudge: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: colors.teal,
    marginTop: 3,
  },
})

export default AwardModal
