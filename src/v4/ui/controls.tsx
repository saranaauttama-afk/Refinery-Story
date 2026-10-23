import { headerArt } from './art'
import { useState } from 'react'
import { Pressable, Text, StyleSheet, View, ScrollView, Image } from 'react-native'
import { X, Building2, Map, BookOpen } from 'lucide-react-native'
import { text, type LocalizedText } from '../i18n'
import { useFeedback } from './Feedback'
import { ui, type } from './theme'
import { GameIcon } from './GameIcon'
import { Enamel } from './GameChrome'
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
      <Enamel />
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
  Products: ui.blend,
  Lab: '#9C5BD6',
}
const headerIcons: Record<string, React.ReactNode> = {
  Build: <GameIcon name="build" size={24} />,
  Blend: <GameIcon name="blend" size={24} />,
  Products: <GameIcon name="blend" size={24} />,
  Lab: <GameIcon name="lab" size={24} />,
  Staff: <GameIcon name="staff" size={24} />,
  Customers: <GameIcon name="customers" size={24} />,
  Company: <GameIcon name="company" size={24} />,
  'Buy land': <Map size={18} color={ui.ink} />,
  'Recipe Book': <BookOpen size={18} color={ui.ink} />,
}

/** Shared presentation for existing panel tabs; callers keep their own UI state. */
export function PanelTabs<T extends string>({
  options,
  value,
  onChange,
  color,
}: {
  options: { id: T; label: LocalizedText }[]
  value: T
  onChange: (id: T) => void
  color: string
}) {
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {options.map(option => (
        <Pressable
          key={option.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === option.id }}
          aria-selected={value === option.id}
          onPress={() => onChange(option.id)}
          style={({ pressed }) => [
            styles.tab,
            { backgroundColor: value === option.id ? ui.navy : pressed ? ui.inset : 'transparent' },
          ]}
        >
          <Text style={[type.body, styles.tabText, value === option.id && { color: ui.paper }]}>
            {text(option.label)}
          </Text>
          {value === option.id && <View style={[styles.tabLine, { backgroundColor: color }]} />}
        </Pressable>
      ))}
    </View>
  )
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
      <View style={{ height: 3, backgroundColor: headerColors[title.en] ?? ui.gold }} />
      <View style={styles.header}>
        <Enamel dark />
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
                backgroundColor: '#18313EBA',
              }}
            />
          </>
        )}
        <View style={[styles.headerMark, { backgroundColor: headerColors[title.en] ?? ui.gold }]}>
          {headerIcons[title.en] ?? <Building2 size={18} color={ui.ink} />}
        </View>
        <Text
          style={[styles.heading, { flex: 1, color: ui.paper, fontSize: 18 }]}
          numberOfLines={1}
        >
          {text(title)}
        </Text>
        {help && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text({ en: 'How it works', th: 'วิธีเล่น' })}
            accessibilityState={{ expanded: showHelp }}
            aria-expanded={showHelp}
            hitSlop={6}
            onPress={() => setShowHelp(v => !v)}
            style={[styles.close, showHelp && { backgroundColor: ui.gold }]}
          >
            <Text style={styles.heading}>?</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Close', th: 'ปิด' })}
          hitSlop={6}
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: ui.gold }]}
        >
          <X size={17} color={ui.ink} strokeWidth={3} />
        </Pressable>
      </View>
      {low ? (
        <View style={{ padding: 8, gap: 6 }}>{children}</View>
      ) : (
        <ScrollView
          key={title.en}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 10, paddingBottom: 20, gap: 8 }}
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
    backgroundColor: ui.build,
    minHeight: 48,
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
  selected: { borderColor: ui.ink, backgroundColor: ui.gold },
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
    bottom: ui.dockHeight,
    left: 0,
    right: 0,
    maxHeight: '62%',
    backgroundColor: ui.paper,
    borderTopWidth: 3,
    borderColor: ui.ink,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px -4px 0px #263D4926',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ui.navy,
    minHeight: 46,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderColor: ui.ink,
  },
  headerMark: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 0px #14110F',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: ui.inset,
    padding: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#B7B9AA',
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 34,
    minWidth: 0,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  tabText: { fontSize: 14, textAlign: 'center' },
  tabLine: { position: 'absolute', bottom: 0, height: 3, left: 12, right: 12 },
  close: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 5,
    backgroundColor: ui.paper,
  },
})
