import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang, useSettingsContext } from '../src/hooks/SettingsContext'
import { colors, radii, spacing } from '../src/theme'
import { text } from '../src/game/translations'

function Row({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.creamBorder, true: colors.green }} />
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { settings, update } = useSettingsContext()
  const { resetGame } = useGame()
  const { t } = useLang()
  const ss = text.settingsScreen

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t(text.common.back)}</Text>
        </Pressable>
        <Text style={styles.title}>{t(ss.title)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Section title={t(ss.language)}>
          <View style={styles.langRow}>
            <Pressable
              style={[styles.langButton, settings.language === 'en' && styles.langButtonActive]}
              onPress={() => update('language', 'en')}
            >
              <Text
                style={[styles.langButtonLabel, settings.language === 'en' && styles.langButtonLabelActive]}
              >
                English
              </Text>
            </Pressable>
            <Pressable
              style={[styles.langButton, settings.language === 'th' && styles.langButtonActive]}
              onPress={() => update('language', 'th')}
            >
              <Text
                style={[styles.langButtonLabel, settings.language === 'th' && styles.langButtonLabelActive]}
              >
                ภาษาไทย
              </Text>
            </Pressable>
          </View>
          <Text style={styles.note}>{t(ss.languageNote)}</Text>
        </Section>

        <Section title={t(ss.audio)}>
          <Row
            label={t(ss.soundLabel)}
            description={t(ss.soundDesc)}
            value={settings.soundEnabled}
            onChange={(v) => update('soundEnabled', v)}
          />
          <Row
            label={t(ss.musicLabel)}
            description={t(ss.musicDesc)}
            value={settings.musicEnabled}
            onChange={(v) => update('musicEnabled', v)}
          />
          <Text style={styles.note}>{t(ss.audioNote)}</Text>
        </Section>

        <Section title={t(ss.store)}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/store')}>
            <Text style={styles.linkLabel}>
              {settings.adsRemoved ? t(ss.adsRemoved) : t(ss.removeAds)}
            </Text>
            <Text style={styles.linkChevron}>›</Text>
          </Pressable>
        </Section>

        <Section title={t(ss.saveData)}>
          <Pressable
            style={styles.dangerRow}
            onPress={() =>
              Alert.alert(t(ss.resetConfirmTitle), t(ss.resetConfirmBody), [
                { text: t(text.common.cancel), style: 'cancel' },
                {
                  text: t(text.common.reset),
                  style: 'destructive',
                  onPress: () => {
                    resetGame()
                    router.replace('/')
                  },
                },
              ])
            }
          >
            <Text style={styles.dangerLabel}>{t(ss.resetSave)}</Text>
          </Pressable>
        </Section>

        <Section title={t(ss.about)}>
          <Text style={styles.note}>Refinery Story · v0.1.0</Text>
          <Text style={styles.note}>{t(ss.aboutTagline)}</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  back: {
    fontSize: 15,
    color: colors.blue,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowLabel: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 14,
  },
  rowDescription: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  note: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  langButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.ink,
  },
  langButtonLabel: {
    fontWeight: '700',
    color: colors.inkMuted,
  },
  langButtonLabelActive: {
    color: colors.ink,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  linkLabel: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 14,
  },
  linkChevron: {
    color: colors.inkMuted,
    fontSize: 18,
  },
  dangerRow: {
    backgroundColor: colors.red,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerLabel: {
    color: colors.white,
    fontWeight: '800',
  },
})
