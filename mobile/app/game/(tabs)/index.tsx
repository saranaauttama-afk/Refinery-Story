import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import BuildingGrid from '../../../src/components/BuildingGrid'
import ListRow from '../../../src/components/ListRow'
import ResourceBar from '../../../src/components/ResourceBar'
import Sheet from '../../../src/components/Sheet'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing } from '../../../src/theme'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { BUILDING_UPGRADE_BALANCE } from '../../../src/game/data/balance'
import type { BuildingType } from '../../../src/game/types'
import {
  CRUDE_COST,
  getProductSellPrice,
  getSeasonLabel,
  getUpgradeCost,
} from '../../../src/game/utils/gameCalculations'

const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingType[]
const UPGRADEABLE: BuildingType[] = ['crudeTank', 'distillationUnit', 'productTank']

export default function RefineryScreen() {
  const {
    game,
    loaded,
    derived,
    buyCrude,
    sellGasoline,
    sellProduct,
    placeBuilding,
    upgradeBuilding,
    upgradeRefinery,
  } = useGame()
  const { width } = useWindowDimensions()
  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [upgradeCell, setUpgradeCell] = useState<number | null>(null)

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct = Math.round(derived.seasonalGasolineMultiplier * 100)

  const stats = [
    { label: 'Money', value: `$${Math.floor(game.money).toLocaleString()}`, color: colors.gold },
    { label: 'Crude', value: `${game.crudeOil}/${derived.maxCrudeStorage}`, color: colors.steelDark },
    { label: 'Feedstock', value: `${game.feedstock}/${derived.maxFeedstockStorage}`, color: colors.steelMid },
    { label: 'Gasoline', value: `${game.gasoline}/${derived.maxGasolineStorage}`, color: colors.green },
    { label: 'ESG', value: `${Math.round(game.esgScore)}`, color: colors.teal },
    { label: 'Season', value: `${seasonPct}%`, color: colors.orange },
  ]

  const handleCellPress = (index: number) => {
    const cell = game.grid[index]
    if (cell === null) {
      setPickerCell(index)
    } else if (UPGRADEABLE.includes(cell)) {
      setUpgradeCell(index)
    }
  }

  const upgradeCost = getUpgradeCost(game.refineryLevel)

  const products: { key: 'lubricants' | 'jetFuel' | 'petrochemicals'; label: string; color: string }[] = [
    { key: 'lubricants', label: 'Lubricants', color: colors.goldDark },
    { key: 'jetFuel', label: 'Jet Fuel', color: colors.blue },
    { key: 'petrochemicals', label: 'Petrochem', color: colors.purple },
  ]

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => upgradeRefinery()}>
          <Text style={styles.title}>
            {game.refineryName} · Lv{game.refineryLevel}
          </Text>
          <Text style={styles.subtitle}>
            Tap to upgrade · ${upgradeCost.toLocaleString()}
            {game.money < upgradeCost ? ' (need more $)' : ''}
          </Text>
        </Pressable>
        <Text style={styles.season}>{seasonLabel.en}</Text>
      </View>

      <ResourceBar stats={stats} />

      <View style={styles.gridWrap}>
        <BuildingGrid
          grid={game.grid}
          gridLevels={game.gridLevels}
          containerWidth={width - spacing.lg * 2}
          onCellPress={handleCellPress}
        />
        <Text style={styles.hint}>Tap an empty tile to build · tap a tank/unit to upgrade</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.buyButton]} onPress={() => buyCrude(10)}>
          <Text style={styles.actionLabel}>Buy 10 Crude</Text>
          <Text style={styles.actionSub}>${CRUDE_COST}/unit</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.sellButton]} onPress={() => sellGasoline(10)}>
          <Text style={styles.actionLabel}>Sell 10 Gas</Text>
          <Text style={styles.actionSub}>${derived.sellPrice}/unit</Text>
        </Pressable>
      </View>

      <View style={styles.productsWrap}>
        {products.map((p) => {
          const have = game.productInventory[p.key]
          const price = getProductSellPrice(
            p.key,
            derived.productSellMultiplier,
            p.key === 'petrochemicals' ? game.petrochemicalsDemandMultiplier : 1,
          )
          return (
            <Pressable
              key={p.key}
              style={[styles.productChip, { borderColor: p.color, opacity: have > 0 ? 1 : 0.5 }]}
              disabled={have <= 0}
              onPress={() => sellProduct(p.key, have)}
            >
              <Text style={[styles.productLabel, { color: p.color }]}>{p.label}</Text>
              <Text style={styles.productValue}>
                {have} · sell @${price}
              </Text>
            </Pressable>
          )
        })}
      </View>


      {/* Build picker */}
      <Sheet visible={pickerCell !== null} title="Build" onClose={() => setPickerCell(null)}>
        {BUILDING_KEYS.map((key) => {
          const b = BUILDINGS[key]
          const unlockLevel = b.unlockLevel ?? 1
          const locked = game.refineryLevel < unlockLevel
          const affordable = game.money >= b.cost
          return (
            <ListRow
              key={key}
              title={b.name.en}
              subtitle={locked ? `Requires refinery Lv${unlockLevel}` : `$${b.cost.toLocaleString()}`}
              actionLabel="Build"
              disabled={locked || !affordable}
              onPress={() => {
                if (pickerCell !== null) placeBuilding(pickerCell, key)
                setPickerCell(null)
              }}
            />
          )
        })}
      </Sheet>

      {/* Upgrade modal */}
      <Sheet visible={upgradeCell !== null} title="Upgrade building" onClose={() => setUpgradeCell(null)}>
        {(() => {
          if (upgradeCell === null) return null
          const cell = game.grid[upgradeCell]
          if (!cell) return null
          const level = game.gridLevels[upgradeCell] ?? 1
          const maxed = level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
          const cost =
            level === 1
              ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost
              : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
          return (
            <ListRow
              title={`${BUILDINGS[cell].name.en} (Lv${level})`}
              subtitle={maxed ? 'Max level' : `Upgrade to Lv${level + 1} · $${cost.toLocaleString()}`}
              actionLabel="Upgrade"
              disabled={maxed || game.money < cost}
              done={maxed}
              onPress={() => {
                upgradeBuilding(upgradeCell)
                setUpgradeCell(null)
              }}
            />
          )
        })()}
      </Sheet>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  season: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: '700',
    marginTop: 4,
  },
  gridWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  buyButton: {
    backgroundColor: colors.steelLight,
  },
  sellButton: {
    backgroundColor: colors.green,
  },
  actionLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  actionSub: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  productsWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  productChip: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  productLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  productValue: {
    fontSize: 11,
    color: colors.ink,
    marginTop: 2,
  },
})
