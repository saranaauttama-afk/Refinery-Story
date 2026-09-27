import { useEffect } from 'react'
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'

import type { AwardRecord } from '../game/types'
import { colors, fonts, radii, spacing } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'
import { getRivalConfig } from '../game/data/rivals'
import { formatCompactNumber } from '../game/utils/gameCalculations'

const AWARDS_BG = require('../../assets/bg/awards_ceremony_v1.png')

const GRADE_COLORS: Record<string, string> = {
  S: colors.gold,
  A: colors.green,
  B: '#74B8F0',
  C: colors.steelMid,
}

const MEDALS = ['🥇', '🥈', '🥉']

type AwardModalProps = {
  record: AwardRecord | null
  onDismiss: () => void
}

function AwardModal({ record, onDismiss }: AwardModalProps) {
  const { t } = useLang()
  const badgeScale = useSharedValue(0)

  useEffect(() => {
    if (!record) return
    badgeScale.value = 0
    badgeScale.value = withDelay(320, withSpring(1, { damping: 9, stiffness: 190 }))
  }, [record, badgeScale])

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeScale.value,
    transform: [{ scale: badgeScale.value }],
  }))

  if (!record) return null

  const board = [
    { key: '__you', name: t(text.award.you), score: record.score, isPlayer: true },
    ...(record.rivals ?? []).map((r) => ({ key: r.key, name: t(r.name), score: r.score, isPlayer: false })),
  ].sort((a, b) => b.score - a.score)
  const myIndex = board.findIndex((entry) => entry.isPlayer)
  const rank = record.playerRank
  const previousRank = record.previousRank
  const move = rank === 1
    ? t(text.award.rankTop)
    : previousRank === undefined
      ? t(text.award.rankHeld(rank))
      : rank < previousRank
        ? t(text.award.rankClimbed(rank))
        : rank > previousRank
          ? t(text.award.rankSlipped(rank))
          : t(text.award.rankHeld(rank))
  const moveColor = rank === 1
    ? colors.gold
    : previousRank !== undefined && rank < previousRank
      ? colors.green
      : previousRank !== undefined && rank > previousRank
        ? colors.orange
        : colors.steelMid
  const target = myIndex > 0 ? board[myIndex - 1] : null
  const targetConfig = target && !target.isPlayer ? getRivalConfig(target.key) : null
  const runnerUp = rank === 1 ? board[1] : null
  const runnerUpConfig = runnerUp ? getRivalConfig(runnerUp.key) : null
  const rivalLine = runnerUpConfig
    ? t(runnerUpConfig.concede)
    : targetConfig
      ? t(targetConfig.taunt)
      : null
  const nextGoal = rank === 1
    ? t(text.award.defendLead)
    : target
      ? t(text.award.catchThem(target.name))
      : null
  const gradeColor = GRADE_COLORS[record.grade] ?? colors.steelMid

  return (
    <Modal visible animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <ImageBackground source={AWARDS_BG} resizeMode="cover" style={styles.background}>
        <View style={styles.sceneShade} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>{t(text.awards.kicker).toUpperCase()}</Text>
            <Text style={styles.title}>{t(text.awards.ceremonyTitle(record.year))}</Text>
            <Animated.View
              style={[styles.gradeBadge, badgeStyle, { borderColor: gradeColor, shadowColor: gradeColor }]}
            >
              <Text style={[styles.gradeText, { color: gradeColor }]}>{record.grade}</Text>
            </Animated.View>
            <View style={[styles.rewardPill, { borderColor: gradeColor }]}>
              <Text style={styles.rewardText}>{t(text.awards.ceremonyReward(record.cashReward))}</Text>
            </View>
          </View>

          <View style={styles.resultsSheet}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryRow}>
                <SummaryStat label={t({ en: 'Score', th: 'คะแนน' })} value={formatCompactNumber(record.score)} accent={gradeColor} />
                <View style={styles.summaryDivider} />
                <SummaryStat label={t(text.awards.statNet)} value={`$${formatCompactNumber(record.netProfit)}`} />
                <View style={styles.summaryDivider} />
                <SummaryStat label={t(text.awards.statContracts)} value={`${record.contractsCompleted}`} />
              </View>

              <Text style={styles.sectionLabel}>{t({ en: 'YEAR IN REVIEW', th: 'สรุปผลงานประจำปี' })}</Text>
              <View style={styles.statsPanel}>
                <Row label={t(text.awards.statMoney)} value={`$${formatCompactNumber(record.moneyEarned)}`} />
                <Row label={t(text.awards.statPayroll)} value={`-$${formatCompactNumber(record.payroll)}`} />
                {record.maintenance ? (
                  <Row label={t({ en: 'Maintenance', th: 'ค่าบำรุงรักษา' })} value={`-$${formatCompactNumber(record.maintenance)}`} />
                ) : null}
                <Row label={t(text.awards.statGasoline)} value={formatCompactNumber(record.gasolineProduced)} />
                {typeof record.morale === 'number' ? (
                  <Row
                    label={t({ en: 'Staff morale', th: 'ขวัญกำลังใจทีม' })}
                    value={`${record.morale}% ${record.morale >= 75 ? '😊' : record.morale < 40 ? '😟' : '😐'}`}
                  />
                ) : null}
              </View>

              {record.couldNotAfford ? <Text style={styles.warning}>⚠️ {t(text.awards.unpaidWarning)}</Text> : null}

              {board.length > 1 ? (
                <View style={styles.rivalsBox}>
                  <View style={styles.rankHeader}>
                    <View>
                      <Text style={styles.sectionLabel}>{t(text.awards.rankingTitle).toUpperCase()}</Text>
                      <Text style={styles.rankPosition}>{t(text.awards.rankingPosition(rank, board.length))}</Text>
                    </View>
                    <Text style={[styles.rankMove, { color: moveColor }]}>{move}</Text>
                  </View>
                  {board.map((entry, index) => (
                    <View key={entry.key} style={[styles.rivalRow, entry.isPlayer && styles.rivalRowYou]}>
                      <Text style={[styles.rivalName, entry.isPlayer && styles.rivalYouText]}>
                        {index < 3 ? MEDALS[index] : `#${index + 1}`}  {entry.name}
                      </Text>
                      <Text style={[styles.rivalScore, entry.isPlayer && styles.rivalYouText]}>
                        {formatCompactNumber(entry.score)}
                      </Text>
                    </View>
                  ))}
                  {rivalLine ? <Text style={styles.rivalLine}>{rivalLine}</Text> : null}
                  {nextGoal ? <Text style={styles.nextGoal}>{nextGoal}</Text> : null}
                </View>
              ) : null}
            </ScrollView>

            <Pressable style={styles.continueButton} onPress={onDismiss}>
              <Text style={styles.continueText}>{t(text.awards.ceremonyClose)}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Modal>
  )
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
    </View>
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
  background: { flex: 1, backgroundColor: '#061827' },
  sceneShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(2, 12, 24, 0.14)' },
  safe: { flex: 1 },
  hero: { minHeight: 300, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  kicker: { fontSize: 11, fontFamily: fonts.heading, color: '#FFD447', letterSpacing: 2.2, textShadowColor: '#061522', textShadowRadius: 4 },
  title: { marginTop: 2, fontSize: 24, lineHeight: 29, fontFamily: fonts.display, color: '#FFFFFF', textAlign: 'center', textShadowColor: '#061522', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 5 },
  gradeBadge: { width: 88, height: 88, marginTop: 104, borderRadius: 44, borderWidth: 4, backgroundColor: 'rgba(4, 22, 38, 0.94)', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.72, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 14 },
  gradeText: { fontSize: 52, lineHeight: 57, fontFamily: fonts.display },
  rewardPill: { marginTop: 8, paddingHorizontal: 15, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, backgroundColor: 'rgba(5, 25, 43, 0.9)' },
  rewardText: { fontSize: 13, fontFamily: fonts.heading, color: '#FFFFFF' },
  resultsSheet: { flex: 1, marginTop: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(105, 185, 232, 0.36)', backgroundColor: 'rgba(5, 23, 38, 0.96)', overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'stretch', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255, 212, 71, 0.24)', backgroundColor: 'rgba(16, 52, 78, 0.82)', paddingVertical: 12 },
  summaryStat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryValue: { fontSize: 17, fontFamily: fonts.display, color: '#FFFFFF' },
  summaryLabel: { marginTop: 1, fontSize: 9, fontFamily: fonts.body, color: '#91ACC0' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionLabel: { marginTop: spacing.md, fontSize: 10, fontFamily: fonts.heading, color: '#7ECDF0', letterSpacing: 1.2 },
  statsPanel: { marginTop: 6, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.035)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { minHeight: 29, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1, fontSize: 13, fontFamily: fonts.body, color: '#9CB4C8' },
  rowValue: { fontSize: 13, fontFamily: fonts.heading, color: '#F2F6F8' },
  warning: { marginTop: spacing.sm, borderRadius: radii.sm, padding: spacing.sm, fontSize: 12, lineHeight: 17, fontFamily: fonts.body, color: '#FFD0B0', backgroundColor: 'rgba(192, 80, 42, 0.2)' },
  rivalsBox: { marginTop: 2 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md, marginBottom: 7 },
  rankPosition: { marginTop: 1, fontSize: 12, fontFamily: fonts.body, color: '#9CB4C8' },
  rankMove: { maxWidth: '50%', fontSize: 12, fontFamily: fonts.heading, textAlign: 'right' },
  rivalRow: { minHeight: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, borderRadius: radii.sm },
  rivalRowYou: { borderWidth: 1, borderColor: 'rgba(255, 212, 71, 0.55)', backgroundColor: 'rgba(255, 212, 71, 0.13)' },
  rivalName: { flex: 1, fontSize: 13, fontFamily: fonts.body, color: '#9CB4C8' },
  rivalScore: { fontSize: 13, fontFamily: fonts.heading, color: '#9CB4C8' },
  rivalYouText: { color: '#FFFFFF' },
  rivalLine: { marginTop: 9, fontSize: 12, fontFamily: fonts.body, color: '#C8D6E1', fontStyle: 'italic' },
  nextGoal: { marginTop: 3, fontSize: 12, fontFamily: fonts.heading, color: '#79D7CE' },
  continueButton: { minHeight: 54, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm, borderRadius: 11, borderBottomWidth: 5, borderBottomColor: '#A87412', backgroundColor: '#FFD447', alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 17, fontFamily: fonts.display, color: '#082A48' },
})

export default AwardModal
