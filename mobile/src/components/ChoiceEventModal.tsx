import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { ChoiceEvent } from '../game/types'
import { colors, radii, spacing } from '../theme'

type ChoiceEventModalProps = {
  event: ChoiceEvent | null
  onChoose: (option: 'A' | 'B') => void
}

function ChoiceEventModal({ event, onChoose }: ChoiceEventModalProps) {
  if (!event) return null

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{event.title.en}</Text>
          <Text style={styles.description}>{event.description.en}</Text>
          <Pressable style={[styles.option, styles.optionA]} onPress={() => onChoose('A')}>
            <Text style={styles.optionLabel}>{event.optionA.en}</Text>
          </Pressable>
          <Pressable style={[styles.option, styles.optionB]} onPress={() => onChoose('B')}>
            <Text style={styles.optionLabel}>{event.optionB.en}</Text>
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
    borderColor: colors.ink,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  description: {
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  option: {
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.md,
  },
  optionA: {
    backgroundColor: colors.steelLight,
  },
  optionB: {
    backgroundColor: colors.green,
  },
  optionLabel: {
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
})

export default ChoiceEventModal
