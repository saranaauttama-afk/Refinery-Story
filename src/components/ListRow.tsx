import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type ListRowProps = {
  title: string
  subtitle?: string
  actionLabel: string
  disabled?: boolean
  done?: boolean
  // Small pill rendered next to the title, e.g. "NEW".
  badge?: string
  // Render for a dark surface (e.g. inside the dark Build sheet) — the default
  // is the light/cream content screens that share this row.
  dark?: boolean
  onPress: () => void
}

function ListRow({ title, subtitle, actionLabel, disabled, done, badge, dark, onPress }: ListRowProps) {
  return (
    <View style={[styles.row, dark && styles.rowDark]}>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle ? <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{subtitle}</Text> : null}
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
  rowDark: { borderBottomColor: 'rgba(255,255,255,0.08)' },
  titleDark: { color: '#EAF1F8' },
  subtitleDark: { color: 'rgba(255,255,255,0.55)' },
  text: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeLabel: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
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
