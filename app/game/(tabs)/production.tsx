import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import CollapsibleCard from '../../../src/components/CollapsibleCard'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ProgressBar from '../../../src/components/ProgressBar'
import ProductionOverview, { type ProductionOverviewRow } from '../../../src/components/ProductionOverview'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { ASPHALT_BALANCE, PLANT_PRODUCTION, POWER_PLANT_BALANCE } from '../../../src/game/data/balance'
import type { BuildingType, DerivedStats, GameState } from '../../../src/game/types'
import { getProductSellPrice } from '../../../src/game/utils/gameCalculations'

const PRODUCT_KEYS = ['lubricants', 'jetFuel', 'petrochemicals', 'recycledMaterial', 'plasticPellets'] as const

type ManagedProductKey = (typeof PRODUCT_KEYS)[number]
type HealthState = 'Good' | 'Warning' | 'Blocked'

const PRODUCT_PLANT_BUILDING: Record<ManagedProductKey, BuildingType> = {
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
  petrochemicals: 'petrochemicalPlant',
  recycledMaterial: 'wasteTreatmentPlant',
  plasticPellets: 'polymerPlant',
}

const PRODUCT_LABELS: Record<ManagedProductKey, string> = {
  lubricants: 'Lubricants',
  jetFuel: 'Jet Fuel',
  petrochemicals: 'Petrochemicals',
  recycledMaterial: 'Recycled Material',
  plasticPellets: 'Plastic Pellets',
}

const PRODUCT_COLORS: Record<ManagedProductKey, string> = {
  lubricants: colors.goldDark,
  jetFuel: colors.blue,
  petrochemicals: colors.purple,
  recycledMaterial: colors.greenDark,
  plasticPellets: colors.teal,
}

const RESOURCE_WARNING_RATIO = 0.25
const STORAGE_WARNING_RATIO = 0.85

type StorageEntry = {
  label: string
  current: number
  max: number
}

type HealthRowData = {
  key: string
  label: string
  statusText: string
  state: HealthState
  current: number
  target: number
}

type ProductionSignals = {
  crudeEmpty: boolean
  gasolineFull: boolean
  hasDistillation: boolean
  hasDownstreamPlants: boolean
  feedstockCurrent: number
  feedstockMax: number
  feedstockEmpty: boolean
  feedstockLow: boolean
  hasPowerPlant: boolean
  electricityCurrent: number
  electricityMax: number
  electricityDemand: number
  electricitySupply: number
  electricityShort: boolean
  electricityReserveLow: boolean
  blockedStorageEntry: StorageEntry | null
  storageWarningEntry: StorageEntry | null
  fullestStorageRatio: number
}

function getProductMaxStorage(derived: DerivedStats, key: ManagedProductKey): number {
  switch (key) {
    case 'lubricants':
      return derived.maxLubricantsStorage
    case 'jetFuel':
      return derived.maxJetFuelStorage
    case 'petrochemicals':
      return derived.maxPetrochemicalsStorage
    case 'recycledMaterial':
      return derived.maxRecycledMaterialStorage
    case 'plasticPellets':
      return derived.maxPlasticPelletsStorage
  }
}

function getRatio(current: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(0, Math.min(1, current / max))
}

function getHealthColor(state: HealthState): string {
  switch (state) {
    case 'Good':
      return colors.greenDark
    case 'Warning':
      return colors.orangeDark
    case 'Blocked':
      return colors.red
  }
}

function getProductionSignals(game: GameState, derived: DerivedStats): ProductionSignals {
  const hasDownstreamPlants = PLANT_PRODUCTION.some((plant) => derived.buildingCounts[plant.buildingKey] > 0)
  const hasDistillation = derived.buildingCounts.distillationUnit > 0
  const hasPowerPlant = derived.buildingCounts.powerPlant > 0
  const electricitySupply = derived.buildingCounts.powerPlant * POWER_PLANT_BALANCE.electricityPerCycle
  const electricityDemand = derived.electricityDemandPerCycle
  const electricitySupplyRatio = electricityDemand > 0 ? Math.min(1, electricitySupply / electricityDemand) : 1
  const electricityReserveRatio = hasPowerPlant ? getRatio(game.electricity, derived.maxElectricityStorage) : 1
  const storageEntries: StorageEntry[] = [
    { label: 'Gasoline', current: game.gasoline, max: derived.maxGasolineStorage },
    ...PRODUCT_KEYS.filter(
      (key) => game.productInventory[key] > 0 || derived.buildingCounts[PRODUCT_PLANT_BUILDING[key]] > 0,
    ).map((key) => ({
      label: PRODUCT_LABELS[key],
      current: game.productInventory[key],
      max: getProductMaxStorage(derived, key),
    })),
  ].filter((entry) => entry.max > 0)

  const fullestStorage = storageEntries.reduce<StorageEntry | null>((highest, entry) => {
    if (!highest) return entry
    return getRatio(entry.current, entry.max) > getRatio(highest.current, highest.max) ? entry : highest
  }, null)

  const blockedStorageEntry =
    storageEntries.find((entry) => entry.label !== 'Gasoline' && entry.current >= entry.max) ?? null
  const storageWarningEntry =
    storageEntries.find(
      (entry) =>
        entry.label !== 'Gasoline' &&
        entry.current < entry.max &&
        getRatio(entry.current, entry.max) >= STORAGE_WARNING_RATIO,
    ) ?? null

  return {
    crudeEmpty: game.crudeOil <= 0,
    gasolineFull: derived.maxGasolineStorage > 0 && game.gasoline >= derived.maxGasolineStorage,
    hasDistillation,
    hasDownstreamPlants,
    feedstockCurrent: game.feedstock,
    feedstockMax: derived.maxFeedstockStorage,
    feedstockEmpty: hasDownstreamPlants && game.feedstock <= 0,
    feedstockLow: hasDownstreamPlants && game.feedstock > 0 && getRatio(game.feedstock, derived.maxFeedstockStorage) < RESOURCE_WARNING_RATIO,
    hasPowerPlant,
    electricityCurrent: game.electricity,
    electricityMax: derived.maxElectricityStorage,
    electricityDemand,
    electricitySupply,
    electricityShort: hasPowerPlant && electricityDemand > 0 && electricitySupplyRatio < 1,
    electricityReserveLow:
      hasPowerPlant && electricityDemand > 0 && electricitySupplyRatio >= 1 && electricityReserveRatio < RESOURCE_WARNING_RATIO,
    blockedStorageEntry,
    storageWarningEntry,
    fullestStorageRatio: fullestStorage ? getRatio(fullestStorage.current, fullestStorage.max) : 0,
  }
}

function getProductionHealth(signals: ProductionSignals): HealthRowData[] {
  const feedstockState: HealthState = !signals.hasDownstreamPlants
    ? 'Good'
    : signals.feedstockEmpty
      ? 'Blocked'
      : signals.feedstockLow
        ? 'Warning'
        : 'Good'

  const feedstockText = !signals.hasDownstreamPlants
    ? signals.hasDistillation
      ? 'Reserve ready for future plants.'
      : 'Not in use yet.'
    : signals.feedstockEmpty
      ? signals.hasDistillation
        ? 'Empty - downstream plants are waiting.'
        : 'Empty - distillation is needed first.'
      : signals.feedstockLow
        ? 'Running low for downstream plants.'
        : 'Healthy reserve for downstream plants.'

  const electricityState: HealthState = !signals.hasPowerPlant || signals.electricityDemand <= 0
    ? 'Good'
    : signals.electricityShort
      ? 'Warning'
      : signals.electricityReserveLow
        ? 'Warning'
        : 'Good'

  const electricityText = !signals.hasPowerPlant
    ? 'Offline until a Power Plant is built.'
    : signals.electricityDemand <= 0
      ? 'Reserve ready. No active electrical load.'
      : signals.electricityShort
        ? `Supply covers ${Math.round((signals.electricitySupply / signals.electricityDemand) * 100)}% of demand.`
        : signals.electricityReserveLow
          ? 'Reserve is getting low.'
          : 'Supply and reserve look healthy.'

  const storageState: HealthState =
    signals.fullestStorageRatio >= 1 ? 'Blocked' : signals.fullestStorageRatio >= STORAGE_WARNING_RATIO ? 'Warning' : 'Good'

  const storageText = signals.blockedStorageEntry
    ? `${signals.blockedStorageEntry.label} storage is full.`
    : signals.storageWarningEntry
      ? `${signals.storageWarningEntry.label} storage is nearly full.`
      : 'Storage has room to keep flowing.'

  const outputState: HealthState =
    signals.crudeEmpty || signals.gasolineFull
      ? 'Blocked'
      : signals.feedstockEmpty || signals.feedstockLow || signals.electricityShort || signals.blockedStorageEntry !== null || signals.storageWarningEntry !== null
        ? 'Warning'
        : 'Good'

  const outputText = signals.crudeEmpty
    ? 'Crude intake is stopped.'
    : signals.gasolineFull
      ? 'Gasoline storage is stopping output.'
      : signals.blockedStorageEntry
        ? `${signals.blockedStorageEntry.label} is backing up.`
        : signals.electricityShort
          ? 'Power is limiting downstream flow.'
          : signals.feedstockEmpty
            ? 'Downstream flow is waiting on feedstock.'
            : signals.feedstockLow
              ? 'Feedstock is starting to tighten.'
              : signals.storageWarningEntry
                ? `${signals.storageWarningEntry.label} is getting tight.`
                : 'Core lines are flowing cleanly.'

  return [
    {
      key: 'feedstock',
      label: 'Feedstock',
      statusText: feedstockText,
      state: feedstockState,
      current: signals.hasDownstreamPlants || signals.hasDistillation ? signals.feedstockCurrent : 1,
      target: signals.hasDownstreamPlants || signals.hasDistillation ? Math.max(signals.feedstockMax, 1) : 1,
    },
    {
      key: 'electricity',
      label: 'Electricity',
      statusText: electricityText,
      state: electricityState,
      current: signals.hasPowerPlant ? signals.electricityCurrent : 1,
      target: signals.hasPowerPlant ? Math.max(signals.electricityMax, 1) : 1,
    },
    {
      key: 'storage',
      label: 'Storage',
      statusText: storageText,
      state: storageState,
      current: Math.round(signals.fullestStorageRatio * 100),
      target: 100,
    },
    {
      key: 'output',
      label: 'Output Flow',
      statusText: outputText,
      state: outputState,
      current: outputState === 'Good' ? 100 : outputState === 'Warning' ? 60 : 20,
      target: 100,
    },
  ]
}

function getProductionBottlenecks(signals: ProductionSignals): string[] {
  const insights: string[] = []

  if (signals.crudeEmpty) {
    insights.push('Crude is empty. Buy crude or order a shipment.')
  }
  if (signals.gasolineFull) {
    insights.push('Gasoline storage is full. Sell gasoline to restart output.')
  }
  if (signals.feedstockEmpty) {
    insights.push(
      signals.hasDistillation
        ? 'Feedstock is empty. Downstream plants are waiting.'
        : 'No feedstock yet. Distillation is needed for downstream plants.',
    )
  } else if (signals.feedstockLow) {
    insights.push('Feedstock is low. Downstream plants may slow.')
  }
  if (signals.electricityShort) {
    insights.push('Electricity is tight. Downstream plants may slow.')
  } else if (signals.electricityReserveLow) {
    insights.push('Electricity reserve is low. Output may dip soon.')
  }
  if (signals.blockedStorageEntry) {
    insights.push(`${signals.blockedStorageEntry.label} storage is full. Sell or expand storage.`)
  } else if (signals.storageWarningEntry && !signals.gasolineFull) {
    insights.push(`${signals.storageWarningEntry.label} storage is nearly full. Make room soon.`)
  }

  return insights.length > 0 ? insights.slice(0, 4) : ['No major bottlenecks detected.']
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function InventoryRow({
  title,
  subtitle,
  actionLabel,
  disabled,
  onPress,
}: {
  title: string
  subtitle: string
  actionLabel?: string
  disabled?: boolean
  onPress?: () => void
}) {
  return (
    <View style={styles.inventoryRow}>
      <View style={styles.inventoryText}>
        <Text style={styles.inventoryTitle}>{title}</Text>
        <Text style={styles.inventorySubtitle}>{subtitle}</Text>
      </View>
      {actionLabel && onPress ? (
        <AnimatedPressable
          style={[styles.inventoryButton, disabled && styles.inventoryButtonDisabled]}
          disabled={disabled}
          onPress={onPress}
        >
          <Text style={styles.inventoryButtonLabel}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  )
}

type InventoryRowData = {
  key: string
  title: string
  subtitle: string
  actionLabel?: string
  disabled?: boolean
  onPress?: () => void
}

export default function ProductionScreen() {
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const {
    game,
    loaded,
    derived,
    sellProduct,
    autoTrade,
    updateAutoTrade,
    adjustFeedstockPriority,
  } = useGame()

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const products: { key: ManagedProductKey; label: string; color: string }[] = PRODUCT_KEYS.map((key) => ({
    key,
    label: PRODUCT_LABELS[key],
    color: PRODUCT_COLORS[key],
  }))

  // updateAutoTrade does a shallow merge ({ ...current, ...partial }), so
  // passing a fresh productSellThresholds object would wipe out every
  // other product's customized threshold, not just set this one -- this
  // merges into the existing per-product map first.
  const adjustProductSellThreshold = (key: ManagedProductKey, delta: number) => {
    const current = autoTrade.productSellThresholds[key] ?? 80
    const next = Math.min(100, Math.max(0, current + delta))
    updateAutoTrade({ productSellThresholds: { ...autoTrade.productSellThresholds, [key]: next } })
  }

  const productionSignals = getProductionSignals(game, derived)
  const healthRows = getProductionHealth(productionSignals)
  const bottlenecks = getProductionBottlenecks(productionSignals)

  const productionRows: ProductionOverviewRow[] = [
    { key: 'gasoline', label: 'Gasoline', current: game.gasoline, max: derived.maxGasolineStorage, color: colors.green },
    ...products
      .filter((product) => game.productInventory[product.key] > 0 || derived.buildingCounts[PRODUCT_PLANT_BUILDING[product.key]] > 0)
      .map((product) => ({
        key: product.key,
        label: product.label,
        current: game.productInventory[product.key],
        max: getProductMaxStorage(derived, product.key),
        color: product.color,
      })),
  ]

  const inventoryRows: InventoryRowData[] = [
    {
      key: 'gasoline',
      title: 'Gasoline',
      subtitle: `${game.gasoline}/${derived.maxGasolineStorage} in storage · sold from Factory`,
    },
    {
      key: 'asphalt',
      title: 'Asphalt',
      subtitle: `${game.productInventory.asphalt}/${ASPHALT_BALANCE.maxStorage} in storage · used for contracts and standing orders`,
    },
    ...products.map((product) => {
      const stock = game.productInventory[product.key]
      const max = getProductMaxStorage(derived, product.key)
      const price = getProductSellPrice(
        product.key,
        derived.productSellMultiplier,
        product.key === 'petrochemicals' ? game.petrochemicalsDemandMultiplier : 1,
      )
      return {
        key: product.key,
        title: product.label,
        subtitle: `${stock}/${max} in storage · sell @ $${price}`,
        actionLabel: 'Sell All',
        disabled: stock <= 0,
        onPress: () => {
          if (stock > 0) {
            spawnFloat(`+$${(stock * price).toLocaleString()}`, 'income')
            haptics.tap()
          }
          sellProduct(product.key, stock)
        },
      }
    }),
  ]

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />
      <View style={styles.header}>
        <Text style={styles.title}>Production</Text>
        <Text style={styles.subtitle}>Production management, inventory, and automation.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Production Health">
          <View style={styles.card}>
            {healthRows.map((row, index) => {
              const pct = row.target > 0 ? Math.min(100, Math.round((row.current / row.target) * 100)) : 0
              return (
                <View key={row.key} style={[styles.healthRow, index === healthRows.length - 1 && styles.lastRow]}>
                  <View style={styles.healthRowTop}>
                    <Text style={styles.healthLabel}>{row.label}</Text>
                    <View style={[styles.healthBadge, { backgroundColor: getHealthColor(row.state) }]}>
                      <Text style={styles.healthBadgeText}>{row.state}</Text>
                    </View>
                  </View>
                  <Text style={styles.healthStatus}>{row.statusText}</Text>
                  <View style={styles.healthMeterRow}>
                    <ProgressBar current={row.current} target={row.target} color={getHealthColor(row.state)} />
                    <Text style={styles.healthMeterPct}>{pct}%</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </Section>

        <Section title="Bottlenecks">
          <View style={styles.card}>
            {bottlenecks.map((insight, index) => (
              <View key={`${index}-${insight}`} style={[styles.insightRow, index === bottlenecks.length - 1 && styles.lastRow]}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Production Overview">
          <CollapsibleCard
            title="Overview"
            summary={`${productionRows.length} product${productionRows.length === 1 ? '' : 's'}`}
          >
            <ProductionOverview rows={productionRows} />
          </CollapsibleCard>
        </Section>

        <Section title="Inventory">
          <View style={styles.card}>
            {inventoryRows.map((row) => (
              <InventoryRow
                key={row.key}
                title={row.title}
                subtitle={row.subtitle}
                actionLabel={row.actionLabel}
                disabled={row.disabled}
                onPress={row.onPress}
              />
            ))}
          </View>
        </Section>

        <Section title="Automation">
          <View style={styles.card}>
            <View style={styles.automationHeader}>
              <Text style={styles.automationTitle}>Auto-trade</Text>
              <Switch
                value={autoTrade.enabled}
                onValueChange={(value) => updateAutoTrade({ enabled: value })}
                trackColor={{ false: colors.creamBorder, true: colors.green }}
              />
            </View>
            {autoTrade.enabled && (
              <>
                <View style={styles.thresholdRow}>
                  <Text style={styles.thresholdLabel}>Buy crude below {autoTrade.buyThreshold}%</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}
                    >
                      <Text style={styles.stepperLabel}>-</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>{autoTrade.buyThreshold}%</Text>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => updateAutoTrade({ buyThreshold: Math.min(100, autoTrade.buyThreshold + 5) })}
                    >
                      <Text style={styles.stepperLabel}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.thresholdRow}>
                  <Text style={styles.thresholdLabel}>Sell gasoline above {autoTrade.sellThreshold}%</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}
                    >
                      <Text style={styles.stepperLabel}>-</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>{autoTrade.sellThreshold}%</Text>
                    <Pressable
                      style={styles.stepperButton}
                      onPress={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}
                    >
                      <Text style={styles.stepperLabel}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* One row per secondary product the player has a plant
                    for -- building e.g. a Lubricant Plant adds a "Sell
                    lubricants above X%" row, so Auto-trade covers it
                    without a manual sell-chip tap every few minutes.
                    Hidden for products with no plant built yet. */}
                {products
                  .filter((product) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[product.key]] > 0)
                  .map((product) => {
                    const threshold = autoTrade.productSellThresholds[product.key] ?? 80
                    return (
                      <View key={product.key} style={styles.thresholdRow}>
                        <Text style={styles.thresholdLabel}>
                          Sell {product.label.toLowerCase()} above {threshold}%
                        </Text>
                        <View style={styles.stepper}>
                          <Pressable
                            style={styles.stepperButton}
                            onPress={() => adjustProductSellThreshold(product.key, -5)}
                          >
                            <Text style={styles.stepperLabel}>-</Text>
                          </Pressable>
                          <Text style={styles.stepperValue}>{threshold}%</Text>
                          <Pressable
                            style={styles.stepperButton}
                            onPress={() => adjustProductSellThreshold(product.key, 5)}
                          >
                            <Text style={styles.stepperLabel}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    )
                  })}
              </>
            )}
          </View>

          {(derived.buildingCounts.lubricantPlant > 0 ||
            derived.buildingCounts.jetFuelPlant > 0 ||
            derived.buildingCounts.petrochemicalPlant > 0) && (
            <View style={styles.card}>
              <Text style={styles.automationTitle}>Feedstock Priority</Text>
              <Text style={styles.feedstockHint}>
                0% = off, 100% = normal, 200% = highest priority when feedstock is short.
              </Text>
              {(
                [
                  { buildingKey: 'lubricantPlant', label: 'Lubricants' },
                  { buildingKey: 'jetFuelPlant', label: 'Jet Fuel' },
                  { buildingKey: 'petrochemicalPlant', label: 'Petrochemicals' },
                ] as const
              ).map(
                ({ buildingKey, label }) =>
                  derived.buildingCounts[buildingKey] > 0 && (
                    <View key={buildingKey} style={styles.thresholdRow}>
                      <Text style={styles.thresholdLabel}>{label}</Text>
                      <View style={styles.stepper}>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => adjustFeedstockPriority(buildingKey, -1)}
                        >
                          <Text style={styles.stepperLabel}>-</Text>
                        </Pressable>
                        <Text style={styles.stepperValue}>
                          {Math.round(game.feedstockPriority[buildingKey] * 100)}%
                        </Text>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => adjustFeedstockPriority(buildingKey, 1)}
                        >
                          <Text style={styles.stepperLabel}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  ),
              )}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  healthRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  healthRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  healthLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  healthBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  healthStatus: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  healthMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  healthMeterPct: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.orange,
    marginTop: 5,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  inventoryText: {
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  inventorySubtitle: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  inventoryButton: {
    minWidth: 82,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  inventoryButtonDisabled: {
    backgroundColor: colors.white,
    borderColor: colors.creamBorder,
  },
  inventoryButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  automationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  automationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  feedstockHint: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  thresholdLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.inkMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  stepperValue: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    minWidth: 44,
    textAlign: 'center',
  },
})
