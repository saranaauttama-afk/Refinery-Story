import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type SellProductRowProps = {
  title: string
  subtitle: string
  inventory: number
  price: number
  // Hidden entirely if the plant that produces this product isn't built
  // yet (matches the web ProductPanel's "no plants" message, but as a
  // single subtitle line instead of a separate empty state).
  noPlantsMessage?: string
  onSell: (amount: number) => void
}

// Compact sell row: title/subtitle on the left, three sell buttons (1 /
// 10 / All) on the right. All three disable together when inventory is 0
// or price is 0 (e.g. a demand multiplier has temporarily zeroed it out).
function SellProductRow({ title, subtitle, inventory, price, noPlantsMessage, onSell }: SellProductRowProps) {
  const canSell = inventory > 0 && price > 0

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {noPlantsMessage && <Text style={styles.hint}>{noPlantsMessage}</Text>}
      </View>
      <View style={styles.buttons}>
        <Pressable
          disabled={!canSell}
          onPress={() => onSell(1)}
          style={[styles.button, canSell ? styles.buttonActive : styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>1</Text>
        </Pressable>
        <Pressable
          disabled={!canSell}
          onPress={() => onSell(10)}
          style={[styles.button, canSell ? styles.buttonActive : styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>10</Text>
        </Pressable>
        <Pressable
          disabled={!canSell}
          onPress={() => onSell(inventory)}
          style={[styles.button, styles.buttonWide, canSell ? styles.buttonActive : styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>All</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
    gap: spacing.md,
  },
  text: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 15,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  hint: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  buttonWide: {
    minWidth: 48,
  },
  buttonActive: {
    backgroundColor: colors.green,
    borderColor: colors.ink,
  },
  buttonDisabled: {
    backgroundColor: colors.white,
    borderColor: colors.creamBorder,
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.ink,
  },
})

export default SellProductRow
