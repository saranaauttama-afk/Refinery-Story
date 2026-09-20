import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import MarketGraph from '../../../src/components/MarketGraph'
import ScreenHeader from '../../../src/components/ScreenHeader'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { CRUDE_COST, TICK_MS, formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'

export default function SupplyScreen() {
  const router = useRouter()
  const { game, loaded, derived, buyShipment, fulfillStandingOrder } = useGame()
  const { t } = useLang()
  const ss = text.supplyScreen
  const { width: screenWidth } = useWindowDimensions()

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const standaloneReady = STANDING_ORDER_BALANCE.filter((order) => {
    if (game.refineryLevel < order.unlockLevel) return false
    const key = order.key as keyof typeof game.standingOrderCooldowns
    const cooldownAt = game.standingOrderCooldowns[key]
    const pKey = order.productKey as keyof typeof game.productInventory
    return !(cooldownAt !== undefined && cooldownAt > game.tickCount) &&
      (game.productInventory[pKey] as number) >= order.required
  }).length

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title={t(ss.title)}
        badge={standaloneReady > 0 ? t(ss.ready(standaloneReady)) : undefined}
        onClose={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {/* Crude price chart — history + deterministic forecast so you can time the dip */}
        <View style={styles.marketCard}>
          <View style={styles.marketTop}>
            <Text style={styles.marketTitle}>{t(ss.marketTitle)}</Text>
            <Text style={[styles.marketPrice, derived.crudePrice <= CRUDE_COST ? styles.marketPriceCheap : styles.marketPriceHigh]}>
              ${derived.crudePrice}/u
            </Text>
          </View>
          <MarketGraph tickCount={game.tickCount} width={screenWidth - spacing.lg * 2 - spacing.md * 2} height={110} nowLabel={t(ss.now)} />
          <Text style={styles.marketHint}>{derived.crudePrice <= CRUDE_COST ? t(ss.buyHintCheap) : t(ss.buyHintHigh)}</Text>
        </View>

        {game.pendingShipments.length > 0 && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingTitle}>{t(ss.incoming)}</Text>
            {game.pendingShipments.map((s) => {
              // arrivesAt is a tickCount now; 5 ticks/sec at 200ms.
              const secsLeft = Math.max(0, Math.ceil((s.arrivesAt - game.tickCount) / 5))
              return <Text key={s.id} style={styles.pendingRow}>{t(ss.crudeIn(s.amount, secsLeft))}</Text>
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>{t(ss.orderCrude)}</Text>
        {SHIPMENT_BALANCE.map((option) => (
          <ListRow key={option.key} dark
            title={t(text.shipments.names[option.key]) + t(ss.plusCrude(option.amount))}
            subtitle={t(ss.shipmentSub(formatCompactNumber(option.cost), option.delayMs / 1000))}
            actionLabel={t(ss.order)} disabled={game.money < option.cost}
            onPress={() => buyShipment(option)} />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>{t(ss.standingOrders)}</Text>
        {STANDING_ORDER_BALANCE.filter((o) => game.refineryLevel >= o.unlockLevel).map((order) => {
          const key = order.key as keyof typeof game.standingOrderCooldowns
          const cooldownAt = game.standingOrderCooldowns[key]
          const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
          const ticksLeft = onCooldown ? cooldownAt! - game.tickCount : 0
          const pKey = order.productKey as keyof typeof game.productInventory
          const have = game.productInventory[pKey] as number
          const ready = have >= order.required && !onCooldown
          const orderText = text.standingOrders.orders[order.key]
          return (
            <ListRow key={order.key} dark title={t(orderText.name)}
              subtitle={onCooldown
                ? t(ss.cooldown(Math.ceil((ticksLeft * TICK_MS) / 1000)))
                : have + "/" + order.required + " " + order.productKey + " +$" + formatCompactNumber(order.reward) + " +" + order.rpReward + "RP"}
              actionLabel={t(ss.fulfill)} disabled={!ready}
              onPress={() => fulfillStandingOrder(order.key)} />
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
  sectionLabel: { fontSize: 11, fontFamily: fonts.heading, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.xs },
  marketCard: {
    backgroundColor: '#1B2534', borderRadius: 14,
    borderTopWidth: 2, borderTopColor: '#2C3D54',
    borderBottomWidth: 3, borderBottomColor: '#0C131C',
    padding: spacing.md, marginBottom: spacing.sm,
  },
  marketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  marketTitle: { fontSize: 13, fontFamily: fonts.heading, color: '#EAF1F8', textTransform: 'uppercase', letterSpacing: 0.5 },
  marketPrice: { fontSize: 16, fontFamily: fonts.heading },
  marketPriceCheap: { color: colors.green },
  marketPriceHigh: { color: colors.orange },
  marketHint: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontStyle: 'italic' },
  pendingBox: {
    backgroundColor: 'rgba(91,141,191,0.14)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(91,141,191,0.5)',
    padding: spacing.sm, gap: 4, marginBottom: spacing.sm,
  },
  pendingTitle: { fontSize: 12, fontFamily: fonts.heading, color: '#9CC2EC' },
  pendingRow: { fontSize: 12, color: '#B9D4F2' },
})
