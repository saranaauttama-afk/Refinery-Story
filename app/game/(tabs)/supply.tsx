import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { TICK_MS } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'

export default function SupplyScreen() {
  const router = useRouter()
  const { game, loaded, derived, buyShipment, fulfillStandingOrder } = useGame()

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
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>X</Text>
        </Pressable>
        <Text style={styles.title}>Supply</Text>
        {standaloneReady > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{standaloneReady} ready</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {game.pendingShipments.length > 0 && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingTitle}>Incoming Shipments</Text>
            {game.pendingShipments.map((s) => {
              const secsLeft = Math.max(0, Math.ceil((s.arrivesAt - Date.now()) / 1000))
              return <Text key={s.id} style={styles.pendingRow}>{s.amount} crude in {secsLeft}s</Text>
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>Order Crude</Text>
        {SHIPMENT_BALANCE.map((option) => (
          <ListRow key={option.key}
            title={text.shipments.names[option.key].en + " +" + option.amount + " crude"}
            subtitle={"$" + option.cost.toLocaleString() + " arrives in " + option.delayMs / 1000 + "s"}
            actionLabel="Order" disabled={game.money < option.cost}
            onPress={() => buyShipment(option)} />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Standing Orders</Text>
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
            <ListRow key={order.key} title={orderText.name.en}
              subtitle={onCooldown
                ? "Cooldown " + Math.ceil((ticksLeft * TICK_MS) / 1000) + "s"
                : have + "/" + order.required + " " + order.productKey + " +$" + order.reward.toLocaleString() + " +" + order.rpReward + "RP"}
              actionLabel="Fulfill" disabled={!ready}
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
  sectionLabel: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs },
  pendingBox: { backgroundColor: '#EBF4FF', borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.blue, padding: spacing.sm, gap: 4 },
  pendingTitle: { fontSize: 12, fontWeight: '800', color: colors.blueDark },
  pendingRow: { fontSize: 12, color: colors.blue },
})
