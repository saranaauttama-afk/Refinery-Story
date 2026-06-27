import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radii, spacing } from '../theme'

// Shared dark header for the pushed gameplay tabs (Contracts / Supply /
// Recruit). Each used to hand-roll the same close-button + title + optional
// badge row with slightly different markup and a stray "X" vs "✕"; this keeps
// them visually identical and in one place. The Company hub has a richer
// bespoke header (name + grade + quick stats + sub-tabs) and stays custom.
export default function ScreenHeader({
  title,
  badge,
  onClose,
}: {
  title: string
  badge?: string
  onClose: () => void
}) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
        <Text style={styles.closeBtnText}>✕</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1C2634',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: '#fff' },
  badge: {
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
})
