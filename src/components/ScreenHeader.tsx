import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, fonts, spacing } from '../theme'

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
      ) : (
        <View style={styles.closeBtnSpacer} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#223247',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: '#0E1620',
    // top bevel highlight
    borderTopWidth: 2,
    borderTopColor: '#3A5170',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: '#7E241A',
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#fff', fontWeight: '900' },
  closeBtnSpacer: { width: 36 },
  title: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts.display,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  badge: {
    backgroundColor: colors.green,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4C7A43',
    borderBottomWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontFamily: fonts.heading, color: '#fff', letterSpacing: 0.5 },
})
