import { headerArt } from './art'
import { useState } from 'react'
import { Pressable, Text, StyleSheet, View, ScrollView, Image } from 'react-native'
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
  help,
  low = false,
}: {
  title: LocalizedText
  onClose: () => void
  children: React.ReactNode
  /** Rules text shown only when the player taps "?". */
  help?: LocalizedText
  /** A short tray (Build) instead of the half-screen sheet. */
  low?: boolean
}) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <View style={[styles.sheet, low && { maxHeight: undefined }]}>
      <View style={styles.header}>
        {headerArt[title.en] && (
          <>
            <Image
              source={headerArt[title.en]}
              resizeMode="cover"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: '#14110F8C',
              }}
            />
          </>
        )}
        <View style={[styles.headerMark, { backgroundColor: headerColors[title.en] ?? ui.gold }]} />
        <Text style={[styles.heading, { flex: 1, color: ui.paper }]}>{text(title)}</Text>
        {help && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text({ en: 'How it works', th: 'วิธีเล่น' })}
            accessibilityState={{ expanded: showHelp }}
            onPress={() => setShowHelp(v => !v)}
            style={[styles.close, { borderRadius: 20 }, showHelp && { backgroundColor: ui.gold }]}
          >
            <Text style={styles.heading}>?</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Close', th: 'ปิด' })}
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: ui.gold }]}
        >
          <X size={20} color={ui.ink} strokeWidth={3} />
        </Pressable>
      </View>
      {low ? (
        <View style={{ padding: 10, gap: 8 }}>{children}</View>
      ) : (
        <ScrollView
          key={title.en}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 8 }}
        >
          {help && showHelp && (
            <View
              style={{
                padding: 10,
                borderWidth: 2,
                borderColor: ui.ink,
                borderRadius: 6,
                backgroundColor: '#FFF1C9',
              }}
            >
              <Text style={[styles.text, { fontSize: 14 }]}>{text(help)}</Text>
            </View>
          )}
          {children}
        </ScrollView>
      )}
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
    bottom: 64,
    left: 0,
    right: 0,
    maxHeight: '58%',
    backgroundColor: ui.paper,
    borderTopWidth: 3,
    borderColor: ui.ink,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.paper,
  },
})
