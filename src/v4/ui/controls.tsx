import { Pressable, Text, StyleSheet, View, ScrollView } from 'react-native'
import { X } from 'lucide-react-native'
import { text, type LocalizedText } from '../i18n'
import { useFeedback } from './Feedback'
import { ui } from './theme'
export function Button({
  label,
  onPress,
  disabled = false,
  icon,
  selected = false,
  badge,
  color,
}: {
  label: LocalizedText
  onPress: () => void
  disabled?: boolean
  icon?: React.ReactNode
  selected?: boolean
  badge?: { label: string; color: string }
  color?: string
}) {
  const feedback = useFeedback()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text(label)}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => {
        feedback()
        onPress()
      }}
      style={({ pressed }) => [
        styles.button,
        color ? { backgroundColor: color } : null,
        selected && styles.selected,
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ translateY: 2 }], boxShadow: '0px 0px 0px transparent' },
      ]}
    >
      {icon}
      <Text style={styles.buttonText}>{text(label)}</Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      )}
    </Pressable>
  )
}
const headerColors: Record<string, string> = {
  Build: ui.build,
  Staff: ui.staff,
  Customers: ui.customers,
  Company: ui.company,
  'Buy land': ui.customers,
  'Recipe Book': ui.gold,
  Blend: ui.blend,
}
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: LocalizedText
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={[styles.headerMark, { backgroundColor: headerColors[title.en] ?? ui.gold }]} />
        <Text style={[styles.heading, { flex: 1, color: ui.paper }]}>{text(title)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Close', th: 'ปิด' })}
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: ui.gold }]}
        >
          <X size={20} color={ui.ink} strokeWidth={3} />
        </Pressable>
      </View>
      <ScrollView
        key={title.en}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        contentContainerStyle={{ padding: 12, paddingBottom: 24, gap: 6 }}
      >
        {children}
      </ScrollView>
    </View>
  )
}
export const styles = StyleSheet.create({
  button: {
    backgroundColor: ui.gold,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    gap: 3,
    boxShadow: '0px 2px 0px #14110F',
  },
  selected: { borderColor: ui.paper, backgroundColor: ui.gold },
  badge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 5,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: ui.ink },
  buttonText: {
    fontFamily: 'Kanit_600SemiBold',
    fontSize: 14,
    color: ui.ink,
    textAlign: 'center',
    flexShrink: 1,
  },
  text: { fontFamily: 'Kanit_400Regular', fontSize: 15, color: ui.ink, flexShrink: 1 },
  heading: { fontFamily: 'Kanit_600SemiBold', fontSize: 18, color: ui.ink, flexShrink: 1 },
  sheet: {
    position: 'absolute',
    bottom: 78,
    left: 8,
    right: 8,
    maxHeight: '72%',
    backgroundColor: ui.paper,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0px 4px 0px #14110F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ui.navy,
    padding: 8,
    paddingLeft: 12,
    borderBottomWidth: 2,
    borderColor: ui.ink,
  },
  headerMark: { width: 8, height: 26, borderWidth: 1, borderColor: ui.ink },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.paper,
  },
})
