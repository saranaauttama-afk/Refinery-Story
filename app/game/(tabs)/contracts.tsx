import { useState, useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress } from '../../../src/game/utils/gameCalculations'

type ContractFilter = 'all' | 'ready' | 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

export default function ContractsScreen() {
  const router = useRouter()
  const { game, loaded, derived, completeContract, claimHiddenEvent } = useGame()
  const [showCompleted, setShowCompleted] = useState(false)
  const [contractFilter, setContractFilter] = useState<ContractFilter>('all')

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Contracts</Text>
        {readyCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{readyCount} ready</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {([
            { key: 'all', label: 'All' },
            { key: 'ready', label: readyCount > 0 ? "Ready (" + readyCount + ")" : "Ready" },
            { key: 'gasoline', label: 'Gas' },
            { key: 'asphalt', label: 'Asphalt' },
            { key: 'jetFuel', label: 'Jet' },
            { key: 'lubricants', label: 'Lube' },
            { key: 'petrochemicals', label: 'Petrochem' },
            { key: 'recycledMaterial', label: 'Recycled' },
            { key: 'plasticPellets', label: 'Pellets' },
          ] as { key: ContractFilter; label: string }[]).map((f) => (
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
              subtitle={have + "/" + need + " " + unit + " · +$" + contract.currentReward.toLocaleString() + ", +" + contract.currentRpReward + "RP"}
              actionLabel="Complete" disabled={!ready}
              badge={contract.unlockLevel === game.refineryLevel ? 'NEW' : ready ? 'OK' : undefined}
              onPress={() => completeContract(contract)} />
          )
        })}
        {incompleteContracts.length === 0 && (
          <Text style={styles.empty}>{contractFilter === 'all' ? 'No open contracts — keep producing!' : 'No contracts match this filter.'}</Text>
        )}
        {completedContracts.length > 0 && (
          <Pressable style={styles.completedToggle} onPress={() => setShowCompleted((v) => !v)}>
            <Text style={styles.completedToggleLabel}>{showCompleted ? 'v' : '>'} Completed ({completedContracts.length})</Text>
          </Pressable>
        )}
        {showCompleted && completedContracts.map((contract) => {
          const { have, need, unit } = getContractProgress(contract, game)
          return <ListRow key={contract.id} title={contract.name.en} subtitle={have + "/" + need + " " + unit} actionLabel="Complete" done onPress={() => completeContract(contract)} />
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#1C2634', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: '#fff' },
  badge: { backgroundColor: colors.green, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  filterBar: { marginBottom: spacing.xs },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.creamBorder, backgroundColor: colors.white, marginRight: 6 },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipLabel: { fontSize: 11, fontWeight: '700', color: colors.inkMuted },
  filterChipLabelActive: { color: '#fff' },
  empty: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: spacing.sm },
  completedToggle: { paddingVertical: spacing.sm },
  completedToggleLabel: { fontSize: 13, fontWeight: '700', color: colors.inkMuted },
})
