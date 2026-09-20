import { useEffect } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { colors, fonts, radii, spacing } from '../theme'

// Shared clean dialog shell — one centered dark card used by every modal in the
// game so they read as one system: soft rounded corners, a hairline border, a
// deep translucent backdrop, and a gentle spring-in. Matches the dark chrome
// (HUD dock, side drawer, bottom nav) instead of the old cream cards that
// clashed with it. Compose with <DialogButton> for the action row and
// <DialogPanel> / <DialogRow> for grouped content.

type DialogProps = {
  visible: boolean
  onClose?: () => void
  title?: string
  subtitle?: string
  icon?: string
  /** Show the ✕ button in the header (needs onClose). */
  showClose?: boolean
  /** Tapping the dimmed backdrop closes the dialog (needs onClose). */
  dismissOnBackdrop?: boolean
  /** Wrap children in a ScrollView (for long content). */
  scroll?: boolean
  /** Fraction of screen height the card may grow to. Default 0.82. */
  maxHeightPct?: number
  /** Action row pinned under the body (usually <DialogButton>s). */
  footer?: React.ReactNode
  children?: React.ReactNode
}

export default function Dialog({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  showClose,
  dismissOnBackdrop = true,
  scroll,
  maxHeightPct = 0.82,
  footer,
  children,
}: DialogProps) {
  const prog = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      prog.value = withSpring(1, { damping: 16, stiffness: 200 })
    } else {
      prog.value = withTiming(0, { duration: 120 })
    }
  }, [visible, prog])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: prog.value }))
  const cardStyle = useAnimatedStyle(() => ({
    opacity: prog.value,
    transform: [{ scale: 0.92 + prog.value * 0.08 }],
  }))

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdrop ? onClose : undefined}
          />
        </Animated.View>

        <Animated.View style={[styles.card, { maxHeight: `${Math.round(maxHeightPct * 100)}%` }, cardStyle]}>
          {(title || showClose || icon) && (
            <View style={styles.header}>
              {icon ? (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconText}>{icon}</Text>
                </View>
              ) : null}
              <View style={styles.headerText}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              {showClose && onClose ? (
                <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {scroll ? (
            <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyScrollInner} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  )
}

// Filled action button for the dialog footer.
export function DialogButton({
  label,
  onPress,
  variant = 'secondary',
  disabled,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'gold' | 'danger'
  disabled?: boolean
}) {
  return (
    <Pressable
      style={[styles.btn, styles[`btn_${variant}`], disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.btnLabel, styles[`btnLabel_${variant}`], disabled && styles.btnLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  )
}

// Grouped inner panel (the nested "card within the dialog" look).
export function DialogPanel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.panel, style]}>{children}</View>
}

// One label/value line inside a DialogPanel.
export function DialogRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value !== undefined ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
  )
}

const CARD_BG = '#161D28'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    backgroundColor: 'rgba(6,9,14,0.66)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  headerText: { flex: 1 },
  title: {
    fontSize: 19,
    fontFamily: fonts.display,
    color: '#F2F6FB',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '900' },
  body: {},
  bodyScroll: { flexGrow: 0 },
  bodyScrollInner: { paddingBottom: 2 },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  // Buttons
  btn: {
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: colors.blue },
  btn_gold: { backgroundColor: colors.gold },
  btn_danger: { backgroundColor: 'rgba(192,57,43,0.22)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.6)' },
  btn_secondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnDisabled: { opacity: 0.4 },
  btnLabel: { fontSize: 15, fontFamily: fonts.heading, letterSpacing: 0.2 },
  btnLabel_primary: { color: '#fff' },
  btnLabel_gold: { color: '#241a02' },
  btnLabel_danger: { color: '#F3B4AC' },
  btnLabel_secondary: { color: '#E6EDF5' },
  btnLabelDisabled: {},

  // Inner panel + rows
  panel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.6)' },
  rowValue: { fontSize: 13, fontFamily: fonts.heading, color: '#EAF1F8' },
})
