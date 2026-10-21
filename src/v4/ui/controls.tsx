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
}
const headerIcons: Record<string, React.ReactNode> = {
  Build: <GameIcon name="build" size={32} />,
  Blend: <GameIcon name="blend" size={32} />,
  Staff: <GameIcon name="staff" size={32} />,
  Customers: <GameIcon name="customers" size={32} />,
  Company: <GameIcon name="company" size={32} />,
  'Buy land': <Map size={23} color={ui.ink} />,
  'Recipe Book': <BookOpen size={23} color={ui.ink} />,
}
const headerCaptions: Record<string, LocalizedText> = {
  Build: { en: 'MAKE ROOM FOR YOUR NEXT IDEA', th: 'ต่อเติมโรงกลั่นในแบบของคุณ' },
  Blend: { en: 'FIND YOUR SIGNATURE FORMULA', th: 'ค้นหาสูตรผสมประจำโรงกลั่น' },
  Staff: { en: 'A LITTLE TEAM. BIG POSSIBILITIES.', th: 'ทีมเล็ก ๆ ที่เติบโตไปด้วยกัน' },
  Customers: { en: 'FROM YOUR YARD TO THE WORLD', th: 'ส่งต่อผลิตภัณฑ์จากลานของเรา' },
  Company: { en: 'WATCH YOUR LITTLE WORLD GROW', th: 'ดูโรงกลั่นจิ๋วค่อย ๆ เติบโต' },
  'Buy land': { en: 'SPACE FOR WHAT COMES NEXT', th: 'พื้นที่สำหรับก้าวต่อไป' },
  'Recipe Book': { en: 'GOOD NEIGHBOURS. GREAT IDEAS.', th: 'ไอเดียดี ๆ จากเพื่อนบ้านบนลาน' },
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
      <View style={{ height: 4, backgroundColor: headerColors[title.en] ?? ui.gold }} />
      <View style={[styles.header, low && { minHeight: 70 }]}>
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
          {headerIcons[title.en] ?? <Building2 size={23} color={ui.ink} />}
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[styles.heading, { color: ui.paper, fontSize: 22 }]}>{text(title)}</Text>
          {!low && headerCaptions[title.en] && (
            <Text style={{ fontFamily: 'Kanit_400Regular', fontSize: 12, color: '#DAE4DF' }}>
              {text(headerCaptions[title.en])}
            </Text>
          )}
        </View>
        {help && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text({ en: 'How it works', th: 'วิธีเล่น' })}
            accessibilityState={{ expanded: showHelp }}
            aria-expanded={showHelp}
            onPress={() => setShowHelp(v => !v)}
            style={[styles.close, showHelp && { backgroundColor: ui.gold }]}
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
          contentContainerStyle={{ padding: 12, paddingBottom: 24, gap: 10 }}
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
    gap: 10,
    backgroundColor: ui.navy,
    minHeight: 88,
    padding: 10,
    paddingLeft: 12,
    borderBottomWidth: 2,
    borderColor: ui.ink,
  },
  headerMark: {
    width: 46,
    height: 46,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 0px #14110F',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: ui.inset,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B7B9AA',
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    minWidth: 0,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  tabText: { fontSize: 14, textAlign: 'center' },
  tabLine: { position: 'absolute', bottom: 0, height: 3, left: 12, right: 12 },
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
