import { StyleSheet, Text, View } from 'react-native'
import type { GameState } from '../game/types'
import { colors, fonts, spacing } from '../theme'
import Dialog, { DialogButton, DialogPanel } from './Dialog'
import { formatCompactNumber } from '../game/utils/gameCalculations'

type WinCelebrationModalProps = {
  visible: boolean
  game: GameState | null
  onDismiss: () => void
}

export default function WinCelebrationModal({ visible, game, onDismiss }: WinCelebrationModalProps) {
  return (
    <Dialog
      visible={visible && !!game}
      dismissOnBackdrop={false}
      footer={<DialogButton label="Keep Playing" variant="gold" onPress={onDismiss} />}
    >
      {game ? (
        <View style={styles.center}>
          <Text style={styles.emoji}>🎉🏆🎉</Text>
          <Text style={styles.title}>Prototype Complete!</Text>
          <Text style={styles.subtitle}>{game.refineryName} has hit every major goal.</Text>

          <DialogPanel style={styles.stats}>
            <Text style={styles.statRow}>🏭 Refinery Level {game.refineryLevel}</Text>
            <Text style={styles.statRow}>⭐ Reputation {formatCompactNumber(game.reputation)}</Text>
            <Text style={styles.statRow}>💰 ${formatCompactNumber(game.money)} on hand</Text>
            <Text style={styles.statRow}>⛽ {formatCompactNumber(game.totalGasolineProduced)} gasoline produced (lifetime)</Text>
          </DialogPanel>

          <Text style={styles.note}>
            This isn't the end — keep building, researching, and chasing the rest of the
            Achievements list.
          </Text>
        </View>
      ) : null}
    </Dialog>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  emoji: { fontSize: 32, marginBottom: spacing.xs },
  title: {
    fontSize: 22,
    fontFamily: fonts.display,
    color: '#F2F6FB',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  stats: { alignSelf: 'stretch', marginBottom: spacing.md },
  statRow: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: '#EAF1F8',
    marginBottom: 3,
  },
  note: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
})
