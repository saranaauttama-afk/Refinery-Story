import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import ScreenHeader from '../../../src/components/ScreenHeader'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, fonts, spacing, FLOATING_TAB_BAR_CLEARANCE, modernUi } from '../../../src/theme'
import { text } from '../../../src/game/translations'
import { PERKS } from '../../../src/game/data/perks'

// R&D tab — Research + Perks, pulled out of the Company hub's Grow sub-tab so
// the most-visited progression screen is one tap from anywhere. Reuses the
// companyScreen translation keys for the rows themselves (they were already
// bilingual) plus a couple of researchScreen strings for the header/sections.
export default function ResearchScreen() {
  const router = useRouter()
  const { game, loaded, derived, unlockResearch, installPerk } = useGame()
  const { t } = useLang()
  const cs = text.companyScreen
  const rs = text.researchScreen

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const unlockedResearch = derived.activeResearchItems.filter((item) => item.isUnlocked).length
  const unlockedPerks = PERKS.filter((perk) => game.unlockedPerks.includes(perk.key)).length
  const progress = (unlockedResearch + unlockedPerks) / Math.max(1, derived.activeResearchItems.length + PERKS.length)

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t(rs.title)} onClose={() => router.back()} />

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.labStatus}>
          <View style={styles.labIcon}><Text style={styles.labIconText}>⚗</Text></View>
          <View style={styles.labCopy}>
            <Text style={styles.labEyebrow}>R&D PROGRAM</Text>
            <Text style={styles.labTitle}>{unlockedResearch + unlockedPerks} TECHNOLOGIES ACTIVE</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} /></View>
          </View>
          <View style={styles.rpBadge}><Text style={styles.rpValue}>{Math.floor(game.researchPoints)}</Text><Text style={styles.rpLabel}>RP</Text></View>
        </View>
        {/* Research */}
        <Text style={styles.sectionLabel}>{t(cs.researchHeader(Math.floor(game.researchPoints)))}</Text>
        {derived.activeResearchItems.map((item) => (
          <ListRow
            key={item.key}
            dark
            title={t(item.name)}
            subtitle={item.isUnlocked ? t(item.description) : item.prerequisiteName ? t(cs.requiresResearch(t(item.prerequisiteName), item.cost)) : t(cs.descWithRp(t(item.description), item.cost))}
            actionLabel={t(cs.unlock)}
            disabled={!item.isVisible || game.researchPoints < item.cost}
            done={item.isUnlocked}
            onPress={() => unlockResearch(item)}
          />
        ))}

        {/* Perks */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>{t(cs.perksHeader(game.upgradePoints))}</Text>
        {(['efficiency', 'market', 'safety'] as const).map((branch) => (
          <View key={branch}>
            <Text style={styles.branchLabel}>{t(cs.branches[branch])}</Text>
            {PERKS.filter((p) => p.branch === branch).map((perk) => {
              const unlocked = game.unlockedPerks.includes(perk.key)
              const prereqMet = !perk.prerequisite || game.unlockedPerks.includes(perk.prerequisite)
              return (
                <ListRow
                  key={perk.key}
                  dark
                  title={t(cs.perkTitle(t(perk.name), perk.tier))}
                  subtitle={unlocked ? t(perk.description) : !prereqMet ? t(cs.requiresPrevTier) : t(cs.descWithPts(t(perk.description), perk.cost))}
                  actionLabel={t(cs.unlock)}
                  disabled={!prereqMet || game.upgradePoints < perk.cost}
                  done={unlocked}
                  onPress={() => installPerk(perk)}
                />
              )
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: modernUi.canvas },
  loadingScreen: { flex: 1, backgroundColor: '#111820', alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  labStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#0B2D4B', borderWidth: 2, borderColor: '#176797', borderBottomWidth: 5, borderBottomColor: '#04111C', borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  labIcon: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#123B5D', borderWidth: 2, borderColor: '#2A7DAA', alignItems: 'center', justifyContent: 'center' },
  labIconText: { fontSize: 28, color: '#74D9F0' },
  labCopy: { flex: 1, gap: 3 },
  labEyebrow: { fontSize: 8, fontFamily: fonts.heading, color: '#74D9F0', letterSpacing: 1.6 },
  labTitle: { fontSize: 12, fontFamily: fonts.heading, color: '#F2F6F8' },
  progressTrack: { height: 6, backgroundColor: '#061B2C', borderWidth: 1, borderColor: '#315D7B', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#70E985' },
  rpBadge: { minWidth: 50, alignItems: 'center', backgroundColor: '#071C2D', borderWidth: 1, borderColor: '#315D7B', paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7 },
  rpValue: { fontSize: 16, fontFamily: fonts.heading, color: '#74D9F0' },
  rpLabel: { fontSize: 8, fontFamily: fonts.heading, color: '#8FA4B1' },
  sectionLabel: { fontSize: 11, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  branchLabel: { fontSize: 11, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: 2 },
})
