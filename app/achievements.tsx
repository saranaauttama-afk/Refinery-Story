import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang } from '../src/hooks/SettingsContext'
import ProgressBar from '../src/components/ProgressBar'
import ScreenHeader from '../src/components/ScreenHeader'
import { colors, fonts, spacing, modernUi, FLOATING_TAB_BAR_CLEARANCE } from '../src/theme'
import { text } from '../src/game/translations'
import { HIDDEN_COMBOS } from '../src/game/data/hiddenCombos'
import { ENDGAME_GOALS } from '../src/game/data/endgameGoals'
import type { ActiveMilestone } from '../src/game/types'

function MilestoneRow({ milestone }: { milestone: ActiveMilestone }) {
  const { t } = useLang()
  return (
    <View style={[styles.card, milestone.isCompleted ? styles.cardCompleted : styles.cardLocked]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{milestone.isCompleted ? '🏆' : '🔒'}</Text>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.cardName, milestone.isCompleted && styles.cardNameCompleted]}>
            {t(milestone.name)}
          </Text>
          <Text style={styles.cardRequirement}>{t(milestone.requirement)}</Text>
        </View>
        <Text style={[styles.cardReward, milestone.isCompleted && styles.cardRewardCompleted]}>
          {milestone.reward}
        </Text>
      </View>
      {!milestone.isCompleted && milestone.progress && (
        <View style={styles.progressWrap}>
          <ProgressBar current={milestone.progress.current} target={milestone.progress.target} />
          <Text style={styles.progressLabel}>
            {milestone.progress.current.toLocaleString()} / {milestone.progress.target.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function AchievementsScreen() {
  const router = useRouter()
  const { loaded, game, derived } = useGame()
  const { t } = useLang()
  const as = text.achievementsScreen

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const milestones = derived.activeMilestones
  const completedCount = milestones.filter((m) => m.isCompleted).length
  const discoveredCombos = HIDDEN_COMBOS.filter((combo) => game.discoveredCombos.includes(combo.key))

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t(as.title)} badge={`${completedCount}/${milestones.length}`} onClose={() => router.back()} />
      <View style={styles.hero}>
        <View style={styles.trophy}><Text style={styles.trophyText}>★</Text></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>COMPANY RECORDS</Text>
          <Text style={styles.summary}>{t(as.completed(completedCount, milestones.length))}</Text>
          <View style={styles.summaryTrack}><View style={[styles.summaryFill, { width: `${Math.round((completedCount / Math.max(1, milestones.length)) * 100)}%` as any }]} /></View>
        </View>
      </View>

      {game.prototypeCompleted && (
        <View style={styles.winBanner}>
          <Text style={styles.winBannerText}>{t(as.prototypeComplete)}</Text>
        </View>
      )}

      {/* Endgame spine: Industry Legend goal ladder */}
      <View style={[styles.comboCard, styles.legendCard]}>
        <Text style={styles.comboTitle}>
          {game.legendAchieved ? t(as.legendComplete) :
            t(as.endgameProgress(ENDGAME_GOALS.filter((gl) => gl.isComplete(game)).length, ENDGAME_GOALS.length))}
        </Text>
        {ENDGAME_GOALS.map((goal) => {
          const done = goal.isComplete(game)
          const p = goal.progress(game)
          return (
            <View key={goal.key} style={styles.legendRow}>
              <Text style={[styles.legendName, done && styles.legendNameDone]} numberOfLines={1}>
                {done ? '✅' : '⬜'} {t(goal.name)}
                <Text style={styles.legendDesc}>  {t(goal.description)}</Text>
              </Text>
              {!done && (
                <View style={styles.legendProgress}>
                  <ProgressBar current={p.current} target={p.target} />
                </View>
              )}
            </View>
          )
        })}
      </View>

      <View style={styles.comboCard}>
        <Text style={styles.comboTitle}>
          {t(as.hiddenCombos(discoveredCombos.length, HIDDEN_COMBOS.length))}
        </Text>
        {discoveredCombos.length > 0 ? (
          discoveredCombos.map((combo) => (
            <Text key={combo.key} style={styles.comboName}>• {t(combo.name)}</Text>
          ))
        ) : (
          <Text style={styles.comboHint}>
            {t(as.comboHint)}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {milestones.map((milestone) => (
          <MilestoneRow key={milestone.key} milestone={milestone} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: modernUi.canvas,
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, margin: spacing.md, marginBottom: spacing.sm, backgroundColor: '#0B2D4B', borderWidth: 2, borderColor: '#176797', borderBottomWidth: 5, borderBottomColor: '#04111C', borderRadius: 12, padding: spacing.md },
  trophy: { width: 66, height: 66, borderRadius: 10, backgroundColor: '#F7D44B', borderWidth: 2, borderColor: '#FFE67D', borderBottomWidth: 5, borderBottomColor: '#A87412', alignItems: 'center', justifyContent: 'center' },
  trophyText: { fontSize: 38, color: '#0A2943' },
  heroCopy: { flex: 1, gap: 4 },
  heroEyebrow: { fontSize: 9, fontFamily: fonts.heading, color: '#7ECDF0', letterSpacing: 1.8 },
  summary: {
    color: '#F4F7F9',
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  summaryTrack: { height: 7, backgroundColor: '#061B2C', borderWidth: 1, borderColor: '#315D7B', overflow: 'hidden' },
  summaryFill: { height: '100%', backgroundColor: '#70E985' },
  winBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.sm,
  },
  winBannerText: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    textAlign: 'center',
  },
  comboCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#102B45',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#285A7D',
    borderBottomWidth: 5,
    borderBottomColor: '#061522',
    padding: spacing.sm,
  },
  comboTitle: {
    fontWeight: '800',
    color: '#F2F6F8',
    fontFamily: fonts.heading,
    fontSize: 13,
  },
  comboName: {
    color: '#D7E5F0',
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: {
    marginTop: 4,
  },
  legendName: {
    color: '#9CB4C8',
    fontSize: 12,
    fontWeight: '700',
  },
  legendNameDone: {
    color: '#70E985',
  },
  legendDesc: {
    color: '#8FA4B1',
    fontSize: 11,
    fontWeight: '400',
  },
  legendProgress: {
    marginTop: 3,
  },
  comboHint: {
    color: '#8FA4B1',
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#102B45',
    borderRadius: 10,
    borderWidth: 2,
    padding: spacing.sm,
  },
  cardCompleted: {
    borderColor: '#4EAE6B',
    borderBottomWidth: 5,
    borderBottomColor: '#174A2B',
  },
  cardLocked: {
    borderColor: '#285A7D',
    borderBottomWidth: 5,
    borderBottomColor: '#061522',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardName: {
    fontWeight: '800',
    color: '#9CB4C8',
    fontSize: 14,
  },
  cardNameCompleted: {
    color: '#F2F6F8',
  },
  cardRequirement: {
    color: '#8FA4B1',
    fontSize: 12,
    marginTop: 2,
  },
  legendCard: { borderColor: '#D7AD2C', borderBottomColor: '#674B09' },
  cardReward: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.inkMuted,
  },
  cardRewardCompleted: {
    color: colors.greenDark,
  },
  progressWrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '700',
  },
})
