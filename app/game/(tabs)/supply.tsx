import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import ListRow from '../../../src/components/ListRow'
import MarketGraph from '../../../src/components/MarketGraph'
import ScreenHeader from '../../../src/components/ScreenHeader'
import AnimatedPressable from '../../../src/components/AnimatedPressable'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { SHIPMENT_BALANCE, STANDING_ORDER_BALANCE } from '../../../src/game/data/balance'
import { CRUDE_COST, TICK_MS, formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'

type AutomationRowProps = {
  enabled: boolean
  label: string
  value: number
  onToggle: (value: boolean) => void
  onMinus: () => void
  onPlus: () => void
}

function AutomationRow({ enabled, label, value, onToggle, onMinus, onPlus }: AutomationRowProps) {
  return (
    <View style={styles.automationRow}>
      <Switch
        style={styles.rowSwitch}
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: '#39495C', true: colors.green }}
      />
      <Text style={[styles.automationRowLabel, !enabled && styles.automationRowLabelOff]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepperButton} onPress={onMinus}><Text style={styles.stepperButtonText}>−</Text></Pressable>
        <Text style={styles.stepperValue}>{value}%</Text>
        <Pressable style={styles.stepperButton} onPress={onPlus}><Text style={styles.stepperButtonText}>+</Text></Pressable>
      </View>
    </View>
  )
}

export default function SupplyScreen() {
  const router = useRouter()
  const {
    game, loaded, derived,
    buyCrude, sellGasoline, buyShipment, fulfillStandingOrder,
    autoTrade, updateAutoTrade,
  } = useGame()
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

  const secondaryProducts = [
    { key: 'lubricants' as const, label: 'Lubricants', building: 'lubricantPlant' as const },
    { key: 'jetFuel' as const, label: 'Jet Fuel', building: 'jetFuelPlant' as const },
    { key: 'petrochemicals' as const, label: 'Petrochem', building: 'petrochemicalPlant' as const },
    { key: 'recycledMaterial' as const, label: 'Recycled', building: 'wasteTreatmentPlant' as const },
    { key: 'plasticPellets' as const, label: 'Pellets', building: 'polymerPlant' as const },
  ].filter((product) => derived.buildingCounts[product.building] > 0)

  const adjustProductThreshold = (key: typeof secondaryProducts[number]['key'], delta: number) => {
    const current = autoTrade.productSellThresholds[key] ?? 80
    updateAutoTrade({
      productSellThresholds: {
        ...autoTrade.productSellThresholds,
        [key]: Math.min(100, Math.max(0, current + delta)),
      },
    })
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title="Operations"
        badge={standaloneReady > 0 ? t(ss.ready(standaloneReady)) : undefined}
      />

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.inventoryCard}>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryValue}>{game.crudeOil}/{derived.maxCrudeStorage}</Text>
            <Text style={styles.inventoryLabel}>CRUDE</Text>
          </View>
          <View style={styles.inventoryDivider} />
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryValue}>{game.gasoline}/{derived.maxGasolineStorage}</Text>
            <Text style={styles.inventoryLabel}>GASOLINE</Text>
          </View>
          <View style={styles.inventoryDivider} />
          <View style={styles.inventoryItem}>
            <Text style={[styles.inventoryValue, autoTrade.enabled ? styles.autoOn : styles.autoOff]}>
              {autoTrade.enabled ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.inventoryLabel}>AUTO TRADE</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Spot Trade</Text>
        <View style={styles.tradeRow}>
          <AnimatedPressable
            style={[styles.tradeButton, styles.buyButton]}
            onPress={() => buyCrude(10)}
          >
            <Text style={styles.tradeButtonTitle}>Buy 10 Crude</Text>
            <Text style={styles.tradeButtonSub}>${derived.crudePrice}/unit</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.tradeButton, styles.sellButton]}
            onPress={() => sellGasoline(10)}
          >
            <Text style={styles.tradeButtonTitle}>Sell 10 Gas</Text>
            <Text style={styles.tradeButtonSub}>${derived.sellPrice}/unit</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.automationCard}>
          <View style={styles.automationHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.automationTitle}>Auto Trade</Text>
              <Text style={styles.automationSub}>Manage stock automatically while the refinery runs.</Text>
            </View>
            <Switch
              value={autoTrade.enabled}
              onValueChange={(enabled) => updateAutoTrade({ enabled })}
              trackColor={{ false: '#39495C', true: colors.green }}
            />
          </View>

          {autoTrade.enabled && (
            <View style={styles.automationRows}>
              <AutomationRow
                enabled={autoTrade.crudeBuyEnabled}
                label="Buy crude below"
                value={autoTrade.buyThreshold}
                onToggle={(crudeBuyEnabled) => updateAutoTrade({ crudeBuyEnabled })}
                onMinus={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}
                onPlus={() => updateAutoTrade({ buyThreshold: Math.min(95, autoTrade.buyThreshold + 5) })}
              />
              <AutomationRow
                enabled={autoTrade.gasolineSellEnabled}
                label="Sell gasoline above"
                value={autoTrade.sellThreshold}
                onToggle={(gasolineSellEnabled) => updateAutoTrade({ gasolineSellEnabled })}
                onMinus={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}
                onPlus={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}
              />
              {secondaryProducts.map((product) => {
                const enabled = autoTrade.productSellEnabled[product.key] !== false
                const value = autoTrade.productSellThresholds[product.key] ?? 80
                return (
                  <AutomationRow
                    key={product.key}
                    enabled={enabled}
                    label={`Sell ${product.label} above`}
                    value={value}
                    onToggle={(next) => updateAutoTrade({
                      productSellEnabled: { ...autoTrade.productSellEnabled, [product.key]: next },
                    })}
                    onMinus={() => adjustProductThreshold(product.key, -5)}
                    onPlus={() => adjustProductThreshold(product.key, 5)}
                  />
                )
              })}
            </View>
          )}
        </View>

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
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D3655',
    borderWidth: 2,
    borderColor: '#176197',
    borderRadius: 10,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  inventoryItem: { flex: 1, alignItems: 'center' },
  inventoryValue: { fontSize: 14, fontFamily: fonts.heading, color: '#FFFFFF' },
  inventoryLabel: { marginTop: 2, fontSize: 8, fontFamily: fonts.heading, color: '#8FB2CE', letterSpacing: 0.5 },
  inventoryDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.18)' },
  autoOn: { color: '#7CE38B' },
  autoOff: { color: '#90A6BE' },
  tradeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  tradeButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  buyButton: { backgroundColor: 'rgba(91,141,191,0.18)', borderColor: 'rgba(91,141,191,0.65)' },
  sellButton: { backgroundColor: 'rgba(127,174,116,0.18)', borderColor: 'rgba(127,174,116,0.65)' },
  tradeButtonTitle: { fontSize: 12, fontFamily: fonts.heading, color: '#EAF1F8' },
  tradeButtonSub: { marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  automationCard: {
    backgroundColor: '#1B2534',
    borderRadius: 14,
    borderTopWidth: 2,
    borderTopColor: '#2C3D54',
    borderBottomWidth: 3,
    borderBottomColor: '#0C131C',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  automationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  automationTitle: { fontSize: 14, fontFamily: fonts.heading, color: '#EAF1F8' },
  automationSub: { marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,0.48)' },
  automationRows: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  automationRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowSwitch: { transform: [{ scaleX: 0.76 }, { scaleY: 0.76 }], marginHorizontal: -5 },
  automationRowLabel: { flex: 1, fontSize: 10.5, color: '#DCE7F2', fontWeight: '700' },
  automationRowLabelOff: { color: 'rgba(255,255,255,0.32)' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#26364A', borderWidth: 1, borderColor: '#41566F' },
  stepperButtonText: { fontSize: 16, fontFamily: fonts.heading, color: '#EAF1F8' },
  stepperValue: { width: 34, textAlign: 'center', fontSize: 10, fontFamily: fonts.heading, color: '#FFD447' },
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
