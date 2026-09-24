import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useGame } from '../src/hooks/GameContext'
import { useLang, useSettingsContext } from '../src/hooks/SettingsContext'
import ScreenHeader from '../src/components/ScreenHeader'
import { colors, fonts, spacing, modernUi } from '../src/theme'
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
  const version = Constants.expoConfig?.version ?? '0.1.1'
  const buildLabel = Constants.expoConfig?.extra?.buildLabel as string | undefined

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t(ss.title)} onClose={() => router.back()} />

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
          <Pressable style={[styles.linkRow, styles.linkRowDisabled]} disabled>
            <Text style={styles.linkLabel}>
              {settings.adsRemoved ? t(ss.adsRemoved) : t(ss.removeAds)}
            </Text>
            <Text style={styles.laterBadge}>LATER</Text>
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
          <Text style={styles.note}>
            Refinery Story · v{version}{buildLabel ? ` · ${buildLabel}` : ''}
          </Text>
          <Text style={styles.note}>{t(ss.aboutTagline)}</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: modernUi.canvas,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: '#102B45',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#285A7D',
    borderBottomWidth: 5,
    borderBottomColor: '#061522',
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: '#F2F6F8',
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
    color: '#F2F6F8',
    fontSize: 14,
  },
  rowDescription: {
    color: '#8FA4B1',
    fontSize: 12,
    marginTop: 2,
  },
  note: {
    color: '#8FA4B1',
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
    borderColor: '#3B617E',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: '#071C2D',
  },
  langButtonActive: {
    backgroundColor: '#F7D44B',
    borderColor: '#A87412',
  },
  langButtonLabel: {
    fontWeight: '700',
    color: '#9CB4C8',
  },
  langButtonLabelActive: {
    color: '#0A2943',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  linkRowDisabled: { opacity: 0.55 },
  linkLabel: {
    fontWeight: '700',
    color: '#F2F6F8',
    fontSize: 14,
  },
  linkChevron: {
    color: '#8FA4B1',
    fontSize: 18,
  },
  laterBadge: { fontSize: 9, fontFamily: fonts.heading, color: '#FFD447', borderWidth: 1, borderColor: '#8F7628', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4 },
  dangerRow: {
    backgroundColor: colors.red,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF7A71',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dangerLabel: {
    color: colors.white,
    fontWeight: '800',
  },
})
