import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import ScreenHeader from '../../../src/components/ScreenHeader'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t(rs.title)} onClose={() => router.back()} />

      <ScrollView contentContainerStyle={styles.list}>
        {/* Research */}
        <Text style={styles.sectionLabel}>{t(cs.researchHeader(Math.floor(game.researchPoints)))}</Text>
        {derived.activeResearchItems.map((item) => (
          <ListRow
            key={item.key}
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
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  branchLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: 2 },
})
