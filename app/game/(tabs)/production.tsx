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
    produceAsphalt,
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


  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* ── Dark header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Production</Text>
        <View style={styles.headerStats}>
          <View style={styles.hStat}>
            <Text style={styles.hStatVal}>{game.crudeOil}</Text>
            <Text style={styles.hStatLabel}>🛢 Crude</Text>
          </View>
          <View style={styles.hStatDiv} />
          <View style={styles.hStat}>
            <Text style={styles.hStatVal}>{game.feedstock}</Text>
            <Text style={styles.hStatLabel}>⚗️ Feed</Text>
          </View>
          <View style={styles.hStatDiv} />
          <View style={styles.hStat}>
            <Text style={styles.hStatVal}>{game.gasoline}</Text>
            <Text style={styles.hStatLabel}>⛽ Gas</Text>
          </View>
          {game.electricity > 0 && (
            <>
              <View style={styles.hStatDiv} />
              <View style={styles.hStat}>
                <Text style={styles.hStatVal}>{game.electricity}</Text>
                <Text style={styles.hStatLabel}>⚡ Power</Text>
              </View>
            </>
          )}
          {bottlenecks.length > 0 && (
            <>
              <View style={styles.hStatDiv} />
              <View style={styles.hStat}>
                <Text style={[styles.hStatVal, { color: colors.orange }]}>{bottlenecks.length}</Text>
                <Text style={styles.hStatLabel}>⚠ Issues</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>

        {/* ── Live Status ── */}
        <Text style={styles.sectionLabel}>Live Status</Text>
        <View style={styles.statusGrid}>
          {healthRows.map((row) => {
            const pct = row.target > 0 ? Math.min(100, Math.round((row.current / row.target) * 100)) : 0
            const color = getHealthColor(row.state)
            return (
              <View key={row.key} style={styles.statusCard}>
                <View style={styles.statusCardTop}>
                  <Text style={styles.statusCardLabel}>{row.label}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: color }]}>
                    <Text style={styles.statusBadgeText}>{row.state}</Text>
                  </View>
                </View>
                <View style={styles.statusBar}>
                  <View style={[styles.statusBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={styles.statusNote} numberOfLines={2}>{row.statusText}</Text>
              </View>
            )
          })}
        </View>

        {/* Bottleneck alerts */}
        {bottlenecks.length > 0 && (
          <View style={styles.alertBox}>
            {bottlenecks.map((b, i) => (
              <View key={i} style={styles.alertRow}>
                <Text style={styles.alertDot}>⚠</Text>
                <Text style={styles.alertText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Products ── */}
        <Text style={styles.sectionLabel}>Inventory</Text>

        {/* Gasoline */}
        <View style={styles.productCard}>
          <View style={styles.productCardTop}>
            <View style={styles.productCardLeft}>
              <Text style={styles.productName}>⛽ Gasoline</Text>
              <Text style={styles.productSub}>{game.gasoline} / {derived.maxGasolineStorage} · sold from Factory</Text>
            </View>
            <Text style={[styles.productPct, { color: colors.green }]}>
              {derived.maxGasolineStorage > 0 ? Math.round((game.gasoline / derived.maxGasolineStorage) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.productBar}>
            <View style={[styles.productBarFill, {
              width: `${derived.maxGasolineStorage > 0 ? Math.min(100, Math.round((game.gasoline / derived.maxGasolineStorage) * 100)) : 0}%` as any,
              backgroundColor: colors.green,
            }]} />
          </View>
        </View>

        {/* Secondary products with plant built */}
        {products
          .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
          .map((product) => {
            const stock = game.productInventory[product.key]
            const max = getProductMaxStorage(derived, product.key)
            const price = getProductSellPrice(
              product.key,
              derived.productSellMultiplier,
              product.key === 'petrochemicals' ? game.petrochemicalsDemandMultiplier : 1,
            )
            const pct = max > 0 ? Math.min(100, Math.round((stock / max) * 100)) : 0
            return (
              <View key={product.key} style={styles.productCard}>
                <View style={styles.productCardTop}>
                  <View style={styles.productCardLeft}>
                    <Text style={styles.productName}>{product.label}</Text>
                    <Text style={styles.productSub}>{stock} / {max} · ${price}/unit</Text>
                  </View>
                  <AnimatedPressable
                    style={[styles.sellBtn, stock <= 0 && styles.sellBtnDisabled]}
                    onPress={() => {
                      if (stock > 0) {
                        spawnFloat(`+$${(stock * price).toLocaleString()}`, 'income')
                        haptics.tap()
                      }
                      sellProduct(product.key, stock)
                    }}
                  >
                    <Text style={styles.sellBtnLabel}>{stock <= 0 ? 'Empty' : 'Sell All'}</Text>
                  </AnimatedPressable>
                </View>
                <View style={styles.productBar}>
                  <View style={[styles.productBarFill, {
                    width: `${pct}%` as any,
                    backgroundColor: product.color,
                  }]} />
                </View>
              </View>
            )
          })}

        {/* Asphalt */}
        {game.refineryLevel >= ASPHALT_BALANCE.unlockLevel && (
          <View style={styles.productCard}>
            <View style={styles.productCardTop}>
              <View style={styles.productCardLeft}>
                <Text style={styles.productName}>🛣 Asphalt</Text>
                <Text style={styles.productSub}>{game.productInventory.asphalt} / {ASPHALT_BALANCE.maxStorage} · via contracts</Text>
              </View>
              <View style={styles.asphaltBtns}>
                <AnimatedPressable
                  style={[styles.asphaltBtn, game.crudeOil < ASPHALT_BALANCE.batchSize && styles.asphaltBtnOff]}
                  onPress={() => produceAsphalt(ASPHALT_BALANCE.batchSize)}
                >
                  <Text style={styles.asphaltBtnLabel}>+{ASPHALT_BALANCE.batchSize}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[styles.asphaltBtn, game.crudeOil < ASPHALT_BALANCE.largeBatchSize && styles.asphaltBtnOff]}
                  onPress={() => produceAsphalt(ASPHALT_BALANCE.largeBatchSize)}
                >
                  <Text style={styles.asphaltBtnLabel}>+{ASPHALT_BALANCE.largeBatchSize}</Text>
                </AnimatedPressable>
              </View>
            </View>
            <View style={styles.productBar}>
              <View style={[styles.productBarFill, {
                width: `${ASPHALT_BALANCE.maxStorage > 0 ? Math.min(100, Math.round((game.productInventory.asphalt / ASPHALT_BALANCE.maxStorage) * 100)) : 0}%` as any,
                backgroundColor: '#8A7A5A',
              }]} />
            </View>
          </View>
        )}

        {/* ── Automation ── */}
        <Text style={styles.sectionLabel}>Automation</Text>
        <View style={styles.autoCard}>
          <View style={styles.autoRow}>
            <View>
              <Text style={styles.autoRowTitle}>Auto-trade</Text>
              <Text style={styles.autoRowSub}>Buys crude and sells gas automatically</Text>
            </View>
            <Switch
              value={autoTrade.enabled}
              onValueChange={(v) => updateAutoTrade({ enabled: v })}
              trackColor={{ false: colors.creamBorder, true: colors.green }}
            />
          </View>

          {autoTrade.enabled && (
            <>
              <View style={styles.autoDivider} />
              {/* Crude buy threshold */}
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Buy crude below</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}>
                    <Text style={styles.stepBtnLabel}>−</Text>
                  </Pressable>
                  <Text style={styles.stepVal}>{autoTrade.buyThreshold}%</Text>
                  <Pressable style={styles.stepBtn} onPress={() => updateAutoTrade({ buyThreshold: Math.min(100, autoTrade.buyThreshold + 5) })}>
                    <Text style={styles.stepBtnLabel}>+</Text>
                  </Pressable>
                </View>
              </View>
              {/* Gas sell threshold */}
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Sell gasoline above</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}>
                    <Text style={styles.stepBtnLabel}>−</Text>
                  </Pressable>
                  <Text style={styles.stepVal}>{autoTrade.sellThreshold}%</Text>
                  <Pressable style={styles.stepBtn} onPress={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}>
                    <Text style={styles.stepBtnLabel}>+</Text>
                  </Pressable>
                </View>
              </View>
              {/* Per-product auto-sell */}
              {products
                .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
                .map((product) => {
                  const threshold = autoTrade.productSellThresholds[product.key] ?? 80
                  return (
                    <View key={product.key} style={styles.thresholdRow}>
                      <Text style={styles.thresholdLabel}>Sell {product.label.toLowerCase()} above</Text>
                      <View style={styles.stepper}>
                        <Pressable style={styles.stepBtn} onPress={() => adjustProductSellThreshold(product.key, -5)}>
                          <Text style={styles.stepBtnLabel}>−</Text>
                        </Pressable>
                        <Text style={styles.stepVal}>{threshold}%</Text>
                        <Pressable style={styles.stepBtn} onPress={() => adjustProductSellThreshold(product.key, 5)}>
                          <Text style={styles.stepBtnLabel}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  )
                })}
            </>
          )}
        </View>

        {/* Feedstock Priority */}
        {(derived.buildingCounts.lubricantPlant > 0 ||
          derived.buildingCounts.jetFuelPlant > 0 ||
          derived.buildingCounts.petrochemicalPlant > 0) && (
          <View style={[styles.autoCard, { marginTop: spacing.xs }]}>
            <Text style={styles.autoRowTitle}>Feedstock Priority</Text>
            <Text style={styles.autoRowSub}>0% = off · 100% = normal · 200% = priority</Text>
            <View style={styles.autoDivider} />
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
                      <Pressable style={styles.stepBtn} onPress={() => adjustFeedstockPriority(buildingKey, -1)}>
                        <Text style={styles.stepBtnLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>
                        {Math.round(game.feedstockPriority[buildingKey] * 100)}%
                      </Text>
                      <Pressable style={styles.stepBtn} onPress={() => adjustFeedstockPriority(buildingKey, 1)}>
                        <Text style={styles.stepBtnLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ),
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: '#1C2634',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  hStat: { flex: 1, alignItems: 'center' },
  hStatVal: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  hStatLabel: { fontSize: 8, color: '#6B8099', marginTop: 1 },
  hStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },

  // List
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.xs },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  // Status grid (2 columns)
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statusCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
  },
  statusCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusCardLabel: { fontSize: 12, fontWeight: '800', color: colors.ink },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  statusBar: { height: 4, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden', marginBottom: 4 },
  statusBarFill: { height: '100%', borderRadius: radii.pill },
  statusNote: { fontSize: 10, color: colors.inkMuted, lineHeight: 14 },

  // Alert box
  alertBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.orange,
    padding: spacing.sm,
    gap: 4,
  },
  alertRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  alertDot: { fontSize: 11, color: colors.orange },
  alertText: { flex: 1, fontSize: 12, color: colors.ink, lineHeight: 16 },

  // Product cards
  productCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    padding: spacing.sm,
  },
  productCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productCardLeft: { flex: 1, marginRight: spacing.sm },
  productName: { fontSize: 13, fontWeight: '800', color: colors.ink },
  productSub: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  productPct: { fontSize: 16, fontWeight: '900' },
  productBar: { height: 6, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden' },
  productBarFill: { height: '100%', borderRadius: radii.pill },

  // Sell button
  sellBtn: {
    backgroundColor: colors.green,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sellBtnDisabled: { backgroundColor: colors.creamBorder },
  sellBtnLabel: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Asphalt produce buttons
  asphaltBtns: { flexDirection: 'row', gap: spacing.xs },
  asphaltBtn: {
    backgroundColor: '#8A7A5A',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  asphaltBtnOff: { opacity: 0.35 },
  asphaltBtnLabel: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Automation card
  autoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    padding: spacing.md,
  },
  autoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autoRowTitle: { fontSize: 13, fontWeight: '800', color: colors.ink },
  autoRowSub: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  autoDivider: { height: 1, backgroundColor: colors.creamBorder, marginVertical: spacing.sm },

  // Threshold stepper rows
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  thresholdLabel: { flex: 1, fontSize: 12, color: colors.inkMuted, paddingRight: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 28, height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: { fontSize: 16, fontWeight: '800', color: colors.ink },
  stepVal: { fontSize: 12, fontWeight: '800', color: colors.ink, minWidth: 42, textAlign: 'center' },
})
