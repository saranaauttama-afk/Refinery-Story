import { StyleSheet, Text, View } from 'react-native'
import type { GameState } from '../game/types'
import { fonts, spacing } from '../theme'
import Dialog, { DialogButton, DialogPanel } from './Dialog'
import { formatCompactNumber } from '../game/utils/gameCalculations'

type LegendCelebrationModalProps = {
  visible: boolean
  game: GameState | null
  onDismiss: () => void
}

// The true endgame climax (Roadmap feature 5): shown once every endgame goal
// is complete and game.legendAchieved flips on. Distinct from the earlier
// "prototype complete" win -- this is the full-clear "Industry Legend" moment.
export default function LegendCelebrationModal({ visible, game, onDismiss }: LegendCelebrationModalProps) {
  return (
    <Dialog
      visible={visible && !!game}
      dismissOnBackdrop={false}
      footer={<DialogButton label="A Legend's Work Is Never Done" variant="gold" onPress={onDismiss} />}
    >
      {game ? (
        <View style={styles.center}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>Industry Legend</Text>
          <Text style={styles.subtitle}>
            {game.refineryName} has completed every legacy goal. Your name is etched into the
            industry's history.
          </Text>

          <DialogPanel style={styles.stats}>
            <Text style={styles.statRow}>🏭 Refinery Level {game.refineryLevel}</Text>
            <Text style={styles.statRow}>⭐ Reputation {formatCompactNumber(game.reputation)}</Text>
            <Text style={styles.statRow}>💰 ${formatCompactNumber(game.money)} on hand</Text>
            <Text style={styles.statRow}>⛽ {formatCompactNumber(game.totalGasolineProduced)} lifetime gasoline</Text>
          </DialogPanel>
        </View>
      ) : null}
    </Dialog>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: spacing.xs },
  title: {
    fontSize: 24,
    fontFamily: fonts.display,
    color: '#F7D774',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  stats: { alignSelf: 'stretch', marginBottom: spacing.md },
  statRow: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: '#EAF1F8',
    marginBottom: 3,
  },
})
