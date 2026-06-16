import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { GameState } from '../game/types'
import { colors, radii, spacing } from '../theme'

type WinCelebrationModalProps = {
  visible: boolean
  game: GameState | null
  onDismiss: () => void
}

export default function WinCelebrationModal({ visible, game, onDismiss }: WinCelebrationModalProps) {
  if (!visible || !game) return null

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉🏆🎉</Text>
          <Text style={styles.title}>Prototype Complete!</Text>
          <Text style={styles.subtitle}>{game.refineryName} has hit every major goal.</Text>

          <View style={styles.statsBox}>
            <Text style={styles.statRow}>🏭 Refinery Level {game.refineryLevel}</Text>
            <Text style={styles.statRow}>⭐ Reputation {game.reputation}</Text>
            <Text style={styles.statRow}>💰 ${Math.floor(game.money).toLocaleString()} on hand</Text>
            <Text style={styles.statRow}>⛽ {game.totalGasolineProduced.toLocaleString()} gasoline produced (lifetime)</Text>
          </View>

          <Text style={styles.note}>
            This isn't the end -- keep building, researching, and chasing the rest of the
            Achievements list.
          </Text>

          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissLabel}>Keep Playing</Text>
          </Pressable>
        </View>
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
    borderColor: colors.gold,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  statsBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  statRow: {
    fontSize: 13,
    color: colors.ink,
    marginBottom: 2,
  },
  note: {
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
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
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15,
  },
})
