import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { GameState } from '../game/types'
import { colors, fonts, radii, spacing } from '../theme'

type LegendCelebrationModalProps = {
  visible: boolean
  game: GameState | null
  onDismiss: () => void
}

// The true endgame climax (Roadmap feature 5): shown once every endgame goal
// is complete and game.legendAchieved flips on. Distinct from the earlier
// "prototype complete" win -- this is the full-clear "Industry Legend" moment.
export default function LegendCelebrationModal({ visible, game, onDismiss }: LegendCelebrationModalProps) {
  if (!visible || !game) return null

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>Industry Legend</Text>
          <Text style={styles.subtitle}>
            {game.refineryName} has completed every legacy goal. Your name is etched into the
            industry's history.
          </Text>

          <View style={styles.statsBox}>
            <Text style={styles.statRow}>🏭 Refinery Level {game.refineryLevel}</Text>
            <Text style={styles.statRow}>⭐ Reputation {Math.floor(game.reputation).toLocaleString()}</Text>
            <Text style={styles.statRow}>💰 ${Math.floor(game.money).toLocaleString()} on hand</Text>
            <Text style={styles.statRow}>⛽ {game.totalGasolineProduced.toLocaleString()} lifetime gasoline</Text>
          </View>

          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissLabel}>A Legend's Work Is Never Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: colors.gold,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: spacing.xs },
  title: {
    fontSize: 24,
    fontFamily: fonts.display,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  statsBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statRow: {
    fontSize: 13,
    color: colors.ink,
    marginBottom: 2,
  },
  dismissButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dismissLabel: {
    fontFamily: fonts.heading,
    color: colors.ink,
    fontSize: 14,
  },
})
