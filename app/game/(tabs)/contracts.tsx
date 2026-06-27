import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'
import type { ActiveContract } from '../../../src/game/types'

// Product group config
type ProductKey = 'gasoline' | 'asphalt' | 'jetFuel' | 'lubricants' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'

const PRODUCT_GROUPS: { key: ProductKey; icon: string; field: keyof ActiveContract }[] = [
  { key: 'gasoline',         icon: 'gasoline',        field: 'gasolineRequired' },
  { key: 'asphalt',          icon: 'asphalt',         field: 'asphaltRequired' },
  { key: 'jetFuel',          icon: 'jetFuel',         field: 'jetFuelRequired' },
  { key: 'lubricants',       icon: 'lubricants',      field: 'lubricantsRequired' },
  { key: 'petrochemicals',   icon: 'petrochemicals',  field: 'petrochemicalsRequired' },
  { key: 'recycledMaterial', icon: 'recycledMaterial',field: 'recycledMaterialRequired' },
  { key: 'plasticPellets',   icon: 'plasticPellets',  field: 'plasticPelletsRequired' },
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
  const { t } = useLang()
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <View style={sectionStyles.wrap}>
      <Pressable style={sectionStyles.header} onPress={() => setOpen((v) => !v)}>
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.right}>
          {readyCount !== undefined && readyCount > 0 && (
            <View style={sectionStyles.readyBadge}>
              <Text style={sectionStyles.readyBadgeText}>{t(text.contracts.screen.ready(readyCount))}</Text>
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
  const { game, loaded, derived, completeContract, claimHiddenEvent, autoTrade } = useGame()
  const { t } = useLang()
  const sc = text.contracts.screen

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
        <Text style={styles.title}>{t(sc.title)}</Text>
        {totalReady > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{t(sc.ready(totalReady))}</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {/* Mystery contracts */}
        {HIDDEN_EVENTS.filter((e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked').map((event) => (
          <ListRow key={event.key} title={t(sc.mysteryTitle)} subtitle={t(sc.mysterySubtitle)} badge="???" actionLabel={t(sc.reveal)} onPress={() => claimHiddenEvent(event.key)} />
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
              title={t(sc.groups[group.key])}
              count={groupContracts.length}
              readyCount={readyInGroup}
              defaultOpen={readyInGroup > 0}
            >
              {(() => {
                // Show only the current active tier per product group.
                // Find the lowest tier that still has open (not completed) contracts.
                const activeTier = openContracts.length > 0
                  ? Math.min(...openContracts.map((c) => c.tier))
                  : null
                const visibleContracts = activeTier !== null
                  ? openContracts.filter((c) => c.tier === activeTier)
                  : []
                const hiddenCount = openContracts.length - visibleContracts.length
                // Sort by ID only (stable) — never re-sort by ready state
                // to avoid cards jumping around as inventory fluctuates
                const sortedVisible = [...visibleContracts].sort((a, b) => a.id - b.id)
                return (
                  <SubSection label={t(sc.activeTier(activeTier ?? 1))} count={visibleContracts.length} defaultOpen>
                    {sortedVisible.map((contract) => {
                      const { have, need, unit } = getContractProgress(contract, game)
                      const ready = have >= need
                      const showAutoTradeHint = !ready && have > 0 && autoTrade.enabled
                      return (
                        <View key={contract.id}>
                          <ListRow
                            title={t(contract.name)}
                            subtitle={have + "/" + need + " " + unit + " +$" + contract.currentReward.toLocaleString() + " +" + contract.currentRpReward + "RP"}
                            actionLabel={t(sc.complete)}
                            disabled={!ready}
                            badge={ready ? t(sc.ok) : contract.unlockLevel === game.refineryLevel ? t(sc.newBadge) : undefined}
                            onPress={() => { if (ready) completeContract(contract) }}
                          />
                          {showAutoTradeHint && (
                            <Text style={styles.autoTradeHint}>
                              {t(sc.autoTradeHint)}
                            </Text>
                          )}
                        </View>
                      )
                    })}
                    {hiddenCount > 0 && (
                      <Text style={styles.lockedHint}>
                        {t(sc.higherTierHint(hiddenCount))}
                      </Text>
                    )}
                  </SubSection>
                )
              })()}

              <SubSection label={t(sc.completed)} count={completedContracts.length} defaultOpen={false}>
                {completedContracts.map((contract) => {
                  const { have, need, unit } = getContractProgress(contract, game)
                  return (
                    <ListRow
                      key={contract.id}
                      title={t(contract.name)}
                      subtitle={have + "/" + need + " " + unit}
                      actionLabel={t(sc.done)}
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
  autoTradeHint: {
    fontSize: 10,
    color: colors.orange,
    fontStyle: 'italic',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    marginTop: -2,
  },
  lockedHint: {
    fontSize: 10,
    color: colors.inkMuted,
    fontStyle: 'italic',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
})
