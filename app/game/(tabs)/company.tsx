import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import ArtSlot from '../../../src/components/ArtSlot'
import GameIcon from '../../../src/components/GameIcon'
import StaffSkillList from '../../../src/components/StaffSkillList'
import { SKILL_CHANNELS } from '../../../src/game/data/staffSkills'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { parseBilingualText, text } from '../../../src/game/translations'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { EXPANSION_BALANCE, PRESTIGE_BALANCE, STAFF_LEVEL_BALANCE, type PaidExpansionEntry } from '../../../src/game/data/balance'
import { WORKERS } from '../../../src/game/data/workers'
import { getStaffTrait } from '../../../src/game/data/staffTraits'
import { BUILDINGS } from '../../../src/game/data/buildings'
import {
  getCellAssignedToEmployee,
  getTrainingCost,
  getMaxHireCount,
  isNearRetirement,
  getEsgTier,
  getSeasonLabel,
  getRefineryTitle,
  getSpecialistPlantForWorker,
  getEmployeeSkills,
  getTeamSkillBonuses,
} from '../../../src/game/utils/gameCalculations'
import type { BuildingType, WorkerType, PrestigePerkKey } from '../../../src/game/types'
import { PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { PRESTIGE_PERKS, getAvailablePrestigePerks, getPrestigePerkConfig } from '../../../src/game/data/prestigePerks'

// Team/staff moved to its own Staff tab (app/game/(tabs)/staff.tsx).
type CompanyTab = 'grow' | 'settings'

// Specialist config
const SPECIALIST_TYPES: WorkerType[] = [
  ...PLANT_PRODUCTION.map((p) => p.specialistWorker).filter(
    (t): t is 'aviationSpecialist' | 'chemicalEngineer' => !!t,
  ),
  'polymerEngineer',
]
const SPECIALIST_BUILDING: Partial<Record<WorkerType, BuildingType>> = {
  ...Object.fromEntries(
    PLANT_PRODUCTION.filter((p) => p.specialistWorker).map((p) => [p.specialistWorker as WorkerType, p.buildingKey]),
  ),
  polymerEngineer: 'polymerPlant',
}

// XP bar
function XpBar({ current, max, level }: { current: number; max: number; level: number }) {
  const maxed = level >= STAFF_LEVEL_BALANCE.maxLevel
  const pct = maxed ? 1 : max > 0 ? Math.min(1, current / max) : 0
  return (
    <View style={xpStyles.wrap}>
      <View style={xpStyles.track}>
        <View style={[xpStyles.fill, { width: `${Math.round(pct * 100)}%` as any }, maxed && xpStyles.fillMax]} />
      </View>
      <Text style={xpStyles.label}>{maxed ? 'MAX' : `${current}/${max} XP`}</Text>
    </View>
  )
}
const xpStyles = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  track:   { flex: 1, height: 5, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden' },
  fill:    { height: '100%', backgroundColor: colors.blue, borderRadius: radii.pill },
  fillMax: { backgroundColor: colors.gold },
  label:   { fontSize: 9, fontWeight: '700', color: colors.inkMuted, minWidth: 52 },
})

// Stat row
function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, accent && statStyles.accent]}>{value}</Text>
    </View>
  )
}
const statStyles = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.creamBorder },
  label:  { fontSize: 12, color: colors.inkMuted, flex: 1 },
  value:  { fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'right', flexShrink: 1, marginLeft: spacing.sm },
  accent: { color: colors.green },
})

export default function CompanyScreen() {
  const router = useRouter()
  const { game, loaded, derived, trainEmployee, assignEmployeeToCell, unassignCell, expandGrid, renameRefinery, manualSave, resetGame, prestige } = useGame()
  const { t, lang } = useLang()
  const cs = text.companyScreen
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const [activeTab, setActiveTab] = useState<CompanyTab>('grow')
  const [pickerEmployeeId, setPickerEmployeeId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [perkPickerOpen, setPerkPickerOpen] = useState(false)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const cap = getMaxHireCount(game.refineryLevel)
  const refineryTitle = t(getRefineryTitle(game.refineryLevel))
  const esgTier = getEsgTier(game.esgScore)
  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const lastAward = game.awardHistory[0]
  const completedMilestones = game.completedMilestoneKeys.length
  const totalMilestones = derived.activeMilestones.length
  const unlockedResearch = derived.activeResearchItems.filter((i) => i.isUnlocked).length
  const totalResearch = derived.activeResearchItems.length
  const nextExpansion = EXPANSION_BALANCE[game.gridExpansionLevel + 1] as PaidExpansionEntry | undefined
  const currentSize = EXPANSION_BALANCE[game.gridExpansionLevel].size
  const retiringCount = game.employees.filter((e) => isNearRetirement(e, game.businessYear)).length
  // Prestige perks: the pool still available to pick this prestige.
  const availablePerks = getAvailablePrestigePerks(game.prestigePerks)
  // Fire the prestige (optionally with a chosen perk) after the confirm step.
  const doPrestige = (perk?: PrestigePerkKey) => {
    setPerkPickerOpen(false)
    prestige(perk)
    router.replace('/game')
  }

  const TABS: { key: CompanyTab; label: string; badge?: number }[] = [
    { key: 'grow',     label: t(cs.tabs.grow) },
    { key: 'settings', label: t(cs.tabs.settings) },
  ]

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName} numberOfLines={1}>{game.refineryName}</Text>
            <Text style={styles.companyTitle}>{refineryTitle}</Text>
          </View>
          <View style={styles.headerRight}>
            {lastAward && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{lastAward.grade}</Text>
                <Text style={styles.gradeLabel}>{t(cs.yr(lastAward.year))}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.quickStats}>
          <View style={styles.qStat}><Text style={styles.qVal}>{game.employees.length}/{cap*WORKERS.length}</Text><Text style={styles.qLbl}>{t(cs.quick.staff)}</Text></View>
          <View style={styles.qDiv} />
          <View style={styles.qStat}><Text style={styles.qVal}>{completedMilestones}/{totalMilestones}</Text><Text style={styles.qLbl}>{t(cs.quick.goals)}</Text></View>
          <View style={styles.qDiv} />
          <View style={styles.qStat}><Text style={styles.qVal}>{unlockedResearch}/{totalResearch}</Text><Text style={styles.qLbl}>{t(cs.quick.research)}</Text></View>
          <View style={styles.qDiv} />
          <View style={styles.qStat}><Text style={styles.qVal}>{currentSize}×{currentSize}</Text><Text style={styles.qLbl}>{t(cs.quick.grid)}</Text></View>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <Pressable key={tab.key} style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]} onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
              {tab.badge ? <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{tab.badge}</Text></View> : null}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ══ GROW TAB ══ */}
      {activeTab === 'grow' && (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Awards & world */}
          <Text style={styles.sectionLabel}>{t(cs.companyStatus)}</Text>
          <View style={styles.card}>
            <StatRow label={t(cs.businessYear)} value={t(cs.yearValue(game.businessYear))} />
            <StatRow label={t(cs.currentEra)} value={t(derived.currentEra.name)} />
            <StatRow label={t(cs.seasonLabel)} value={t(cs.seasonValue(t(seasonLabel), Math.round(derived.seasonalGasolineMultiplier * 100)))} />
            <StatRow label={t(cs.esgScore)} value={t(cs.esgValue(Math.round(game.esgScore), t(esgTier)))} />
            {lastAward && <StatRow label={t(cs.lastAward)} value={t(cs.lastAwardValue(lastAward.grade, lastAward.score))} accent />}
          </View>

          {/* Expansion */}
          <Text style={styles.sectionLabel}>{t(cs.refineryGrowth)}</Text>
          <View style={styles.card}>
            <StatRow label={t(cs.gridSize)} value={`${currentSize}×${currentSize}`} />
            {nextExpansion ? (
              <>
                <StatRow label={t(cs.nextExpansion)} value={t(cs.nextExpansionValue(nextExpansion.size, nextExpansion.requiresRefineryLevel))} />
                <Pressable
                  style={[styles.expandBtn, (game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost) && styles.expandBtnOff]}
                  disabled={game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost}
                  onPress={() => expandGrid()}
                >
                  <Text style={styles.expandBtnLabel}>{t(cs.expandTo(nextExpansion.size, nextExpansion.cost.toLocaleString()))}</Text>
                </Pressable>
              </>
            ) : <Text style={styles.emptyNote}>{t(cs.maxSizeReached)}</Text>}
          </View>

          {/* Research & Perks now live on the dedicated R&D tab (/game/research). */}

          {/* Activity log */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>{t(cs.activityLog)}</Text>
          <View style={styles.card}>
            {game.activityLog.length === 0
              ? <Text style={styles.emptyNote}>{t(cs.nothingLogged)}</Text>
              : game.activityLog.slice(0, 10).map((entry, i) => {
                  // Entries are stored as serialized bilingual text (EN|||TH|||TH);
                  // pick the active language, falling back to EN for older/plain ones.
                  const parsed = parseBilingualText(entry)
                  return (
                    <Text key={i} style={styles.logEntry}>{lang === 'th' && parsed.th ? parsed.th : parsed.en}</Text>
                  )
                })}
          </View>
          <Pressable style={styles.linkBtn} onPress={() => router.push('/achievements')}>
            <Text style={styles.linkBtnLabel}>{t(cs.viewMilestones)}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ══ SETTINGS TAB ══ */}
      {activeTab === 'settings' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>{t(cs.companyNameHeader)}</Text>
          <View style={styles.card}>
            <Text style={styles.currentName}>{game.refineryName}</Text>
            <View style={styles.renameRow}>
              <TextInput style={styles.input} placeholder={t(cs.newNamePlaceholder)} placeholderTextColor={colors.inkMuted} value={name} onChangeText={setName} />
              <Pressable style={[styles.saveBtn, !name.trim() && styles.saveBtnOff]} onPress={() => { const n = name.trim(); if (!n) return; renameRefinery(n); setName('') }}>
                <Text style={styles.saveBtnLabel}>{t(cs.save)}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t(cs.saveAccess)}</Text>
          <ListRow title={t(cs.manualSave)} subtitle={t(cs.manualSaveSub)} actionLabel={t(cs.save)} onPress={() => manualSave()} />
          <ListRow
            title={t(cs.exportSave)}
            subtitle={t(cs.exportSaveSub)}
            actionLabel={t(cs.export)}
            onPress={async () => {
              try {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
                const raw = await AsyncStorage.getItem('refinery_save')
                if (!raw) { Alert.alert(t(cs.noSaveFound)); return }
                await Share.share({ message: raw, title: 'Refinery Story Save' })
              } catch (e) {
                Alert.alert(t(cs.exportFailed), String(e))
              }
            }}
          />
          <ListRow title={t(cs.settingsRow)} subtitle={t(cs.settingsRowSub)} actionLabel={t(cs.open)} onPress={() => router.push('/settings')} />
          <ListRow title={t(cs.store)} subtitle={t(cs.storeSub)} actionLabel={t(cs.open)} onPress={() => router.push('/store')} />
          <ListRow title={t(cs.mainMenu)} subtitle={t(cs.mainMenuSub)} actionLabel={t(cs.go)} onPress={() => router.replace('/')} />

          <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>{t(cs.prestigeHeader)}</Text>
          {game.legendAchieved ? (
            <ListRow
              title={t(cs.prestigeTitle(game.prestigeLevel + 1))}
              subtitle={t(cs.prestigeSub(Math.round((game.prestigeLevel + 1) * PRESTIGE_BALANCE.bonusPerLevel * 100)))}
              actionLabel={t(cs.prestigeAction)}
              onPress={() => {
                // If any perk is still unpicked, open the perk chooser; once
                // every perk is owned, prestige is just a plain confirm.
                if (availablePerks.length > 0) {
                  setPerkPickerOpen(true)
                } else {
                  Alert.alert(t(cs.prestigeConfirmTitle), t(cs.prestigeConfirmBody), [
                    { text: t(cs.cancel), style: 'cancel' },
                    { text: t(cs.prestigeAction), onPress: () => doPrestige() },
                  ])
                }
              }}
            />
          ) : (
            <ListRow
              title={t(cs.prestigeTitle(game.prestigeLevel + 1))}
              subtitle={t(cs.prestigeLockedSub)}
              actionLabel={t(cs.prestigeLocked)}
              disabled
              onPress={() => {}}
            />
          )}

          <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>{t(cs.dangerZone)}</Text>
          <ListRow
            title={t(cs.resetSave)}
            subtitle={t(cs.resetSaveSub)}
            actionLabel={t(cs.reset)}
            onPress={() => Alert.alert(t(cs.resetConfirmTitle), t(cs.resetConfirmBody), [
              { text: t(cs.cancel), style: 'cancel' },
              { text: t(cs.reset), style: 'destructive', onPress: () => { resetGame(); router.replace('/') } },
            ])}
          />
        </ScrollView>
      )}

      {/* Prestige perk chooser: pick one permanent perk to carry into the
          next run. Shown only when at least one perk is still unowned. */}
      <Modal visible={perkPickerOpen} transparent animationType="fade" onRequestClose={() => setPerkPickerOpen(false)}>
        <Pressable style={styles.perkOverlay} onPress={() => setPerkPickerOpen(false)}>
          <Pressable style={styles.perkSheet} onPress={() => {}}>
            <Text style={styles.perkTitle}>{t(cs.prestigePerkTitle)}</Text>
            <Text style={styles.perkSub}>{t(cs.prestigePerkSub)}</Text>
            <ScrollView style={styles.perkList}>
              {availablePerks.map((perk) => (
                <AnimatedPressable
                  key={perk.key}
                  style={styles.perkCard}
                  onPress={() => {
                    Alert.alert(
                      t(cs.prestigeConfirmTitle),
                      `${perk.icon} ${t(perk.name)}\n\n${t(cs.prestigeConfirmBody)}`,
                      [
                        { text: t(cs.cancel), style: 'cancel' },
                        { text: t(cs.prestigeAction), onPress: () => doPrestige(perk.key) },
                      ],
                    )
                  }}
                >
                  <Text style={styles.perkIcon}>{perk.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkName}>{t(perk.name)}</Text>
                    <Text style={styles.perkFlavor}>{t(perk.flavor)}</Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
            {game.prestigePerks.length > 0 && (
              <Text style={styles.perkOwned}>
                {t(cs.prestigePerkOwned)}{' '}
                {game.prestigePerks
                  .map((k) => getPrestigePerkConfig(k))
                  .filter((p): p is NonNullable<typeof p> => !!p)
                  .map((p) => p.icon)
                  .join(' ')}
              </Text>
            )}
            <Pressable style={styles.perkCancel} onPress={() => setPerkPickerOpen(false)}>
              <Text style={styles.perkCancelText}>{t(cs.cancel)}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111820' },
  loadingScreen: { flex: 1, backgroundColor: '#111820', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  header: { backgroundColor: '#1C2634', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  companyTitle: { fontSize: 10, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.xs },
  gradeBadge: { backgroundColor: colors.gold, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  gradeText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  gradeLabel: { fontSize: 8, color: colors.ink, fontWeight: '700' },
  quickStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, alignItems: 'center' },
  qStat: { flex: 1, alignItems: 'center' },
  qVal: { fontSize: 13, fontWeight: '900', color: '#fff' },
  qLbl: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.3 },
  qDiv: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.pill, padding: 3, gap: 2, marginBottom: spacing.xs },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: radii.pill, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#6B8099' },
  tabLabelActive: { color: '#1C2634' },
  tabBadge: { backgroundColor: colors.orange, borderRadius: radii.pill, minWidth: 16, height: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.xs, paddingHorizontal: spacing.xs },
  empSkills: { marginTop: 8 },
  teamSkillPanel: { backgroundColor: '#1C2634', borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  teamSkillTitle: { fontSize: 11, fontWeight: '900', color: '#8FA3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  teamSkillRow: { flexDirection: 'row' },
  teamSkillStat: { flex: 1, alignItems: 'center', gap: 2 },
  teamSkillIcon: { fontSize: 18 },
  teamSkillVal: { fontSize: 15, fontWeight: '900', color: '#fff' },
  teamSkillLbl: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.3 },
  perkOverlay: { flex: 1, backgroundColor: 'rgba(6,9,14,0.66)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  perkSheet: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#161D28', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', padding: spacing.lg, gap: spacing.sm },
  perkTitle: { fontSize: 18, fontFamily: fonts.display, color: '#F2F6FB', textAlign: 'center' },
  perkSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: spacing.xs },
  perkList: { flexGrow: 0 },
  perkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md, marginBottom: spacing.xs },
  perkIcon: { fontSize: 26 },
  perkName: { fontSize: 15, fontWeight: '900', color: '#EAF1F8' },
  perkFlavor: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  perkOwned: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: spacing.xs },
  perkCancel: { alignSelf: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  perkCancelText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  card: { backgroundColor: '#1B2534', borderRadius: 14, borderTopWidth: 2, borderTopColor: '#2C3D54', borderBottomWidth: 3, borderBottomColor: '#0C131C', padding: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.heading, color: '#EAF1F8' },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  emptyNote: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', paddingVertical: 4 },
  empCard: { backgroundColor: '#1B2534', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 3, borderBottomColor: '#0C131C', padding: spacing.sm },
  empCardRetiring: { borderColor: 'rgba(232,131,58,0.6)', borderBottomColor: '#5A3417', backgroundColor: 'rgba(232,131,58,0.08)' },
  empTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empRoleIcon: { marginRight: spacing.sm },
  empNameBlock: { flex: 1, marginRight: spacing.sm },
  empName: { fontSize: 14, fontFamily: fonts.heading, color: '#EAF1F8' },
  empRole: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  empFlavor: { fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 1 },
  empRoleTag: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  empRoleTagGlobal: { color: '#8FD08A' },
  empRoleTagAssign: { color: '#7FB2E8' },
  lvBadge: { backgroundColor: colors.blue, borderRadius: radii.pill, borderBottomWidth: 2, borderBottomColor: colors.blueDark, paddingHorizontal: 10, paddingVertical: 4 },
  lvBadgeMax: { backgroundColor: colors.gold, borderBottomColor: colors.goldDark },
  lvBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  retireWarn: { fontSize: 11, color: colors.orange, fontWeight: '700', marginTop: 4 },
  empTenure: { fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  empActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  actBtn: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, borderBottomWidth: 2 },
  actBtnTrain: { backgroundColor: colors.blue, borderBottomColor: colors.blueDark },
  actBtnAssigned: { backgroundColor: colors.green, borderBottomColor: colors.greenDark },
  actBtnOff: { backgroundColor: '#2E3D50', borderBottomColor: '#1B2532' },
  actBtnLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  picker: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: spacing.sm, gap: 4 },
  pickerTitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginBottom: 4 },
  pickerOption: { paddingVertical: 7, paddingHorizontal: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radii.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: '#EAF1F8' },
  expandBtn: { marginTop: spacing.md, backgroundColor: colors.green, borderRadius: 12, borderBottomWidth: 4, borderBottomColor: colors.greenDark, paddingVertical: 12, alignItems: 'center' },
  expandBtnOff: { backgroundColor: '#2E3D50', borderBottomColor: '#1B2532' },
  expandBtnLabel: { fontSize: 13, fontFamily: fonts.display, color: '#fff' },
  branchLabel: { fontSize: 11, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: 2 },
  logEntry: { fontSize: 11, color: 'rgba(255,255,255,0.5)', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  linkBtn: { paddingVertical: spacing.xs, alignItems: 'flex-end' },
  linkBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.teal },
  currentName: { fontSize: 15, fontFamily: fonts.heading, color: '#EAF1F8', marginBottom: spacing.sm },
  renameRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: spacing.sm, paddingVertical: 8, color: '#EAF1F8', fontSize: 13 },
  saveBtn: { backgroundColor: colors.green, borderRadius: radii.sm, borderBottomWidth: 3, borderBottomColor: colors.greenDark, paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center' },
  saveBtnOff: { backgroundColor: '#2E3D50', borderBottomColor: '#1B2532' },
  saveBtnLabel: { fontWeight: '800', color: '#fff', fontSize: 13 },
})
