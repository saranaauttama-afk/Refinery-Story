import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { parseBilingualText, text } from '../../../src/game/translations'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { EXPANSION_BALANCE, PRESTIGE_BALANCE, STAFF_LEVEL_BALANCE, type PaidExpansionEntry } from '../../../src/game/data/balance'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDINGS } from '../../../src/game/data/buildings'
import {
  getCellAssignedToEmployee,
  getTrainingCost,
  getMaxHireCount,
  isNearRetirement,
  getEsgTier,
  getSeasonLabel,
  getRefineryTitle,
} from '../../../src/game/utils/gameCalculations'
import type { BuildingType, WorkerType } from '../../../src/game/types'
import { PLANT_PRODUCTION } from '../../../src/game/data/balance'

type CompanyTab = 'team' | 'grow' | 'settings'

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
  const [activeTab, setActiveTab] = useState<CompanyTab>('team')
  const [pickerEmployeeId, setPickerEmployeeId] = useState<string | null>(null)
  const [name, setName] = useState('')

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

  const TABS: { key: CompanyTab; label: string; badge?: number }[] = [
    { key: 'team',     label: t(cs.tabs.team),     badge: retiringCount || undefined },
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

      {/* ══ TEAM TAB ══ */}
      {activeTab === 'team' && (
        <ScrollView contentContainerStyle={styles.list}>
          {game.employees.length === 0 && (
            <View style={styles.emptyState}>
              <ArtSlot id="team_empty" width={140} height={140} spec="480×480" radius={70} caption="Empty desks / hiring sign" />
              <Text style={styles.emptyTitle}>{t(cs.noEmployees)}</Text>
              <Text style={styles.emptyHint}>{t(cs.hireHint)}</Text>
            </View>
          )}
          {game.employees.map((employee) => {
            const w = WORKERS.find((wk) => wk.key === employee.type)
            const maxed = employee.level >= STAFF_LEVEL_BALANCE.maxLevel
            const xpNeeded = STAFF_LEVEL_BALANCE.xpToNextLevel[employee.level] ?? 0
            const cost = getTrainingCost(employee.level)
            const canTrain = !maxed && game.money >= cost.money && game.researchPoints >= cost.rp
            const isSpecialist = SPECIALIST_TYPES.includes(employee.type)
            const assignedCellIndex = getCellAssignedToEmployee(game, employee.id)
            const buildingKey = SPECIALIST_BUILDING[employee.type]
            const eligibleCells = buildingKey
              ? game.grid.reduce<{ cellIndex: number; label: string }[]>((acc, cell, ci) => {
                  if (cell === buildingKey) acc.push({ cellIndex: ci, label: t(cs.plantLabel(t(BUILDINGS[buildingKey].name), acc.length + 1)) })
                  return acc
                }, [])
              : []
            const assignedLabel = eligibleCells.find((c) => c.cellIndex === assignedCellIndex)?.label
            const nearRetire = isNearRetirement(employee, game.businessYear)
            const yearsLeft = employee.hiredOnYear !== undefined ? Math.max(0, (employee.hiredOnYear + 5) - game.businessYear) : null

            return (
              <View key={employee.id} style={[styles.empCard, nearRetire && styles.empCardRetiring]}>
                <View style={styles.empTop}>
                  <View style={styles.empRoleIcon}><GameIcon name={`worker-${employee.type}`} size={34} /></View>
                  <View style={styles.empNameBlock}>
                    <Text style={styles.empName}>{employee.name}{employee.trait === 'veteran' ? ' ⭐' : ''}{nearRetire ? ' 🕰' : ''}</Text>
                    <Text style={styles.empRole}>{w ? t(w.name) : employee.type}</Text>
                  </View>
                  <View style={[styles.lvBadge, maxed && styles.lvBadgeMax]}>
                    <Text style={styles.lvBadgeText}>Lv{employee.level}</Text>
                  </View>
                </View>
                <XpBar current={employee.xp} max={xpNeeded} level={employee.level} />
                {nearRetire && yearsLeft !== null && (
                  <Text style={styles.retireWarn}>{t(cs.retiresIn(yearsLeft))}</Text>
                )}
                <View style={styles.empActions}>
                  <AnimatedPressable
                    disabled={!canTrain}
                    onPress={() => {
                      if (canTrain) { spawnFloat(`-$${cost.money.toLocaleString()}`, 'expense'); haptics.confirm() }
                      trainEmployee(employee.id)
                    }}
                    style={[styles.actBtn, canTrain ? styles.actBtnTrain : styles.actBtnOff]}
                  >
                    <Text style={styles.actBtnLabel}>{maxed ? t(cs.maxLevel) : t(cs.train(cost.money.toLocaleString(), cost.rp))}</Text>
                  </AnimatedPressable>
                  {isSpecialist && (
                    <Pressable
                      disabled={eligibleCells.length === 0}
                      onPress={() => {
                        if (assignedCellIndex !== null) { unassignCell(assignedCellIndex); setPickerEmployeeId(null) }
                        else setPickerEmployeeId(pickerEmployeeId === employee.id ? null : employee.id)
                      }}
                      style={[styles.actBtn, assignedCellIndex !== null ? styles.actBtnAssigned : styles.actBtnOff]}
                    >
                      <Text style={styles.actBtnLabel}>
                        {assignedCellIndex !== null ? `📌 ${assignedLabel ?? t(cs.assigned)}` : eligibleCells.length === 0 ? t(cs.noPlantBuilt) : t(cs.assign)}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {pickerEmployeeId === employee.id && assignedCellIndex === null && (
                  <View style={styles.picker}>
                    <Text style={styles.pickerTitle}>{t(cs.selectPlant)}</Text>
                    {eligibleCells.map(({ cellIndex, label }) => {
                      const occ = game.employees.find((e) => getCellAssignedToEmployee(game, e.id) === cellIndex)
                      return (
                        <Pressable key={cellIndex} style={styles.pickerOption} onPress={() => { assignEmployeeToCell(employee.id, cellIndex); setPickerEmployeeId(null); haptics.confirm() }}>
                          <Text style={styles.pickerLabel}>{label}{occ ? ` · ${occ.name}` : ''}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      )}

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
              onPress={() => Alert.alert(t(cs.prestigeConfirmTitle), t(cs.prestigeConfirmBody), [
                { text: t(cs.cancel), style: 'cancel' },
                { text: t(cs.prestigeAction), onPress: () => { prestige(); router.replace('/game') } },
              ])}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
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
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.creamBorder, padding: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyHint: { fontSize: 13, color: colors.inkMuted, textAlign: 'center' },
  emptyNote: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: 4 },
  empCard: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 2, borderColor: colors.creamBorder, padding: spacing.sm },
  empCardRetiring: { borderColor: colors.orange, backgroundColor: '#FFF8F0' },
  empTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empRoleIcon: { marginRight: spacing.sm },
  empNameBlock: { flex: 1, marginRight: spacing.sm },
  empName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  empRole: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  lvBadge: { backgroundColor: colors.blue, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  lvBadgeMax: { backgroundColor: colors.gold },
  lvBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  retireWarn: { fontSize: 11, color: colors.orange, fontWeight: '700', marginTop: 4 },
  empActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  actBtn: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  actBtnTrain: { backgroundColor: colors.blue },
  actBtnAssigned: { backgroundColor: colors.green },
  actBtnOff: { backgroundColor: colors.creamBorder },
  actBtnLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },
  picker: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.creamBorder, paddingTop: spacing.sm, gap: 4 },
  pickerTitle: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', marginBottom: 4 },
  pickerOption: { paddingVertical: 7, paddingHorizontal: spacing.sm, backgroundColor: colors.cream, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.creamBorder },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  expandBtn: { marginTop: spacing.md, backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  expandBtnOff: { backgroundColor: colors.creamBorder },
  expandBtnLabel: { fontSize: 13, fontWeight: '900', color: colors.ink },
  branchLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.xs, marginTop: spacing.xs, marginBottom: 2 },
  logEntry: { fontSize: 11, color: colors.inkMuted, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.creamBorder },
  linkBtn: { paddingVertical: spacing.xs, alignItems: 'flex-end' },
  linkBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.blue },
  currentName: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  renameRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.creamBorder, borderRadius: radii.sm, backgroundColor: colors.cream, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.ink, fontSize: 13 },
  saveBtn: { backgroundColor: colors.green, borderRadius: radii.sm, paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center' },
  saveBtnOff: { backgroundColor: colors.creamBorder },
  saveBtnLabel: { fontWeight: '800', color: colors.ink, fontSize: 13 },
})
