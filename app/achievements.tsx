import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang } from '../src/hooks/SettingsContext'
import ArtSlot from '../src/components/ArtSlot'
import ProgressBar from '../src/components/ProgressBar'
import { colors, radii, spacing } from '../src/theme'
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t(as.back)}</Text>
        </Pressable>
        <Text style={styles.title}>{t(as.title)}</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <ArtSlot id="achievements_hero" width="100%" height={72} spec="1080×240" caption="Trophy shelf / podium banner" />
      </View>
      <Text style={styles.summary}>
        {t(as.completed(completedCount, milestones.length))}
      </Text>

      {game.prototypeCompleted && (
        <View style={styles.winBanner}>
          <Text style={styles.winBannerText}>{t(as.prototypeComplete)}</Text>
        </View>
      )}

      {/* Endgame spine: Industry Legend goal ladder */}
      <View style={[styles.comboCard, { borderColor: colors.gold }]}>
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

      <ScrollView contentContainerStyle={styles.list}>
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
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  back: {
    fontSize: 15,
    color: colors.blue,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  summary: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  winBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radii.md,
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.teal,
    padding: spacing.sm,
  },
  comboTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },
  comboName: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: {
    marginTop: 4,
  },
  legendName: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  legendNameDone: {
    color: colors.ink,
  },
  legendDesc: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '400',
  },
  legendProgress: {
    marginTop: 3,
  },
  comboHint: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.sm,
  },
  cardCompleted: {
    borderColor: colors.green,
  },
  cardLocked: {
    borderColor: colors.creamBorder,
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
    color: colors.inkMuted,
    fontSize: 14,
  },
  cardNameCompleted: {
    color: colors.ink,
  },
  cardRequirement: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
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
