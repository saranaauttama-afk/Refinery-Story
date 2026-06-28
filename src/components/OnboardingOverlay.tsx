import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'

const STEPS = text.onboarding.steps

type Props = {
  onDismiss: () => void
}

export default function OnboardingOverlay({ onDismiss }: Props) {
  const { t } = useLang()
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onDismiss()
    }
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* Content */}
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{t(current.title)}</Text>
        <Text style={styles.body}>{t(current.body)}</Text>

        {/* Highlight pill */}
        <View style={styles.highlightPill}>
          <Text style={styles.highlightText}>👆 {t(current.highlight)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.skipBtn} onPress={onDismiss}>
            <Text style={styles.skipLabel}>{t(text.onboarding.skip)}</Text>
          </Pressable>
          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextLabel}>
              {step < STEPS.length - 1 ? t(text.onboarding.next) : t(text.onboarding.start)}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#1C2634',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 20,
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightPill: {
    backgroundColor: 'rgba(242,193,46,0.15)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(242,193,46,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  nextBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.gold,
  },
  nextLabel: { fontSize: 14, fontWeight: '900', color: colors.ink },
})
