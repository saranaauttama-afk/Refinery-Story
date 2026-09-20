import { Pressable, StyleSheet, Text, View } from 'react-native'

import { fonts, modernUi, spacing } from '../theme'

// Shared chunky "game panel" header for the pushed gameplay tabs (Contracts /
// Supply / Recruit). Beveled metal bar, a red close button, a bold display
// title, and an optional green status badge — reads as a console game screen,
// not a web app. The Company hub keeps its bespoke header.
export default function ScreenHeader({
  title,
  badge,
  onClose,
}: {
  title: string
  badge?: string
  onClose?: () => void
}) {
  return (
    <View style={styles.header}>
      {onClose ? (
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
          <Text style={styles.closeBtnText}>‹</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        onClose ? <View style={styles.closeBtnSpacer} /> : null
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: modernUi.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: modernUi.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: modernUi.surfaceRaised,
    borderWidth: 1,
    borderColor: modernUi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 27, lineHeight: 29, color: modernUi.text, fontWeight: '600' },
  closeBtnSpacer: { width: 36 },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.display,
    color: '#fff',
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: modernUi.accentSoft,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: modernUi.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontFamily: fonts.heading, color: modernUi.accent, letterSpacing: 0.2 },
})
