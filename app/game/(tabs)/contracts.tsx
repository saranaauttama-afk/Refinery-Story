import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress } from '../../../src/game/utils/gameCalculations'
import type { ActiveContract } from '../../../src/game/types'

// Product group config
type ProductKey = 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

const PRODUCT_GROUPS: { key: ProductKey; label: string; icon: string; field: keyof ActiveContract }[] = [
  { key: 'gasoline',         label: 'Gasoline',         icon: 'gasoline',        field: 'gasolineRequired' },
  { key: 'asphalt',          label: 'Asphalt',          icon: 'asphalt',         field: 'asphaltRequired' },
  { key: 'jetFuel',          label: 'Jet Fuel',         icon: 'jetFuel',         field: 'jetFuelRequired' },
  { key: 'lubricants',       label: 'Lubricants',       icon: 'lubricants',      field: 'lubricantsRequired' },
  { key: 'petrochemicals',   label: 'Petrochemicals',   icon: 'petrochemicals',  field: 'petrochemicalsRequired' },
  { key: 'recycledMaterial', label: 'Recycled Material',icon: 'recycledMaterial',field: 'recycledMaterialRequired' },
  { key: 'plasticPellets',   label: 'Plastic Pellets',  icon: 'plasticPellets',  field: 'plasticPelletsRequired' },
]

const PRODUCT_EMOJI: Record<ProductKey, string> = {
  gasoline: 'gasoline', asphalt: 'road', jetFuel: 'jet',
  lubricants: 'lube', petrochemicals: 'petrochem',
  recycledMaterial: 'recycled', plasticPellets: 'pellets',
}

// Collapsible section component
function Section({
  title,
  count,
  readyCount,
  defaultOpen = true,
  children,
}: {
  title: string
  count: number
  readyCount?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <View style={sectionStyles.wrap}>
      <Pressable style={sectionStyles.header} onPress={() => setOpen((v) => !v)}>
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.right}>
          {readyCount !== undefined && readyCount > 0 && (
            <View style={sectionStyles.readyBadge}>
              <Text style={sectionStyles.readyBadgeText}>{readyCount} ready</Text>
            </View>
          )}
          <Text style={sectionStyles.count}>{count}</Text>
          <Text style={sectionStyles.chevron}>{open ? 'v' : '>'}</Text>
        </View>
      </Pressable>
      {open && <View style={sectionStyles.body}>{children}</View>}
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C2634', borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  title: { fontSize: 13, fontWeight: '800', color: '#fff', flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readyBadge: { backgroundColor: colors.green, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  readyBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  count: { fontSize: 12, color: '#6B8099', fontWeight: '700' },
  chevron: { fontSize: 12, color: '#6B8099', width: 12, textAlign: 'center' },
  body: { marginTop: 4, gap: 4 },
})

// Sub-section: open/completed toggle
function SubSection({
  label,
  count,
  defaultOpen = true,
  children,
}: {
  label: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <View>
      <Pressable style={subStyles.header} onPress={() => setOpen((v) => !v)}>
        <Text style={subStyles.label}>{label} ({count})</Text>
        <Text style={subStyles.chevron}>{open ? 'v' : '>'}</Text>
      </Pressable>
      {open && children}
    </View>
  )
}

const subStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: spacing.xs },
  label: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1 },
  chevron: { fontSize: 11, color: colors.inkMuted },
})

export default function ContractsScreen() {
  const router = useRouter()
  const { game, loaded, derived, completeContract, claimHiddenEvent } = useGame()

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const unlockedContracts = derived.activeContracts.filter((c) => c.isUnlocked)
  const totalReady = unlockedContracts.filter((c) => {
    if (c.isCompleted) return false
    const { have, need } = getContractProgress(c, game)
    return have >= need
  }).length

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>X</Text>
        </Pressable>
        <Text style={styles.title}>Contracts</Text>
        {totalReady > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{totalReady} ready</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {/* Mystery contracts */}
        {HIDDEN_EVENTS.filter((e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked').map((event) => (
          <ListRow key={event.key} title="??? Mystery Contract" subtitle="Something unusual happened." badge="???" actionLabel="Reveal" onPress={() => claimHiddenEvent(event.key)} />
        ))}

        {/* Product groups */}
        {PRODUCT_GROUPS.map((group) => {
          const groupContracts = unlockedContracts.filter((c) => (c[group.field] as number ?? 0) > 0)
          if (groupContracts.length === 0) return null

          const openContracts = groupContracts.filter((c) => !c.isCompleted)
          const completedContracts = groupContracts.filter((c) => c.isCompleted)
          const readyInGroup = openContracts.filter((c) => {
            const { have, need } = getContractProgress(c, game)
            return have >= need
          }).length

          return (
            <Section
              key={group.key}
              title={group.label}
              count={groupContracts.length}
              readyCount={readyInGroup}
              defaultOpen={readyInGroup > 0}
            >
              <SubSection label="Open" count={openContracts.length} defaultOpen>
                {openContracts
                  .sort((a, b) => {
                    const aR = getContractProgress(a, game).have >= getContractProgress(a, game).need ? 0 : 1
                    const bR = getContractProgress(b, game).have >= getContractProgress(b, game).need ? 0 : 1
                    return aR - bR || b.unlockLevel - a.unlockLevel
                  })
                  .map((contract) => {
                    const { have, need, unit } = getContractProgress(contract, game)
                    const ready = have >= need
                    return (
                      <ListRow
                        key={contract.id}
                        title={contract.name.en}
                        subtitle={have + "/" + need + " " + unit + " +$" + contract.currentReward.toLocaleString() + " +" + contract.currentRpReward + "RP"}
                        actionLabel="Complete"
                        disabled={!ready}
                        badge={contract.unlockLevel === game.refineryLevel ? 'NEW' : ready ? 'OK' : undefined}
                        onPress={() => { if (ready) completeContract(contract) }}
                      />
                    )
                  })}
              </SubSection>

              <SubSection label="Completed" count={completedContracts.length} defaultOpen={false}>
                {completedContracts.map((contract) => {
                  const { have, need, unit } = getContractProgress(contract, game)
                  return (
                    <ListRow
                      key={contract.id}
                      title={contract.name.en}
                      subtitle={have + "/" + need + " " + unit}
                      actionLabel="Done"
                      done
                      onPress={() => {}}
                    />
                  )
                })}
              </SubSection>
            </Section>
          )
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
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: '#fff' },
  badge: { backgroundColor: colors.green, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
})
