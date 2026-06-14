import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type ListRowProps = {
  title: string
  subtitle?: string
  actionLabel: string
  disabled?: boolean
  done?: boolean
  onPress: () => void
}

function ListRow({ title, subtitle, actionLabel, disabled, done, onPress }: ListRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable
        disabled={disabled || done}
        onPress={onPress}
        style={[
          styles.button,
          done ? styles.buttonDone : disabled ? styles.buttonDisabled : styles.buttonActive,
        ]}
      >
        <Text style={[styles.buttonLabel, done && styles.buttonLabelDone]}>
          {done ? 'Done' : actionLabel}
        </Text>
      </Pressable>
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
  button: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    minWidth: 72,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.green,
    borderColor: colors.ink,
  },
  buttonDisabled: {
    backgroundColor: colors.white,
    borderColor: colors.creamBorder,
  },
  buttonDone: {
    backgroundColor: colors.white,
    borderColor: colors.creamBorder,
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.ink,
  },
  buttonLabelDone: {
    color: colors.inkMuted,
  },
})

export default ListRow
