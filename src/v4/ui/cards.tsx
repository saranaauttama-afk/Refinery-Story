import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { styles as base } from './controls'
import { ui } from './theme'
import { productAccent } from '../render/palette'

// Small building blocks shared by the sheets: card, chip, bar, small button.

export function Card({
  children,
  dashed = false,
  tone,
}: {
  children: ReactNode
  dashed?: boolean
  tone?: 'warn'
}) {
  return (
    <View
      style={[
        styles.card,
        dashed && { borderStyle: 'dashed' },
        tone === 'warn' && { backgroundColor: '#FFF1EE', borderColor: '#B42318' },
      ]}
    >
      {children}
    </View>
  )
}

export function Section({ children }: { children: ReactNode }) {
  return (
    <Text
      style={[
        base.heading,
        {
          fontSize: 16,
          marginTop: 10,
          marginBottom: 3,
          borderLeftWidth: 4,
          borderLeftColor: ui.gold,
          paddingLeft: 8,
        },
      ]}
    >
      {children}
    </Text>
  )
}

export function Row({ children, gap = 8 }: { children: ReactNode; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, gap }}>{children}</View>
  )
}

export function Chip({ label, color = '#FFF6E3' }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  )
}

export const ProductChip = ({ base: id, label }: { base: string; label: string }) => (
  <Chip label={label} color={productAccent[id] ?? '#D8D2C4'} />
)

const gradeColors: Record<string, string> = {
  SS: '#F5B37A',
  S: '#F7DC7A',
  A: '#8ED9C1',
  B: '#9CC9EA',
  C: '#D8D2C4',
}
export const GradeChip = ({ grade, suffix = '' }: { grade: string; suffix?: string }) => (
  <Chip label={`${grade}${suffix}`} color={gradeColors[grade] ?? '#D8D2C4'} />
)

export function Bar({
  value,
  color = '#2FB38E',
  height = 10,
}: {
  value: number
  color?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <View style={[styles.bar, { height }]}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
    </View>
  )
}

export function SmallButton({
  label,
  onPress,
  color = '#F2C230',
  disabled = false,
}: {
  label: string
  onPress: () => void
  color?: string
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.small,
        { backgroundColor: color },
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ translateY: 1 }] },
      ]}
    >
      <Text style={[base.text, { fontSize: 14, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  )
}

export const Muted = ({ children }: { children: ReactNode }) => (
  <Text style={[base.text, { fontSize: 13, lineHeight: 20, color: ui.muted }]}>{children}</Text>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: ui.surface,
    borderWidth: 2,
    borderColor: '#14110F',
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: ui.ink,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 1,
  },
  chipText: { fontFamily: 'Kanit_400Regular', fontSize: 13, color: '#14110F' },
  bar: {
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  small: {
    minHeight: 40,
    minWidth: 40,
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: ui.ink,
    borderWidth: 2,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    boxShadow: '0px 2px 0px #14110F',
  },
})
