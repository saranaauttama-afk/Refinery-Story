import type { ReactNode } from 'react'
import type { PressableProps, TextProps, ViewProps } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { fonts, pixelRadii, pixelSpacing, pixelUi } from '../../theme'

export function PixelText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />
}

export function PixelPanel({ style, children, ...props }: ViewProps & { children: ReactNode }) {
  return (
    <View {...props} style={[styles.panelShadow, style]}>
      <View style={styles.panel}>{children}</View>
    </View>
  )
}

type PixelButtonProps = PressableProps & {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
}

export function PixelButton({ label, variant = 'secondary', disabled, style, ...props }: PixelButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'danger' && styles.buttonDanger,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      <PixelText style={[styles.buttonLabel, variant === 'primary' && styles.buttonLabelPrimary]}>
        {label}
      </PixelText>
    </Pressable>
  )
}

export function PixelProgress({ value, max = 1 }: { value: number; max?: number }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  )
}

export function PixelTabs<T extends string>({
  items,
  selected,
  onSelect,
}: {
  items: readonly { key: T; label: string }[]
  selected: T
  onSelect: (key: T) => void
}) {
  return (
    <View style={styles.tabs}>
      {items.map((item) => {
        const active = item.key === selected
        return (
          <Pressable key={item.key} style={styles.tab} onPress={() => onSelect(item.key)}>
            <PixelText style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</PixelText>
            {active ? <View style={styles.tabRail} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  text: {
    color: pixelUi.text,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  panelShadow: {
    backgroundColor: pixelUi.shadow,
    paddingRight: 2,
    paddingBottom: 2,
    borderRadius: pixelRadii.panel,
  },
  panel: {
    backgroundColor: pixelUi.surface,
    borderWidth: 2,
    borderColor: pixelUi.border,
    borderRadius: pixelRadii.panel,
    padding: pixelSpacing.md,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: pixelSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: pixelUi.surfaceRaised,
    borderWidth: 2,
    borderColor: pixelUi.border,
    borderRadius: pixelRadii.control,
  },
  buttonPrimary: {
    backgroundColor: pixelUi.accent,
    borderColor: '#FFE77C',
  },
  buttonDanger: {
    backgroundColor: pixelUi.surface,
    borderColor: pixelUi.danger,
  },
  buttonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    backgroundColor: pixelUi.surfacePressed,
  },
  buttonDisabled: { opacity: 0.42 },
  buttonLabel: {
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  buttonLabelPrimary: { color: pixelUi.canvas },
  progressTrack: {
    height: 8,
    padding: 1,
    borderWidth: 1,
    borderColor: pixelUi.border,
    backgroundColor: pixelUi.canvas,
  },
  progressFill: { height: '100%', backgroundColor: pixelUi.accent },
  tabs: {
    minHeight: 44,
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: pixelUi.borderSoft,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { color: pixelUi.textMuted, fontFamily: fonts.heading },
  tabLabelActive: { color: pixelUi.accent },
  tabRail: {
    position: 'absolute',
    left: pixelSpacing.sm,
    right: pixelSpacing.sm,
    bottom: -2,
    height: 3,
    backgroundColor: pixelUi.accent,
  },
})
