import { Pressable, Text, StyleSheet, View, ScrollView } from 'react-native'
import { text, type LocalizedText } from '../i18n'
import { useFeedback } from './Feedback'
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
        pressed && { backgroundColor: '#F08A24' },
      ]}
    >
      {icon}
      <Text style={styles.text}>{text(label)}</Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      )}
    </Pressable>
  )
}
const headerColors: Record<string, string> = {
  Build: '#F08A24',
  Staff: '#3D8FE0',
  Customers: '#2FB38E',
  Company: '#B184E3',
  'Buy land': '#8ED9C1',
  'Recipe Book': '#F2C230',
  Blend: '#E2483D',
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
      <View style={[styles.header, { backgroundColor: headerColors[title.en] ?? '#F2C230' }]}>
        <Text style={styles.heading}>{text(title)}</Text>
        <Button label={{ en: 'Close', th: 'ปิด' }} onPress={onClose} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>
    </View>
  )
}
export const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F2C230',
    padding: 10,
    borderWidth: 1,
    borderColor: '#14110F',
    borderRadius: 6,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selected: { backgroundColor: '#FFF6E3', borderWidth: 3 },
  badge: {
    position: 'absolute',
    right: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: { fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: '#14110F' },
  text: { fontFamily: 'Kanit_400Regular', fontSize: 16, color: '#14110F' },
  heading: { fontFamily: 'Kanit_600SemiBold', fontSize: 20, color: '#14110F' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '65%',
    padding: 12,
    backgroundColor: '#FFF6E3',
    borderWidth: 2,
    borderRadius: 6,
    boxShadow: '2px 2px 0px #14110F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: -10,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
})
