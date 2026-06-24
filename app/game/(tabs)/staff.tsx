import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { STAFF_LEVEL_BALANCE, PLANT_PRODUCTION } from '../../../src/game/data/balance'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import {
  getCellAssignedToEmployee,
  getTrainingCost,
  getMaxHireCount,
  isNearRetirement,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import type { BuildingType, RecruitmentCandidate, RecruitmentTier, WorkerType } from '../../../src/game/types'

// ── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<RecruitmentTier, {
  label: string
  bodyColor: string
  legColor: string
  headColor: string
  borderColor: string
  badgeEmoji: string
}> = {
  rookie:  { label: 'Rookie',    headColor: '#C8A882', bodyColor: '#8090A0', legColor: '#506070', borderColor: colors.creamBorder, badgeEmoji: '' },
  skilled: { label: 'Skilled',   headColor: '#D4A070', bodyColor: '#4A7AAA', legColor: '#2A5A8A', borderColor: colors.blue,        badgeEmoji: '🔹' },
  expert:  { label: 'Expert',    headColor: '#C09060', bodyColor: '#C06A20', legColor: '#903A10', borderColor: colors.orange,      badgeEmoji: '🔸' },
  star:    { label: '⭐ Star',   headColor: '#D4A860', bodyColor: '#8060B0', legColor: '#604090', borderColor: colors.gold,        badgeEmoji: '⭐' },
}

// ── Specialist config ────────────────────────────────────────────────────────
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

// ── XP bar ───────────────────────────────────────────────────────────────────
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

// ── Pixel character figure ───────────────────────────────────────────────────
function CandidateFigure({
  candidate,
  selected,
  onPress,
}: {
  candidate: RecruitmentCandidate
  selected: boolean
  onPress: () => void
}) {
  const tc = TIER_CONFIG[candidate.tier]
  const worker = WORKERS.find((w) => w.key === candidate.type)
  return (
    <Pressable style={[figStyles.wrap, selected && figStyles.wrapSelected]} onPress={onPress}>
      {/* Name bubble */}
      <View style={figStyles.bubble}>
        <Text style={figStyles.bubbleName} numberOfLines={1}>{candidate.name}</Text>
        {candidate.isVeteran && <Text style={figStyles.bubbleVet}>⭐</Text>}
      </View>
      {/* Tier emoji badge */}
      {tc.badgeEmoji ? <Text style={figStyles.tierEmoji}>{tc.badgeEmoji}</Text> : null}
      {/* Pixel body */}
      <View style={[figStyles.head, { backgroundColor: tc.headColor }]} />
      <View style={[figStyles.body, { backgroundColor: tc.bodyColor }]} />
      <View style={figStyles.legs}>
        <View style={[figStyles.leg, { backgroundColor: tc.legColor }]} />
        <View style={[figStyles.leg, { backgroundColor: tc.legColor }]} />
      </View>
      {/* Selected glow ring */}
      {selected && <View style={figStyles.ring} />}
      {/* Role label */}
      <Text style={figStyles.roleLabel} numberOfLines={1}>{worker?.name.en ?? candidate.type}</Text>
    </Pressable>
  )
}
const figStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 28,
    paddingHorizontal: 4,
    position: 'relative',
  },
  wrapSelected: { transform: [{ scale: 1.12 }, { translateY: -4 }] },
  bubble: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(28,38,52,0.88)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bubbleName: { fontSize: 9, fontWeight: '800', color: '#fff' },
  bubbleVet:  { fontSize: 9 },
  tierEmoji: {
    position: 'absolute',
    top: 28,
    right: 2,
    fontSize: 11,
    zIndex: 3,
  },
  head: { width: 22, height: 22, borderRadius: 11, marginBottom: -2, zIndex: 2 },
  body: { width: 20, height: 30, borderRadius: 4, zIndex: 2 },
  legs: { flexDirection: 'row', gap: 3, marginTop: 1 },
  leg:  { width: 8, height: 14, borderRadius: 3 },
  ring: {
    position: 'absolute',
    bottom: 6,
    width: 52,
    height: 14,
    borderRadius: 26,
    backgroundColor: 'rgba(242,193,46,0.35)',
  },
  roleLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})

// ── Main screen ──────────────────────────────────────────────────────────────
export default function StaffScreen() {
  const {
    game, loaded, derived,
    hireCandidate, refreshRecruitmentPool,
    trainEmployee, assignEmployeeToCell, unassignCell, claimHiddenEvent,
  } = useGame()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()

  const [tab, setTab] = useState<'recruit' | 'team'>('recruit')
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [pickerEmployeeId, setPickerEmployeeId] = useState<string | null>(null)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const cap = getMaxHireCount(game.refineryLevel)
  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canRefresh = game.money >= refreshCost
  const refreshSecondsLeft = Math.max(
    0,
    Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000),
  )

  const selectedCandidate = game.recruitmentPool[selectedSlot]
  const worker = selectedCandidate ? WORKERS.find((w) => w.key === selectedCandidate.type) : null
  const tc = selectedCandidate ? TIER_CONFIG[selectedCandidate.tier] : null
  const atCap = selectedCandidate ? game.workerCounts[selectedCandidate.type] >= cap : false
  const affordable = selectedCandidate ? game.money >= selectedCandidate.cost : false
  const canHire = affordable && !atCap
  const mentorBonus = selectedCandidate ? (game.mentorXpBonus?.[selectedCandidate.type] ?? 0) : 0

  const retiringCount = game.employees.filter((e) => isNearRetirement(e, game.businessYear)).length

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* ── Dark header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Staff</Text>
            <Text style={styles.subtitle}>Yr.{game.businessYear} · {game.employees.length} hired · {cap} max/role</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>{game.employees.length}</Text>
              <Text style={styles.hStatLabel}>Total</Text>
            </View>
            <View style={styles.hStatDiv} />
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>{cap}</Text>
              <Text style={styles.hStatLabel}>Cap</Text>
            </View>
            {retiringCount > 0 && (
              <>
                <View style={styles.hStatDiv} />
                <View style={styles.hStat}>
                  <Text style={[styles.hStatVal, { color: colors.orange }]}>{retiringCount}</Text>
                  <Text style={styles.hStatLabel}>Retiring</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Tab toggle */}
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, tab === 'recruit' && styles.toggleBtnActive]}
            onPress={() => setTab('recruit')}
          >
            <Text style={[styles.toggleLabel, tab === 'recruit' && styles.toggleLabelActive]}>
              Recruitment
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, tab === 'team' && styles.toggleBtnActive]}
            onPress={() => setTab('team')}
          >
            <Text style={[styles.toggleLabel, tab === 'team' && styles.toggleLabelActive]}>
              Team {game.employees.length > 0 ? `(${game.employees.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          RECRUITMENT TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'recruit' && (
        <>
          {/* Scene — 3 candidates standing */}
          <View style={styles.scene}>
            {/* Background silhouettes */}
            <View style={styles.sceneBuildingLarge} />
            <View style={styles.sceneBuildingSmall} />
            <View style={styles.sceneSign}>
              <Text style={styles.sceneSignText}>Hiring Office</Text>
            </View>

            {/* Candidates */}
            <View style={styles.candidatesStage}>
              {HIDDEN_EVENTS.filter(
                (e) => e.reward.kind === 'staff' && game.hiddenEventStatus[e.key] === 'unlocked',
              ).slice(0, 1).map((event) => (
                <Pressable key={event.key} style={styles.mysteryFigure} onPress={() => claimHiddenEvent(event.key)}>
                  <View style={styles.mysteryBubble}><Text style={styles.mysteryBubbleText}>???</Text></View>
                  <View style={styles.mysteryBody} />
                  <View style={figStyles.legs}>
                    <View style={[figStyles.leg, { backgroundColor: '#444' }]} />
                    <View style={[figStyles.leg, { backgroundColor: '#444' }]} />
                  </View>
                  <Text style={[figStyles.roleLabel, { color: colors.orange }]}>Mystery!</Text>
                </Pressable>
              ))}
              {game.recruitmentPool.map((candidate, slotIndex) => (
                <CandidateFigure
                  key={candidate.id}
                  candidate={candidate}
                  selected={selectedSlot === slotIndex}
                  onPress={() => setSelectedSlot(slotIndex)}
                />
              ))}
            </View>
          </View>

          {/* Info panel for selected candidate */}
          {selectedCandidate && tc && (
            <View style={[styles.infoPanel, { borderTopColor: tc.borderColor }]}>
              <View style={styles.infoTop}>
                <View>
                  <Text style={styles.infoName}>{selectedCandidate.name}</Text>
                  <Text style={styles.infoRole}>
                    {worker?.name.en ?? selectedCandidate.type}
                    {selectedCandidate.isVeteran ? ' · ⭐ Veteran +20%' : ''}
                  </Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: tc.borderColor }]}>
                  <Text style={styles.tierBadgeText}>{tc.label}</Text>
                </View>
              </View>

              <View style={styles.infoStats}>
                <View style={styles.infoStat}>
                  <Text style={styles.infoStatVal}>Lv{selectedCandidate.startingLevel}</Text>
                  <Text style={styles.infoStatLabel}>Starts at</Text>
                </View>
                <View style={styles.infoStatDiv} />
                <View style={styles.infoStat}>
                  <Text style={styles.infoStatVal}>{game.workerCounts[selectedCandidate.type]}/{cap}</Text>
                  <Text style={styles.infoStatLabel}>Hired</Text>
                </View>
                {mentorBonus > 0 && (
                  <>
                    <View style={styles.infoStatDiv} />
                    <View style={styles.infoStat}>
                      <Text style={[styles.infoStatVal, { color: colors.green }]}>+{mentorBonus}</Text>
                      <Text style={styles.infoStatLabel}>Mentor XP</Text>
                    </View>
                  </>
                )}
              </View>

              <AnimatedPressable
                disabled={!canHire}
                onPress={() => {
                  if (canHire) {
                    spawnFloat(`-$${selectedCandidate.cost.toLocaleString()}`, 'expense')
                    haptics.confirm()
                  }
                  hireCandidate(selectedSlot)
                  setSelectedSlot(0)
                }}
                style={[styles.hireBtn, canHire ? styles.hireBtnActive : styles.hireBtnDisabled]}
              >
                <Text style={styles.hireBtnLabel}>
                  {atCap
                    ? `Full — ${cap} max for this role`
                    : !affordable
                      ? `Need $${selectedCandidate.cost.toLocaleString()}`
                      : `Hire ${selectedCandidate.name} — $${selectedCandidate.cost.toLocaleString()}`}
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Refresh bar */}
          <View style={styles.refreshBar}>
            <Text style={styles.refreshTimer}>
              {refreshSecondsLeft > 0
                ? `New candidates in ${Math.ceil(refreshSecondsLeft / 60)}m`
                : 'Candidates ready'}
            </Text>
            <AnimatedPressable
              disabled={!canRefresh}
              onPress={() => {
                if (canRefresh) { spawnFloat(`-$${refreshCost.toLocaleString()}`, 'expense'); haptics.tap() }
                refreshRecruitmentPool()
                setSelectedSlot(0)
              }}
              style={[styles.refreshBtn, canRefresh ? styles.refreshBtnActive : styles.refreshBtnDisabled]}
            >
              <Text style={styles.refreshBtnLabel}>🔄 Refresh ${refreshCost.toLocaleString()}</Text>
            </AnimatedPressable>
          </View>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TEAM TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'team' && (
        <ScrollView contentContainerStyle={styles.teamList}>
          {game.employees.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No employees yet</Text>
              <Text style={styles.emptyHint}>Go to Recruitment to hire your first staff.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setTab('recruit')}>
                <Text style={styles.emptyBtnLabel}>Go to Recruitment →</Text>
              </Pressable>
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
                  if (cell === buildingKey) acc.push({ cellIndex: ci, label: `${BUILDINGS[buildingKey].name.en} #${acc.length + 1}` })
                  return acc
                }, [])
              : []
            const assignedLabel = eligibleCells.find((c) => c.cellIndex === assignedCellIndex)?.label
            const nearRetire = isNearRetirement(employee, game.businessYear)
            const yearsLeft = employee.hiredOnYear !== undefined
              ? Math.max(0, (employee.hiredOnYear + 5) - game.businessYear)
              : null

            return (
              <View key={employee.id} style={[styles.empCard, nearRetire && styles.empCardRetiring]}>
                <View style={styles.empTop}>
                  <View style={styles.empNameBlock}>
                    <Text style={styles.empName}>
                      {employee.name}
                      {employee.trait === 'veteran' ? ' ⭐' : ''}
                      {nearRetire ? ' 🕰' : ''}
                    </Text>
                    <Text style={styles.empRole}>{w?.name.en ?? employee.type}</Text>
                  </View>
                  <View style={[styles.lvBadge, maxed && styles.lvBadgeMax]}>
                    <Text style={styles.lvBadgeText}>Lv{employee.level}</Text>
                  </View>
                </View>

                <XpBar current={employee.xp} max={xpNeeded} level={employee.level} />

                {nearRetire && yearsLeft !== null && (
                  <Text style={styles.retireWarn}>Retires in {yearsLeft} year{yearsLeft !== 1 ? 's' : ''}</Text>
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
                    <Text style={styles.actBtnLabel}>
                      {maxed ? 'Max Level' : `Train $${cost.money.toLocaleString()} · ${cost.rp}RP`}
                    </Text>
                  </AnimatedPressable>

                  {isSpecialist && (
                    <Pressable
                      disabled={eligibleCells.length === 0}
                      onPress={() => {
                        if (assignedCellIndex !== null) {
                          unassignCell(assignedCellIndex)
                          setPickerEmployeeId(null)
                        } else {
                          setPickerEmployeeId(pickerEmployeeId === employee.id ? null : employee.id)
                        }
                      }}
                      style={[styles.actBtn, assignedCellIndex !== null ? styles.actBtnAssigned : styles.actBtnOff]}
                    >
                      <Text style={styles.actBtnLabel}>
                        {assignedCellIndex !== null
                          ? `📌 ${assignedLabel ?? 'Assigned'}`
                          : eligibleCells.length === 0
                            ? 'No plant built'
                            : 'Assign →'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {pickerEmployeeId === employee.id && assignedCellIndex === null && (
                  <View style={styles.picker}>
                    <Text style={styles.pickerTitle}>Select plant:</Text>
                    {eligibleCells.map(({ cellIndex, label }) => {
                      const occ = game.employees.find((e) => getCellAssignedToEmployee(game, e.id) === cellIndex)
                      return (
                        <Pressable
                          key={cellIndex}
                          style={styles.pickerOption}
                          onPress={() => { assignEmployeeToCell(employee.id, cellIndex); setPickerEmployeeId(null); haptics.confirm() }}
                        >
                          <Text style={styles.pickerOptionLabel}>{label}{occ ? ` · ${occ.name}` : ''}</Text>
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
    </SafeAreaView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1520' },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { backgroundColor: '#1C2634', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  title:    { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  subtitle: { fontSize: 10, color: '#6B8099', marginTop: 1 },
  headerStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 10 },
  hStat:    { alignItems: 'center', paddingHorizontal: 8 },
  hStatVal: { fontSize: 16, fontWeight: '900', color: '#fff' },
  hStatLabel: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase' },
  hStatDiv: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Toggle
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.pill, padding: 3, marginBottom: spacing.xs },
  toggleBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: radii.pill },
  toggleBtnActive: { backgroundColor: '#FFFFFF' },
  toggleLabel: { fontSize: 12, fontWeight: '700', color: '#6B8099' },
  toggleLabelActive: { color: '#1C2634' },

  // Scene
  scene: {
    height: 200,
    backgroundColor: '#4A7A9A',
    position: 'relative',
    overflow: 'hidden',
  },
  sceneBuildingLarge: {
    position: 'absolute', right: 16, bottom: 0,
    width: 80, height: 110,
    backgroundColor: '#7A8A70', borderRadius: 4, opacity: 0.5,
  },
  sceneBuildingSmall: {
    position: 'absolute', right: 90, bottom: 0,
    width: 50, height: 70,
    backgroundColor: '#6A7A60', borderRadius: 4, opacity: 0.4,
  },
  sceneSign: {
    position: 'absolute', top: '45%', left: 14,
    backgroundColor: colors.cream,
    borderRadius: 6, borderWidth: 2, borderColor: '#8A7A5A',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sceneSignText: { fontSize: 9, fontWeight: '800', color: colors.ink },
  candidatesStage: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'flex-end', gap: 20, paddingHorizontal: 20,
  },
  mysteryFigure: { alignItems: 'center', paddingBottom: 8, paddingTop: 28, position: 'relative' },
  mysteryBubble: {
    position: 'absolute', top: 4,
    backgroundColor: 'rgba(232,131,58,0.9)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  mysteryBubbleText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  mysteryBody: { width: 20, height: 50, backgroundColor: '#333', borderRadius: 4, opacity: 0.6 },

  // Info panel
  infoPanel: {
    backgroundColor: '#1C2634',
    borderTopWidth: 2,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  infoName: { fontSize: 17, fontWeight: '900', color: '#fff' },
  infoRole: { fontSize: 11, color: '#6B8099', marginTop: 2 },
  tierBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.sm },
  infoStat:  { flex: 1, alignItems: 'center' },
  infoStatVal:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  infoStatLabel: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },

  hireBtn: { borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  hireBtnActive:   { backgroundColor: colors.green },
  hireBtnDisabled: { backgroundColor: '#2E3D50' },
  hireBtnLabel: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },

  // Refresh bar
  refreshBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#141E2A',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: '#2E3D50',
  },
  refreshTimer: { fontSize: 11, color: '#4A5A6A' },
  refreshBtn: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  refreshBtnActive:   { backgroundColor: '#2E3D50' },
  refreshBtnDisabled: { backgroundColor: '#1A2530' },
  refreshBtnLabel: { fontSize: 11, fontWeight: '700', color: '#8A9BB0' },

  // Team list
  teamList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: FLOATING_TAB_BAR_CLEARANCE },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyHint:  { fontSize: 13, color: colors.inkMuted, textAlign: 'center' },
  emptyBtn:   { backgroundColor: colors.green, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  emptyBtnLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },

  // Employee cards
  empCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md, borderWidth: 2, borderColor: colors.creamBorder,
    padding: spacing.sm, marginBottom: spacing.xs,
  },
  empCardRetiring: { borderColor: colors.orange, backgroundColor: '#FFF8F0' },
  empTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empNameBlock: { flex: 1, marginRight: spacing.sm },
  empName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  empRole: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  lvBadge:    { backgroundColor: colors.blue, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  lvBadgeMax: { backgroundColor: colors.gold },
  lvBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  retireWarn: { fontSize: 11, color: colors.orange, fontWeight: '700', marginTop: 4 },

  empActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  actBtn:       { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  actBtnTrain:  { backgroundColor: colors.blue },
  actBtnAssigned: { backgroundColor: colors.green },
  actBtnOff:    { backgroundColor: colors.creamBorder },
  actBtnLabel:  { fontSize: 11, fontWeight: '700', color: '#fff' },

  picker: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.creamBorder, paddingTop: spacing.sm, gap: 4 },
  pickerTitle: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', marginBottom: 4 },
  pickerOption: { paddingVertical: 7, paddingHorizontal: spacing.sm, backgroundColor: colors.cream, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.creamBorder },
  pickerOptionLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
})
