import { useState, useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { PERKS } from '../../../src/game/data/perks'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'

type BusinessTab = 'contracts' | 'research' | 'supply' | 'perks'

type ContractFilter = 'all' | 'ready' | 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

export default function BusinessScreen() {
  const {
    game, loaded, derived,
    unlockResearch, installPerk,
    completeContract, buyShipment,
    fulfillStandingOrder, claimHiddenEvent,
  } = useGame()

  const [activeTab, setActiveTab] = useState<BusinessTab>('contracts')
  const [showCompletedContracts, setShowCompletedContracts] = useState(false)
  const [contractFilter, setContractFilter] = useState<ContractFilter>('all')

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  // ── Contract data ──
  const unlockedContracts = derived.activeContracts.filter((c) => c.isUnlocked)
  const allIncomplete = unlockedContracts
    .filter((c) => !c.isCompleted)
    .sort((a, b) => b.unlockLevel - a.unlockLevel || b.id - a.id)
  const completedContracts = unlockedContracts.filter((c) => c.isCompleted)
  const readyCount = allIncomplete.filter((c) => {
    const { have, need } = getContractProgress(c, game)
    return have >= need
  }).length

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

  // ── Tab badge counts ──
  const researchUnlockable = derived.activeResearchItems.filter(
    (i) => !i.isUnlocked && i.isVisible && game.researchPoints >= i.cost
  ).length
  const standaloneReady = STANDING_ORDER_BALANCE.filter((order) => {
    if (game.refineryLevel < order.unlockLevel) return false
    const cooldownAt = game.standingOrderCooldowns[order.key]
    const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
    return !onCooldown && game.productInventory[order.productKey] >= order.required
  }).length

  // ── Tab config ──
  const TABS: { key: BusinessTab; label: string; badge?: number }[] = [
    { key: 'contracts', label: 'Contracts', badge: readyCount || undefined },
    { key: 'research',  label: 'Research',  badge: researchUnlockable || undefined },
    { key: 'supply',    label: 'Supply',    badge: standaloneReady || undefined },
    { key: 'perks',     label: 'Perks' },
  ]

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Dark header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Business</Text>
          <View style={styles.headerStats}>
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>{Math.floor(game.researchPoints)}</Text>
              <Text style={styles.hStatLabel}>🔬 RP</Text>
            </View>
            <View style={styles.hStatDiv} />
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>{game.upgradePoints}</Text>
              <Text style={styles.hStatLabel}>⚙️ Pts</Text>
            </View>
            <View style={styles.hStatDiv} />
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>{Math.floor(game.reputation)}</Text>
              <Text style={styles.hStatLabel}>⭐ Rep</Text>
            </View>
          </View>
        </View>

        {/* 4-tab toggle */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {t.badge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{t.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          CONTRACTS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'contracts' && (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {([
              { key: 'all',              label: 'All' },
              { key: 'ready',            label: `✓ Ready${readyCount > 0 ? ` (${readyCount})` : ''}` },
              { key: 'gasoline',         label: '⛽ Gas' },
              { key: 'asphalt',          label: '🛣 Asphalt' },
              { key: 'jetFuel',          label: '✈️ Jet' },
              { key: 'lubricants',       label: '🔧 Lube' },
              { key: 'petrochemicals',   label: '🧪 Petrochem' },
              { key: 'recycledMaterial', label: '♻️ Recycled' },
              { key: 'plasticPellets',   label: '🔩 Pellets' },
            ] as const).map((f) => (
              <Pressable
                key={f.key}
                style={[styles.filterChip, contractFilter === f.key && styles.filterChipActive]}
                onPress={() => setContractFilter(f.key)}
              >
                <Text style={[styles.filterChipLabel, contractFilter === f.key && styles.filterChipLabelActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Mystery contracts */}
          {HIDDEN_EVENTS.filter(
            (e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked',
          ).map((event) => (
            <ListRow
              key={event.key}
              title="??? Mystery Contract"
              subtitle="Something unusual happened. Tap to find out what."
              badge="???"
              actionLabel="Reveal"
              onPress={() => claimHiddenEvent(event.key)}
            />
          ))}

          {/* Contract list */}
          {incompleteContracts.map((contract) => {
            const { have, need, unit } = getContractProgress(contract, game)
            const ready = have >= need
            const isNew = contract.unlockLevel === game.refineryLevel
            return (
              <ListRow
                key={contract.id}
                title={contract.name.en}
                subtitle={`${have}/${need} ${unit} · +$${contract.currentReward.toLocaleString()}, +${contract.currentRpReward}RP, +${contract.currentReputationReward} rep`}
                actionLabel="Complete"
                disabled={!ready}
                badge={isNew ? 'NEW' : ready ? '✓' : undefined}
                onPress={() => completeContract(contract)}
              />
            )
          })}
          {incompleteContracts.length === 0 && (
            <Text style={styles.empty}>
              {contractFilter === 'all' ? 'No open contracts — keep producing!' : 'No contracts match this filter.'}
            </Text>
          )}

          {/* Completed toggle */}
          {completedContracts.length > 0 && (
            <Pressable style={styles.completedToggle} onPress={() => setShowCompletedContracts((v) => !v)}>
              <Text style={styles.completedToggleLabel}>
                {showCompletedContracts ? '▾' : '▸'} Completed ({completedContracts.length})
              </Text>
            </Pressable>
          )}
          {showCompletedContracts && completedContracts.map((contract) => {
            const { have, need, unit } = getContractProgress(contract, game)
            return (
              <ListRow
                key={contract.id}
                title={contract.name.en}
                subtitle={`${have}/${need} ${unit}`}
                actionLabel="Complete"
                done
                onPress={() => completeContract(contract)}
              />
            )
          })}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════
          RESEARCH TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'research' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionNote}>
            Spend Research Points (RP) to unlock production upgrades.
            You have {Math.floor(game.researchPoints)} RP.
          </Text>
          {derived.activeResearchItems.map((item) => (
            <ListRow
              key={item.key}
              title={item.name.en}
              subtitle={
                item.isUnlocked
                  ? item.description.en
                  : item.prerequisiteName
                    ? `Requires ${item.prerequisiteName.en} · ${item.cost} RP`
                    : `${item.description.en} · ${item.cost} RP`
              }
              actionLabel="Unlock"
              disabled={!item.isVisible || game.researchPoints < item.cost}
              done={item.isUnlocked}
              onPress={() => unlockResearch(item)}
            />
          ))}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════
          SUPPLY TAB (Crude shipments + Standing orders)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'supply' && (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Pending shipments */}
          {game.pendingShipments.length > 0 && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>📦 Incoming Shipments</Text>
              {game.pendingShipments.map((shipment) => {
                const secondsLeft = Math.max(0, Math.ceil((shipment.arrivesAt - Date.now()) / 1000))
                return (
                  <Text key={shipment.id} style={styles.pendingRow}>
                    {shipment.amount} crude · arrives in {secondsLeft}s
                  </Text>
                )
              })}
            </View>
          )}

          <Text style={styles.sectionLabel}>Order Crude</Text>
          {SHIPMENT_BALANCE.map((option) => (
            <ListRow
              key={option.key}
              title={`${text.shipments.names[option.key].en} · +${option.amount} crude`}
              subtitle={`$${option.cost.toLocaleString()} · arrives in ${option.delayMs / 1000}s`}
              actionLabel="Order"
              disabled={game.money < option.cost}
              onPress={() => buyShipment(option)}
            />
          ))}

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Standing Orders</Text>
          {STANDING_ORDER_BALANCE.filter((order) => game.refineryLevel >= order.unlockLevel).map((order) => {
            const cooldownAt = game.standingOrderCooldowns[order.key]
            const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
            const ticksLeft = onCooldown ? cooldownAt! - game.tickCount : 0
            const have = game.productInventory[order.productKey]
            const ready = have >= order.required && !onCooldown
            const orderText = text.standingOrders.orders[order.key]
            return (
              <ListRow
                key={order.key}
                title={orderText.name.en}
                subtitle={
                  onCooldown
                    ? `On cooldown · ${Math.ceil((ticksLeft * 200) / 1000)}s left`
                    : `${have}/${order.required} ${order.productKey} · +$${order.reward.toLocaleString()}, +${order.rpReward}RP, +${order.reputationReward} rep`
                }
                actionLabel="Fulfill"
                disabled={!ready}
                onPress={() => fulfillStandingOrder(order.key)}
              />
            )
          })}
          {STANDING_ORDER_BALANCE.filter((o) => game.refineryLevel < o.unlockLevel).length > 0 && (
            <Text style={styles.empty}>
              {STANDING_ORDER_BALANCE.filter((o) => game.refineryLevel < o.unlockLevel).length} more orders unlock as you level up.
            </Text>
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════
          PERKS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'perks' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionNote}>
            Spend Upgrade Points to install permanent refinery perks.
            You have {game.upgradePoints} pts.
          </Text>
          {['efficiency', 'market', 'safety'].map((branch) => (
            <View key={branch} style={styles.perkBranch}>
              <Text style={styles.perkBranchLabel}>{branch.charAt(0).toUpperCase() + branch.slice(1)}</Text>
              {PERKS.filter((p) => p.branch === branch).map((perk) => {
                const unlocked = game.unlockedPerks.includes(perk.key)
                const prereqMet = !perk.prerequisite || game.unlockedPerks.includes(perk.prerequisite)
                return (
                  <ListRow
                    key={perk.key}
                    title={`${perk.name.en} · Tier ${perk.tier}`}
                    subtitle={
                      unlocked
                        ? perk.description.en
                        : !prereqMet
                          ? 'Requires previous tier'
                          : `${perk.description.en} · ${perk.cost} pt${perk.cost > 1 ? 's' : ''}`
                    }
                    actionLabel="Unlock"
                    disabled={!prereqMet || game.upgradePoints < perk.cost}
                    done={unlocked}
                    onPress={() => installPerk(perk)}
                  />
                )
              })}
            </View>
          ))}
        </ScrollView>
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: '#1C2634',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  hStat: { alignItems: 'center', paddingHorizontal: 8 },
  hStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  hStatLabel: { fontSize: 8, color: '#6B8099' },
  hStatDiv: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.08)' },

  // 4-tab toggle
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
    marginBottom: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radii.pill,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#6B8099' },
  tabLabelActive: { color: '#1C2634' },
  tabBadge: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },

  // Content
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: colors.inkMuted,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
  },
  sectionNote: {
    fontSize: 12, color: colors.inkMuted,
    backgroundColor: colors.white,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.creamBorder,
    padding: spacing.sm,
    lineHeight: 18,
  },

  // Filter chips
  filterBar: { marginBottom: spacing.xs },
  filterChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.pill, borderWidth: 1.5,
    borderColor: colors.creamBorder, backgroundColor: colors.white,
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted },
  filterChipLabelActive: { color: '#fff' },

  // Empty + completed
  empty: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: spacing.sm },
  completedToggle: { paddingVertical: spacing.sm },
  completedToggleLabel: { fontSize: 13, fontWeight: '700', color: colors.inkMuted },

  // Pending shipments
  pendingBox: {
    backgroundColor: '#EBF4FF',
    borderRadius: radii.md, borderWidth: 1.5,
    borderColor: colors.blue,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 4,
  },
  pendingTitle: { fontSize: 12, fontWeight: '800', color: colors.blueDark },
  pendingRow:   { fontSize: 12, color: colors.blue },

  // Perk branches
  perkBranch: { marginBottom: spacing.sm },
  perkBranchLabel: {
    fontSize: 11, fontWeight: '900', color: colors.inkMuted,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
  },
})
