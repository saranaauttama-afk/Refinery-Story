import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ArtSlot from '../../../src/components/ArtSlot'
import GameIcon from '../../../src/components/GameIcon'
import ListRow from '../../../src/components/ListRow'
import ScreenHeader from '../../../src/components/ScreenHeader'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress, TICK_MS } from '../../../src/game/utils/gameCalculations'
import { getRotatingContractHave } from '../../../src/game/data/rotatingContracts'
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
  iconName,
  count,
  readyCount,
  defaultOpen = true,
  children,
}: {
  title: string
  iconName?: string
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
        {iconName ? <View style={sectionStyles.titleIcon}><GameIcon name={iconName} size={22} /></View> : null}
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
    backgroundColor: '#243348', borderRadius: 12,
    borderTopWidth: 2, borderTopColor: '#33496A',
    borderBottomWidth: 3, borderBottomColor: '#101823',
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  titleIcon: { marginRight: 8 },
  title: { fontSize: 14, fontFamily: fonts.heading, color: '#fff', flex: 1, letterSpacing: 0.3 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readyBadge: { backgroundColor: colors.green, borderRadius: radii.pill, borderBottomWidth: 2, borderBottomColor: colors.greenDark, paddingHorizontal: 8, paddingVertical: 3 },
  readyBadgeText: { fontSize: 10, fontFamily: fonts.heading, color: '#fff' },
  count: { fontSize: 12, color: '#8CA3BE', fontFamily: fonts.heading },
  chevron: { fontSize: 12, color: '#8CA3BE', width: 12, textAlign: 'center' },
  body: { marginTop: 6, gap: 4 },
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
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  chevron: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
})

// Rich "game panel" contract card — cream beveled tile with a framed product
// thumbnail, a progress bar, coin/RP rewards, and a chunky COMPLETE button.
// Reads like a console game order, not a plain list row.
function ContractCard({
  productKey, title, have, need, unit, reward, rp, ready, done, badge, hint, onComplete,
}: {
  productKey: string
  title: string
  have: number
  need: number
  unit: string
  reward: number
  rp: number
  ready: boolean
  done?: boolean
  badge?: string
  hint?: string
  onComplete: () => void
}) {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0
  return (
    <View style={[cardStyles.card, done && cardStyles.cardDone]}>
      <View style={cardStyles.row}>
        <View style={cardStyles.thumb}>
          <GameIcon name={`product-${productKey}`} size={38} />
        </View>
        <View style={cardStyles.body}>
          <View style={cardStyles.titleRow}>
            <Text style={cardStyles.title} numberOfLines={2}>{title}</Text>
            {badge ? (
              <View style={[cardStyles.badge, ready && cardStyles.badgeReady]}>
                <Text style={cardStyles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <View style={cardStyles.progText}>
            <Text style={[cardStyles.haveNum, ready && cardStyles.haveNumReady]}>{formatCompactNumber(have)}</Text>
            <Text style={cardStyles.needNum}> / {formatCompactNumber(need)} {unit}</Text>
          </View>
          {!done && (
            <View style={cardStyles.progTrack}>
              <View style={[cardStyles.progFill, { width: `${pct}%`, backgroundColor: ready ? colors.green : colors.gold }]} />
            </View>
          )}
          <View style={cardStyles.rewardRow}>
            <GameIcon name="money" size={15} />
            <Text style={cardStyles.reward}>${formatCompactNumber(reward)}</Text>
            <View style={cardStyles.rpWrap}>
              <GameIcon name="research" size={15} />
              <Text style={cardStyles.rp}>+{rp} RP</Text>
            </View>
          </View>
        </View>
      </View>
      {hint ? <Text style={cardStyles.hint}>{hint}</Text> : null}
      {!done && (
        <Pressable
          style={[cardStyles.btn, ready ? cardStyles.btnReady : cardStyles.btnOff]}
          disabled={!ready}
          onPress={onComplete}
        >
          <Text style={[cardStyles.btnText, !ready && cardStyles.btnTextOff]}>COMPLETE</Text>
        </Pressable>
      )}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#EFE4CC',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C9B896',
    borderBottomWidth: 5,
    borderBottomColor: '#B7A883',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDone: { opacity: 0.6 },
  row: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#2A3446',
    borderWidth: 2,
    borderColor: '#161E2A',
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 15, fontFamily: fonts.heading, color: colors.ink },
  badge: {
    backgroundColor: '#B7A883',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeReady: { backgroundColor: colors.green },
  badgeText: { fontSize: 9, fontFamily: fonts.heading, color: '#fff', letterSpacing: 0.5 },
  progText: { flexDirection: 'row', alignItems: 'baseline' },
  haveNum: { fontSize: 15, fontFamily: fonts.heading, color: colors.inkMuted },
  haveNumReady: { color: colors.greenDark },
  needNum: { fontSize: 13, fontFamily: fonts.body, color: colors.inkMuted },
  progTrack: { height: 7, borderRadius: radii.pill, backgroundColor: '#D8C8A8', overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: radii.pill },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  reward: { fontSize: 14, fontFamily: fonts.heading, color: colors.orangeDark, marginRight: spacing.sm },
  rpWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rp: { fontSize: 13, fontFamily: fonts.heading, color: colors.blueDark },
  hint: { fontSize: 11, fontFamily: fonts.body, color: colors.orangeDark, fontStyle: 'italic', marginTop: spacing.sm },
  btn: {
    marginTop: spacing.md,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 4,
  },
  btnReady: { backgroundColor: colors.green, borderBottomColor: colors.greenDark },
  btnOff: { backgroundColor: '#D5C7A8', borderBottomColor: '#C0B08C' },
  btnText: { fontSize: 15, fontFamily: fonts.display, color: '#fff', letterSpacing: 1 },
  btnTextOff: { color: '#9A8C6E' },
})

export default function ContractsScreen() {
  const router = useRouter()
  const { game, loaded, derived, completeContract, completeRotatingContract, claimHiddenEvent, autoTrade } = useGame()
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
  const mysteryEvents = HIDDEN_EVENTS.filter(
    (e) => e.reward.kind === 'contract' && game.hiddenEventStatus[e.key] === 'unlocked',
  )
  // Rotating Rush Orders — soonest-to-expire first so the urgent ones lead.
  const rushOrders = [...game.rotatingContracts].sort((a, b) => a.expiresAtTick - b.expiresAtTick)
  const hasAnyContent = mysteryEvents.length > 0 || unlockedContracts.length > 0 || rushOrders.length > 0

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title={t(sc.title)}
        badge={totalReady > 0 ? t(sc.ready(totalReady)) : undefined}
        onClose={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {/* Hero banner — code-drawn beveled panel so the screen reads finished
            without pixel art (illustrated art can be dropped in later). */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}><GameIcon name="gas" size={34} /></View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{t(sc.heroTitle)}</Text>
            <Text style={styles.heroSub}>{t(sc.heroSub)}</Text>
          </View>
        </View>

        {!hasAnyContent && (
          <View style={styles.emptyState}>
            <ArtSlot id="contracts_empty" width={140} height={140} spec="480×480" radius={70} caption="Empty clipboard / no orders" />
            <Text style={styles.emptyTitle}>{t(sc.emptyTitle)}</Text>
            <Text style={styles.emptyHint}>{t(sc.emptyHint)}</Text>
          </View>
        )}

        {/* Mystery contracts */}
        {mysteryEvents.map((event) => (
          <ListRow key={event.key} dark title={t(sc.mysteryTitle)} subtitle={t(sc.mysterySubtitle)} badge="???" actionLabel={t(sc.reveal)} onPress={() => claimHiddenEvent(event.key)} />
        ))}

        {/* Rotating Rush Orders — time-limited premium offers */}
        {rushOrders.length > 0 && (
          <Section title={t(sc.rushTitle)} count={rushOrders.length} defaultOpen>
            {rushOrders.map((order) => {
              const have = getRotatingContractHave(game, order.productKey)
              const ready = have >= order.required
              const minsLeft = Math.max(1, Math.round(((order.expiresAtTick - game.tickCount) * TICK_MS) / 60000))
              const unit = sc.groups[order.productKey as keyof typeof sc.groups]
              return (
                <ContractCard
                  key={order.id}
                  productKey={order.productKey}
                  title={t(sc.rushName(unit))}
                  have={have}
                  need={order.required}
                  unit={t(unit)}
                  reward={order.reward}
                  rp={order.rpReward}
                  ready={ready}
                  badge={ready ? t(sc.ok) : t(sc.rushExpires(minsLeft))}
                  onComplete={() => { if (ready) completeRotatingContract(order.id) }}
                />
              )
            })}
          </Section>
        )}

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
              iconName={`product-${group.key}`}
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
                        <ContractCard
                          key={contract.id}
                          productKey={group.key}
                          title={t(contract.name)}
                          have={have}
                          need={need}
                          unit={unit}
                          reward={contract.currentReward}
                          rp={contract.currentRpReward}
                          ready={ready}
                          badge={ready ? t(sc.ok) : contract.unlockLevel === game.refineryLevel ? t(sc.newBadge) : undefined}
                          hint={showAutoTradeHint ? t(sc.autoTradeHint) : undefined}
                          onComplete={() => { if (ready) completeContract(contract) }}
                        />
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
                      dark
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
  screen: { flex: 1, backgroundColor: '#111820' },
  loadingScreen: { flex: 1, backgroundColor: '#111820', alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#1C3A34',
    borderRadius: 14,
    borderTopWidth: 2,
    borderTopColor: '#2E5A4F',
    borderBottomWidth: 3,
    borderBottomColor: '#0C1F1B',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 19, fontFamily: fonts.display, color: '#F2F6FB', letterSpacing: 0.3 },
  heroSub: { fontSize: 12, fontFamily: fonts.body, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.heading, color: '#EAF1F8' },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19 },
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
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
})
