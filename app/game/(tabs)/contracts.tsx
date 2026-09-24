import { useState } from 'react'
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowRight, Building2, FlaskConical, Ship, TrendingUp } from 'lucide-react-native'

import ArtSlot from '../../../src/components/ArtSlot'
import GameIcon from '../../../src/components/GameIcon'
import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getContractProgress, TICK_MS } from '../../../src/game/utils/gameCalculations'
import { getRotatingContractHave } from '../../../src/game/data/rotatingContracts'
import { text } from '../../../src/game/translations'
import type { ActiveContract } from '../../../src/game/types'

const COMMERCIAL_OFFICE = require('../../../assets/bg/business_commercial_office_v1.png')

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
    backgroundColor: '#123552', borderRadius: 10,
    borderWidth: 1, borderColor: '#28668F',
    borderBottomWidth: 3, borderBottomColor: '#071725',
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
    backgroundColor: '#0D2A43',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#24638F',
    borderBottomWidth: 4,
    borderBottomColor: '#061522',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDone: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#071B2C',
    borderWidth: 2,
    borderColor: '#1D5B84',
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 14, fontFamily: fonts.heading, color: '#FFFFFF' },
  badge: {
    backgroundColor: '#39516A',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeReady: { backgroundColor: colors.green },
  badgeText: { fontSize: 9, fontFamily: fonts.heading, color: '#fff', letterSpacing: 0.5 },
  progText: { flexDirection: 'row', alignItems: 'baseline' },
  haveNum: { fontSize: 15, fontFamily: fonts.heading, color: '#AFC3D4' },
  haveNumReady: { color: '#78ED87' },
  needNum: { fontSize: 13, fontFamily: fonts.body, color: '#7892A8' },
  progTrack: { height: 7, borderRadius: radii.pill, backgroundColor: '#17384F', overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: radii.pill },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  reward: { fontSize: 14, fontFamily: fonts.heading, color: '#FFD447', marginRight: spacing.sm },
  rpWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rp: { fontSize: 13, fontFamily: fonts.heading, color: '#8ED6FF' },
  hint: { fontSize: 11, fontFamily: fonts.body, color: '#FFB873', fontStyle: 'italic', marginTop: spacing.sm },
  btn: {
    marginTop: spacing.md,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 4,
  },
  btnReady: { backgroundColor: colors.green, borderBottomColor: colors.greenDark },
  btnOff: { backgroundColor: '#263D50', borderBottomColor: '#142838' },
  btnText: { fontSize: 15, fontFamily: fonts.display, color: '#fff', letterSpacing: 1 },
  btnTextOff: { color: '#7890A4' },
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
  const openContractCount = unlockedContracts.filter((contract) => !contract.isCompleted).length

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.list}>
        <ImageBackground source={COMMERCIAL_OFFICE} resizeMode="cover" style={styles.commercialOffice} imageStyle={styles.commercialOfficeImage}>
          <View style={styles.sceneShade} />
          <View style={styles.sceneTopRow}>
            <View>
              <Text style={styles.sceneEyebrow}>COMMERCIAL OFFICE</Text>
              <Text style={styles.sceneTitle}>Business</Text>
            </View>
            {totalReady > 0 ? (
              <View style={styles.readyPill}><View style={styles.readyDot} /><Text style={styles.readyPillText}>{totalReady} READY</Text></View>
            ) : (
              <View style={styles.quietPill}><Text style={styles.quietPillText}>DEAL DESK</Text></View>
            )}
          </View>
          <View style={styles.sceneStats}>
            <View><Text style={styles.sceneStatLabel}>READY</Text><Text style={[styles.sceneStatValue, totalReady > 0 && styles.sceneStatReady]}>{totalReady}</Text></View>
            <View style={styles.sceneStatDivider} />
            <View><Text style={styles.sceneStatLabel}>OPEN</Text><Text style={styles.sceneStatValue}>{openContractCount}</Text></View>
            <View style={styles.sceneStatDivider} />
            <View><Text style={styles.sceneStatLabel}>RUSH</Text><Text style={[styles.sceneStatValue, rushOrders.length > 0 && styles.sceneStatRush]}>{rushOrders.length}</Text></View>
          </View>
        </ImageBackground>

        <View style={styles.dealDesk}>
          <View style={styles.dealDeskHeader}>
            <View style={styles.dealDeskIcon}><TrendingUp size={22} color="#FFD447" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dealDeskTitle}>Deal Desk</Text>
              <Text style={styles.dealDeskSub}>{totalReady > 0 ? `${totalReady} contract${totalReady === 1 ? '' : 's'} ready to complete.` : 'Build inventory, then close the best available contracts.'}</Text>
            </View>
          </View>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction} onPress={() => router.push('/game/research')}>
              <FlaskConical size={20} color="#8ED6FF" />
              <Text style={styles.quickActionTitle}>Research</Text>
              <Text style={styles.quickActionSub}>{game.researchPoints} RP</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/game/supply')}>
              <Ship size={20} color="#FFD447" />
              <Text style={styles.quickActionTitle}>Market</Text>
              <Text style={styles.quickActionSub}>Supply & trade</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/game/company')}>
              <Building2 size={20} color="#78ED87" />
              <Text style={styles.quickActionTitle}>Company</Text>
              <Text style={styles.quickActionSub}>Plan growth</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.contractContent}>
          <View style={styles.contractHeadingRow}>
            <View>
              <Text style={styles.contractHeading}>Contract Board</Text>
              <Text style={styles.contractHeadingSub}>Complete ready deals first, then work toward the active tier.</Text>
            </View>
            <ArrowRight size={20} color="#52718C" />
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
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09131E' },
  loadingScreen: { flex: 1, backgroundColor: '#09131E', alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 10 },
  commercialOffice: { height: 238, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 20 },
  commercialOfficeImage: { opacity: 0.96 },
  sceneShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(2,15,30,0.18)' },
  sceneTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sceneEyebrow: { fontSize: 8, fontFamily: fonts.heading, letterSpacing: 1.4, color: '#A7D6FA', textShadowColor: '#06192B', textShadowRadius: 2 },
  sceneTitle: { marginTop: 3, fontSize: 28, fontFamily: fonts.heading, color: '#FFFFFF', textShadowColor: '#06192B', textShadowRadius: 4 },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(120,237,135,0.55)', backgroundColor: 'rgba(5,44,49,0.88)', paddingHorizontal: 9, paddingVertical: 7 },
  readyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#78ED87' },
  readyPillText: { fontSize: 8, fontFamily: fonts.heading, color: '#FFFFFF' },
  quietPill: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)', backgroundColor: 'rgba(5,31,54,0.82)', paddingHorizontal: 9, paddingVertical: 7 },
  quietPillText: { fontSize: 8, fontFamily: fonts.heading, color: '#FFFFFF' },
  sceneStats: { alignSelf: 'center', minWidth: '84%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(118,184,232,0.55)', backgroundColor: 'rgba(3,29,52,0.88)', paddingVertical: 10, paddingHorizontal: 12 },
  sceneStatLabel: { textAlign: 'center', fontSize: 7, fontFamily: fonts.heading, color: '#82AAC8', letterSpacing: 0.7 },
  sceneStatValue: { marginTop: 3, textAlign: 'center', fontSize: 15, fontFamily: fonts.heading, color: '#FFFFFF' },
  sceneStatReady: { color: '#78ED87' },
  sceneStatRush: { color: '#FFD447' },
  sceneStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.16)' },
  dealDesk: { marginHorizontal: spacing.md, marginTop: -12, borderRadius: 14, borderWidth: 2, borderColor: '#176AA4', backgroundColor: '#092844', padding: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  dealDeskHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dealDeskIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#2A6B98', backgroundColor: '#0B3557' },
  dealDeskTitle: { fontSize: 17, fontFamily: fonts.heading, color: '#FFFFFF' },
  dealDeskSub: { marginTop: 3, fontSize: 9.5, color: '#93B1C9' },
  quickActions: { marginTop: 11, flexDirection: 'row', gap: 7 },
  quickAction: { flex: 1, minHeight: 77, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#245E87', backgroundColor: '#0B3557', paddingHorizontal: 4 },
  quickActionTitle: { marginTop: 5, fontSize: 9, fontFamily: fonts.heading, color: '#FFFFFF' },
  quickActionSub: { marginTop: 3, fontSize: 7.5, color: '#86A3BA', textAlign: 'center' },
  contractContent: { marginHorizontal: spacing.md, marginTop: 11, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: '#1E415D', backgroundColor: '#0C1C2A' },
  contractHeadingRow: { marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contractHeading: { fontSize: 15, fontFamily: fonts.heading, color: '#FFFFFF' },
  contractHeadingSub: { marginTop: 3, fontSize: 8.5, color: '#7894A9' },
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
