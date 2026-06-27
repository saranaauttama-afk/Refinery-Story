import { useState, useMemo, useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { WORKERS } from '../../../src/game/data/workers'
import { getContractProgress, TICK_MS, getMaxHireCount } from '../../../src/game/utils/gameCalculations'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { text } from '../../../src/game/translations'
import type { RecruitmentCandidate, RecruitmentTier } from '../../../src/game/types'

type BizTab = 'contracts' | 'supply' | 'recruit'
type ContractFilter = 'all' | 'ready' | 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

// Tier config for recruitment scene
const TIER_CONFIG: Record<RecruitmentTier, { label: string; bodyColor: string; legColor: string; headColor: string; borderColor: string; badgeEmoji: string }> = {
  rookie:  { label: 'Rookie',  headColor: '#C8A882', bodyColor: '#8090A0', legColor: '#506070', borderColor: colors.creamBorder, badgeEmoji: '' },
  skilled: { label: 'Skilled', headColor: '#D4A070', bodyColor: '#4A7AAA', legColor: '#2A5A8A', borderColor: colors.blue,        badgeEmoji: '🔹' },
  expert:  { label: 'Expert',  headColor: '#C09060', bodyColor: '#C06A20', legColor: '#903A10', borderColor: colors.orange,      badgeEmoji: '🔸' },
  star:    { label: '⭐ Star', headColor: '#D4A860', bodyColor: '#8060B0', legColor: '#604090', borderColor: colors.gold,        badgeEmoji: '⭐' },
}

function CandidateFigure({ candidate, selected, onPress }: { candidate: RecruitmentCandidate; selected: boolean; onPress: () => void }) {
  const tc = TIER_CONFIG[candidate.tier]
  const worker = WORKERS.find((w) => w.key === candidate.type)
  const prog = useSharedValue(0)
  useEffect(() => { prog.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 220 }) }, [selected])
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(prog.value, [0, 1], [1, 1.12]) }, { translateY: interpolate(prog.value, [0, 1], [0, -4]) }],
  }))
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[figStyles.wrap, animStyle]}>
        <View style={figStyles.bubble}><Text style={figStyles.bubbleName} numberOfLines={1}>{candidate.name}</Text>{candidate.isVeteran && <Text>⭐</Text>}</View>
        {tc.badgeEmoji ? <Text style={figStyles.tierEmoji}>{tc.badgeEmoji}</Text> : null}
        <View style={[figStyles.head, { backgroundColor: tc.headColor }]} />
        <View style={[figStyles.body, { backgroundColor: tc.bodyColor }]} />
        <View style={figStyles.legs}><View style={[figStyles.leg, { backgroundColor: tc.legColor }]} /><View style={[figStyles.leg, { backgroundColor: tc.legColor }]} /></View>
        {selected && <View style={figStyles.ring} />}
        <Text style={figStyles.roleLabel} numberOfLines={1}>{worker?.name.en ?? candidate.type}</Text>
      </Animated.View>
    </Pressable>
  )
}
const figStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingBottom: 8, paddingTop: 28, paddingHorizontal: 4, position: 'relative' },
  bubble: { position: 'absolute', top: 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(28,38,52,0.88)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  bubbleName: { fontSize: 9, fontWeight: '800', color: '#fff' },
  tierEmoji: { position: 'absolute', top: 28, right: 2, fontSize: 11, zIndex: 3 },
  head: { width: 22, height: 22, borderRadius: 11, marginBottom: -2, zIndex: 2 },
  body: { width: 20, height: 30, borderRadius: 4, zIndex: 2 },
  legs: { flexDirection: 'row', gap: 3, marginTop: 1 },
  leg: { width: 8, height: 14, borderRadius: 3 },
  ring: { position: 'absolute', bottom: 6, width: 52, height: 14, borderRadius: 26, backgroundColor: 'rgba(242,193,46,0.35)' },
  roleLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 4, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
})

export default function BusinessScreen() {
  const { game, loaded, derived, completeContract, buyShipment, fulfillStandingOrder, claimHiddenEvent, hireCandidate, refreshRecruitmentPool } = useGame()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const [activeTab, setActiveTab] = useState<BizTab>('contracts')
  const [showCompleted, setShowCompleted] = useState(false)
  const [contractFilter, setContractFilter] = useState<ContractFilter>('all')
  const [selectedSlot, setSelectedSlot] = useState(0)

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const cap = getMaxHireCount(game.refineryLevel)
  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canRefresh = game.money >= refreshCost
  const refreshSecsLeft = Math.max(0, Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000))

  // Contracts
  const unlockedContracts = derived.activeContracts.filter((c) => c.isUnlocked)
  const allIncomplete = unlockedContracts.filter((c) => !c.isCompleted).sort((a, b) => b.unlockLevel - a.unlockLevel || b.id - a.id)
  const completedContracts = unlockedContracts.filter((c) => c.isCompleted)
  const readyCount = allIncomplete.filter((c) => { const { have, need } = getContractProgress(c, game); return have >= need }).length
  const incompleteContracts = useMemo(() => {
    const filtered = contractFilter === 'all' ? allIncomplete
      : contractFilter === 'ready' ? allIncomplete.filter((c) => { const { have, need } = getContractProgress(c, game); return have >= need })
      : contractFilter === 'gasoline' ? allIncomplete.filter((c) => (c.gasolineRequired ?? 0) > 0)
      : contractFilter === 'asphalt' ? allIncomplete.filter((c) => (c.asphaltRequired ?? 0) > 0)
      : contractFilter === 'jetFuel' ? allIncomplete.filter((c) => (c.jetFuelRequired ?? 0) > 0)
      : contractFilter === 'lubricants' ? allIncomplete.filter((c) => (c.lubricantsRequired ?? 0) > 0)
      : contractFilter === 'petrochemicals' ? allIncomplete.filter((c) => (c.petrochemicalsRequired ?? 0) > 0)
      : contractFilter === 'recycledMaterial' ? allIncomplete.filter((c) => (c.recycledMaterialRequired ?? 0) > 0)
      : allIncomplete.filter((c) => (c.plasticPelletsRequired ?? 0) > 0)
    return [...filtered].sort((a, b) => {
      const aR = getContractProgress(a, game).have >= getContractProgress(a, game).need ? 0 : 1
      const bR = getContractProgress(b, game).have >= getContractProgress(b, game).need ? 0 : 1
      return aR - bR || b.unlockLevel - a.unlockLevel || b.id - a.id
    })
  }, [allIncomplete, contractFilter, game])

  // Badges
  const standaloneReady = STANDING_ORDER_BALANCE.filter((order) => {
    if (game.refineryLevel < order.unlockLevel) return false
    const cooldownAt = game.standingOrderCooldowns[order.key]
    return !(cooldownAt !== undefined && cooldownAt > game.tickCount) && game.productInventory[order.productKey] >= order.required
  }).length

  const TABS: { key: BizTab; label: string; badge?: number }[] = [
    { key: 'contracts', label: 'Contracts', badge: readyCount || undefined },
    { key: 'supply',    label: 'Supply',    badge: standaloneReady || undefined },
    { key: 'recruit',   label: 'Recruit' },
  ]

  // Recruitment
  const selectedCandidate = game.recruitmentPool[selectedSlot]
  const selectedWorker = selectedCandidate ? WORKERS.find((w) => w.key === selectedCandidate.type) : null
  const selectedTc = selectedCandidate ? TIER_CONFIG[selectedCandidate.tier] : null
  const atCap = selectedCandidate ? game.workerCounts[selectedCandidate.type] >= cap : false
  const affordable = selectedCandidate ? game.money >= selectedCandidate.cost : false
  const canHire = affordable && !atCap
  const mentorBonus = selectedCandidate ? (game.mentorXpBonus?.[selectedCandidate.type] ?? 0) : 0

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Business</Text>
          <View style={styles.headerStats}>
            <View style={styles.hStat}><Text style={styles.hStatVal}>{Math.floor(game.researchPoints)}</Text><Text style={styles.hStatLabel}>🔬 RP</Text></View>
            <View style={styles.hStatDiv} />
            <View style={styles.hStat}><Text style={styles.hStatVal}>{Math.floor(game.reputation)}</Text><Text style={styles.hStatLabel}>⭐ Rep</Text></View>
            <View style={styles.hStatDiv} />
            <View style={styles.hStat}><Text style={styles.hStatVal}>{readyCount}</Text><Text style={styles.hStatLabel}>✓ Ready</Text></View>
          </View>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t.key} style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]} onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              {t.badge ? <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{t.badge}</Text></View> : null}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ══ CONTRACTS ══ */}
      {activeTab === 'contracts' && (
        <ScrollView contentContainerStyle={styles.list}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {([
              { key: 'all', label: 'All' },
              { key: 'ready', label: `✓ Ready${readyCount > 0 ? ` (${readyCount})` : ''}` },
              { key: 'gasoline', label: '⛽ Gas' },
              { key: 'asphalt', label: '🛣 Asphalt' },
              { key: 'jetFuel', label: '✈️ Jet' },
              { key: 'lubricants', label: '🔧 Lube' },
              { key: 'petrochemicals', label: '🧪 Petrochem' },
              { key: 'recycledMaterial', label: '♻️ Recycled' },
              { key: 'plasticPellets', label: '🔩 Pellets' },
            ] as const).map((f) => (
              <Pressable key={f.key} style={[styles.filterChip, contractFilter === f.key && styles.filterChipActive]} onPress={() => setContractFilter(f.key)}>
                <Text style={[styles.filterChipLabel, contractFilter === f.key && styles.filterChipLabelActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {HIDDEN_EVENTS.filter((e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked').map((event) => (
            <ListRow key={event.key} title="??? Mystery Contract" subtitle="Something unusual happened." badge="???" actionLabel="Reveal" onPress={() => claimHiddenEvent(event.key)} />
          ))}
          {incompleteContracts.map((contract) => {
            const { have, need, unit } = getContractProgress(contract, game)
            const ready = have >= need
            return (
              <ListRow key={contract.id} title={contract.name.en}
                subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward}RP, +${contract.currentReputationReward} rep`}
                actionLabel="Complete" disabled={!ready}
                badge={contract.unlockLevel === game.refineryLevel ? 'NEW' : ready ? '✓' : undefined}
                onPress={() => completeContract(contract)} />
            )
          })}
          {incompleteContracts.length === 0 && <Text style={styles.empty}>{contractFilter === 'all' ? 'No open contracts — keep producing!' : 'No contracts match this filter.'}</Text>}
          {completedContracts.length > 0 && (
            <Pressable style={styles.completedToggle} onPress={() => setShowCompleted((v) => !v)}>
              <Text style={styles.completedToggleLabel}>{showCompleted ? '▾' : '▸'} Completed ({completedContracts.length})</Text>
            </Pressable>
          )}
          {showCompleted && completedContracts.map((contract) => {
            const { have, need, unit } = getContractProgress(contract, game)
            return <ListRow key={contract.id} title={contract.name.en} subtitle={`${have}/${need} ${unit}`} actionLabel="Complete" done onPress={() => completeContract(contract)} />
          })}
        </ScrollView>
      )}

      {/* ══ SUPPLY ══ */}
      {activeTab === 'supply' && (
        <ScrollView contentContainerStyle={styles.list}>
          {game.pendingShipments.length > 0 && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>📦 Incoming Shipments</Text>
              {game.pendingShipments.map((s) => {
                // arrivesAt is a tickCount now; 5 ticks/sec at 200ms.
                const secsLeft = Math.max(0, Math.ceil((s.arrivesAt - game.tickCount) / 5))
                return <Text key={s.id} style={styles.pendingRow}>{s.amount} crude · arrives in {secsLeft}s</Text>
              })}
            </View>
          )}
          <Text style={styles.sectionLabel}>Order Crude</Text>
          {SHIPMENT_BALANCE.map((option) => (
            <ListRow key={option.key} title={`${text.shipments.names[option.key].en} · +${option.amount} crude`}
              subtitle={`$${option.cost.toLocaleString()} · arrives in ${option.delayMs / 1000}s`}
              actionLabel="Order" disabled={game.money < option.cost} onPress={() => buyShipment(option)} />
          ))}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Standing Orders</Text>
          {STANDING_ORDER_BALANCE.filter((o) => game.refineryLevel >= o.unlockLevel).map((order) => {
            const cooldownAt = game.standingOrderCooldowns[order.key]
            const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
            const ticksLeft = onCooldown ? cooldownAt! - game.tickCount : 0
            const have = game.productInventory[order.productKey]
            const ready = have >= order.required && !onCooldown
            const orderText = text.standingOrders.orders[order.key]
            return (
              <ListRow key={order.key} title={orderText.name.en}
                subtitle={onCooldown ? `On cooldown · ${Math.ceil((ticksLeft * 200) / 1000)}s left` : `${have}/${order.required} ${order.productKey} · +$${order.reward.toLocaleString()}, +${order.rpReward}RP`}
                actionLabel="Fulfill" disabled={!ready} onPress={() => fulfillStandingOrder(order.key)} />
            )
          })}
        </ScrollView>
      )}

      {/* ══ RECRUIT ══ */}
      {activeTab === 'recruit' && (
        <>
          {/* Scene */}
          <View style={styles.scene}>
            <View style={styles.sceneBuildingLarge} />
            <View style={styles.sceneBuildingSmall} />
            <View style={styles.sceneSign}><Text style={styles.sceneSignText}>Hiring Office</Text></View>
            <View style={styles.candidatesStage}>
              {HIDDEN_EVENTS.filter((e) => e.reward.kind === 'staff' && game.hiddenEventStatus[e.key] === 'unlocked').slice(0, 1).map((event) => (
                <Pressable key={event.key} style={figStyles.wrap} onPress={() => claimHiddenEvent(event.key)}>
                  <View style={[figStyles.bubble, { backgroundColor: 'rgba(232,131,58,0.9)' }]}><Text style={figStyles.bubbleName}>???</Text></View>
                  <View style={{ width: 20, height: 50, backgroundColor: '#333', borderRadius: 4, opacity: 0.6 }} />
                  <View style={figStyles.legs}><View style={[figStyles.leg, { backgroundColor: '#444' }]} /><View style={[figStyles.leg, { backgroundColor: '#444' }]} /></View>
                  <Text style={[figStyles.roleLabel, { color: colors.orange }]}>Mystery!</Text>
                </Pressable>
              ))}
              {game.recruitmentPool.map((candidate, slotIndex) => (
                <CandidateFigure key={candidate.id} candidate={candidate} selected={selectedSlot === slotIndex} onPress={() => setSelectedSlot(slotIndex)} />
              ))}
            </View>
          </View>

          {/* Info panel */}
          {selectedCandidate && selectedTc && (
            <View style={[styles.infoPanel, { borderTopColor: selectedTc.borderColor }]}>
              <View style={styles.infoTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoName}>{selectedCandidate.name}</Text>
                  <Text style={styles.infoRole}>{selectedWorker?.name.en ?? selectedCandidate.type}{selectedCandidate.isVeteran ? ' · ⭐ Veteran +20%' : ''}</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: selectedTc.borderColor }]}>
                  <Text style={styles.tierBadgeText}>{selectedTc.label}</Text>
                </View>
              </View>
              <View style={styles.infoStats}>
                <View style={styles.iStat}><Text style={styles.iStatVal}>Lv{selectedCandidate.startingLevel}</Text><Text style={styles.iStatLabel}>Starts</Text></View>
                <View style={styles.iStatDiv} />
                <View style={styles.iStat}><Text style={styles.iStatVal}>{game.workerCounts[selectedCandidate.type]}/{cap}</Text><Text style={styles.iStatLabel}>Hired</Text></View>
                {mentorBonus > 0 && (<><View style={styles.iStatDiv} /><View style={styles.iStat}><Text style={[styles.iStatVal, { color: colors.green }]}>+{mentorBonus}</Text><Text style={styles.iStatLabel}>Mentor XP</Text></View></>)}
              </View>
              <AnimatedPressable
                disabled={!canHire}
                onPress={() => { if (canHire) { spawnFloat(`-$${selectedCandidate.cost.toLocaleString()}`, 'expense'); haptics.confirm() }; hireCandidate(selectedSlot); setSelectedSlot(0) }}
                style={[styles.hireBtn, canHire ? styles.hireBtnActive : styles.hireBtnOff]}
              >
                <Text style={styles.hireBtnLabel}>
                  {atCap ? `Full — ${cap} max` : !affordable ? `Need $${selectedCandidate.cost.toLocaleString()}` : `Hire ${selectedCandidate.name} — $${selectedCandidate.cost.toLocaleString()}`}
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Refresh bar */}
          <View style={styles.refreshBar}>
            <Text style={styles.refreshTimer}>{refreshSecsLeft > 0 ? `New candidates in ${Math.ceil(refreshSecsLeft / 60)}m` : 'Candidates ready'}</Text>
            <AnimatedPressable disabled={!canRefresh} onPress={() => { if (canRefresh) { spawnFloat(`-$${refreshCost.toLocaleString()}`, 'expense'); haptics.tap() }; refreshRecruitmentPool(); setSelectedSlot(0) }}
              style={[styles.refreshBtn, canRefresh ? styles.refreshBtnActive : styles.refreshBtnOff]}>
              <Text style={styles.refreshBtnLabel}>🔄 Refresh ${refreshCost.toLocaleString()}</Text>
            </AnimatedPressable>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1C2634', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  headerStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radii.sm, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center' },
  hStat: { alignItems: 'center', paddingHorizontal: 8 },
  hStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  hStatLabel: { fontSize: 8, color: '#6B8099' },
  hStatDiv: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.pill, padding: 3, gap: 2, marginBottom: spacing.xs },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: radii.pill, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#6B8099' },
  tabLabelActive: { color: '#1C2634' },
  tabBadge: { backgroundColor: colors.orange, borderRadius: radii.pill, minWidth: 16, height: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  filterBar: { marginBottom: spacing.xs },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.creamBorder, backgroundColor: colors.white, marginRight: 6 },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted },
  filterChipLabelActive: { color: '#fff' },
  empty: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: spacing.sm },
  completedToggle: { paddingVertical: spacing.sm },
  completedToggleLabel: { fontSize: 13, fontWeight: '700', color: colors.inkMuted },
  pendingBox: { backgroundColor: '#EBF4FF', borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.blue, padding: spacing.sm, marginBottom: spacing.sm, gap: 4 },
  pendingTitle: { fontSize: 12, fontWeight: '800', color: colors.blueDark },
  pendingRow: { fontSize: 12, color: colors.blue },
  scene: { height: 200, backgroundColor: '#4A7A9A', position: 'relative', overflow: 'hidden', flexShrink: 0 },
  sceneBuildingLarge: { position: 'absolute', right: 16, bottom: 0, width: 80, height: 110, backgroundColor: '#7A8A70', borderRadius: 4, opacity: 0.5 },
  sceneBuildingSmall: { position: 'absolute', right: 90, bottom: 0, width: 50, height: 70, backgroundColor: '#6A7A60', borderRadius: 4, opacity: 0.4 },
  sceneSign: { position: 'absolute', top: '45%', left: 14, backgroundColor: colors.cream, borderRadius: 6, borderWidth: 2, borderColor: '#8A7A5A', paddingHorizontal: 8, paddingVertical: 3 },
  sceneSignText: { fontSize: 9, fontWeight: '800', color: colors.ink },
  candidatesStage: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 20, paddingHorizontal: 20 },
  infoPanel: { backgroundColor: '#1C2634', borderTopWidth: 2, padding: spacing.md, paddingBottom: spacing.sm, flexShrink: 0 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  infoName: { fontSize: 17, fontWeight: '900', color: '#fff' },
  infoRole: { fontSize: 11, color: '#6B8099', marginTop: 2 },
  tierBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.sm },
  iStat: { flex: 1, alignItems: 'center' },
  iStatVal: { fontSize: 16, fontWeight: '900', color: '#fff' },
  iStatLabel: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.5 },
  iStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  hireBtn: { borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  hireBtnActive: { backgroundColor: colors.green },
  hireBtnOff: { backgroundColor: '#2E3D50' },
  hireBtnLabel: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  refreshBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141E2A', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: '#2E3D50', flexShrink: 0 },
  refreshTimer: { fontSize: 11, color: '#4A5A6A' },
  refreshBtn: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  refreshBtnActive: { backgroundColor: '#2E3D50' },
  refreshBtnOff: { backgroundColor: '#1A2530' },
  refreshBtnLabel: { fontSize: 11, fontWeight: '700', color: '#8A9BB0' },
})
