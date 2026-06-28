import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ArtSlot from '../../../src/components/ArtSlot'
import ListRow from '../../../src/components/ListRow'
import MarketGraph from '../../../src/components/MarketGraph'
import ScreenHeader from '../../../src/components/ScreenHeader'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { CRUDE_COST, TICK_MS } from '../../../src/game/utils/gameCalculations'
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
        <ArtSlot id="supply_header" width="100%" height={84} spec="1080×260" caption="Crude tanker / pipeline banner" />

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
          <ListRow key={option.key}
            title={t(text.shipments.names[option.key]) + t(ss.plusCrude(option.amount))}
            subtitle={t(ss.shipmentSub(option.cost.toLocaleString(), option.delayMs / 1000))}
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
            <ListRow key={order.key} title={t(orderText.name)}
              subtitle={onCooldown
                ? t(ss.cooldown(Math.ceil((ticksLeft * TICK_MS) / 1000)))
                : have + "/" + order.required + " " + order.productKey + " +$" + order.reward.toLocaleString() + " +" + order.rpReward + "RP"}
              actionLabel={t(ss.fulfill)} disabled={!ready}
              onPress={() => fulfillStandingOrder(order.key)} />
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs },
  marketCard: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.creamBorder, padding: spacing.md, marginBottom: spacing.xs },
  marketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  marketTitle: { fontSize: 13, fontWeight: '900', color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.5 },
  marketPrice: { fontSize: 15, fontWeight: '900' },
  marketPriceCheap: { color: colors.green },
  marketPriceHigh: { color: colors.orange },
  marketHint: { fontSize: 11, color: colors.inkMuted, marginTop: 4, fontStyle: 'italic' },
  pendingBox: { backgroundColor: '#EBF4FF', borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.blue, padding: spacing.sm, gap: 4 },
  pendingTitle: { fontSize: 12, fontWeight: '800', color: colors.blueDark },
  pendingRow: { fontSize: 12, color: colors.blue },
})
