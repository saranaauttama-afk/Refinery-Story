import { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import FactoryDiamondGroundView from '../src/components/FactoryDiamondGroundView'
import type { BuildingType, GameState, GridCell } from '../src/game/types'
import { calculateDerivedStats, createInitialGameState } from '../src/game/utils/gameCalculations'
import { useGame } from '../src/hooks/GameContext'
import { colors, radii, spacing } from '../src/theme'

type VariantKey = 'empty' | 'mid' | 'large' | 'stress'

type Scenario = {
  key: VariantKey
  title: string
  caption: string
  game: GameState
}

const STRESS_BUILDINGS: BuildingType[] = [
  'crudeTank',
  'distillationUnit',
  'productTank',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
  'powerPlant',
  'laboratory',
  'maintenanceWorkshop',
  'salesOffice',
  'wasteTreatmentPlant',
  'polymerPlant',
  'lubricantTank',
  'jetFuelTank',
  'petrochemicalTank',
  'recyclingBunker',
  'pelletSilo',
]

function createScenarioShell(size: number, refineryLevel: number, gridExpansionLevel = 0) {
  const base = createInitialGameState()

  return {
    ...base,
    refineryLevel,
    gridExpansionLevel,
    grid: Array(size * size).fill(null) as GridCell[],
    gridLevels: Array(size * size).fill(1),
  }
}

function placeBuilding(game: GameState, index: number, type: BuildingType, level = 1) {
  game.grid[index] = type
  game.gridLevels[index] = level
}

function createEmptyScenario(): Scenario {
  const game = createScenarioShell(3, 1, 0)
  game.money = 200
  game.crudeOil = 5

  return {
    key: 'empty',
    title: 'Empty refinery (Lv1)',
    caption: '3x3 starting plot with clean diamond lots and no occupied markers.',
    game,
  }
}

function createMidScenario(): Scenario {
  const game = createScenarioShell(5, 12, 2)
  game.money = 182500
  game.crudeOil = 44
  game.gasoline = 126
  game.feedstock = 38
  game.electricity = 24
  game.waste = 8
  game.totalGasolineProduced = 8600

  placeBuilding(game, 0, 'crudeTank', 2)
  placeBuilding(game, 1, 'distillationUnit', 3)
  placeBuilding(game, 2, 'productTank', 2)
  placeBuilding(game, 4, 'powerPlant', 1)
  placeBuilding(game, 5, 'lubricantPlant', 2)
  placeBuilding(game, 6, 'laboratory', 2)
  placeBuilding(game, 7, 'maintenanceWorkshop', 2)
  placeBuilding(game, 8, 'jetFuelPlant', 2)
  placeBuilding(game, 10, 'crudeTank', 1)
  placeBuilding(game, 11, 'distillationUnit', 2)
  placeBuilding(game, 12, 'salesOffice', 2)
  placeBuilding(game, 13, 'lubricantTank', 1)
  placeBuilding(game, 14, 'jetFuelTank', 1)
  placeBuilding(game, 16, 'petrochemicalPlant', 2)
  placeBuilding(game, 17, 'productTank', 2)
  placeBuilding(game, 18, 'wasteTreatmentPlant', 1)
  placeBuilding(game, 22, 'petrochemicalTank', 1)

  return {
    key: 'mid',
    title: 'Mid-game refinery',
    caption: '5x5 world using fixed-size tiles so expansion reads as a larger place, not a smaller widget.',
    game,
  }
}

function createLargeScenario(): Scenario {
  const game = createScenarioShell(6, 23, 3)
  game.money = 925000
  game.crudeOil = 132
  game.gasoline = 460
  game.feedstock = 84
  game.electricity = 58
  game.waste = 22
  game.totalGasolineProduced = 48200

  placeBuilding(game, 0, 'crudeTank', 3)
  placeBuilding(game, 1, 'distillationUnit', 3)
  placeBuilding(game, 2, 'productTank', 3)
  placeBuilding(game, 3, 'powerPlant', 2)
  placeBuilding(game, 4, 'lubricantTank', 2)
  placeBuilding(game, 5, 'jetFuelTank', 2)
  placeBuilding(game, 6, 'crudeTank', 2)
  placeBuilding(game, 7, 'distillationUnit', 3)
  placeBuilding(game, 8, 'lubricantPlant', 3)
  placeBuilding(game, 9, 'jetFuelPlant', 3)
  placeBuilding(game, 10, 'petrochemicalPlant', 2)
  placeBuilding(game, 11, 'polymerPlant', 2)
  placeBuilding(game, 12, 'productTank', 2)
  placeBuilding(game, 13, 'laboratory', 3)
  placeBuilding(game, 14, 'maintenanceWorkshop', 2)
  placeBuilding(game, 15, 'salesOffice', 2)
  placeBuilding(game, 16, 'powerPlant', 1)
  placeBuilding(game, 17, 'wasteTreatmentPlant', 2)
  placeBuilding(game, 18, 'petrochemicalTank', 2)
  placeBuilding(game, 19, 'pelletSilo', 1)
  placeBuilding(game, 20, 'recyclingBunker', 1)
  placeBuilding(game, 21, 'lubricantTank', 1)
  placeBuilding(game, 22, 'jetFuelTank', 1)
  placeBuilding(game, 23, 'crudeTank', 1)
  placeBuilding(game, 25, 'distillationUnit', 2)
  placeBuilding(game, 26, 'polymerPlant', 3)
  placeBuilding(game, 27, 'petrochemicalPlant', 3)
  placeBuilding(game, 28, 'productTank', 2)
  placeBuilding(game, 29, 'powerPlant', 1)
  placeBuilding(game, 31, 'wasteTreatmentPlant', 1)
  placeBuilding(game, 32, 'maintenanceWorkshop', 1)
  placeBuilding(game, 33, 'salesOffice', 1)
  placeBuilding(game, 34, 'pelletSilo', 2)

  return {
    key: 'large',
    title: 'Large refinery',
    caption: '6x6 world showing fixed tile scale, denser markers, and a naturally larger footprint.',
    game,
  }
}

function createStressScenario(): Scenario {
  const size = 10
  const game = createScenarioShell(size, 30, 3)
  game.money = 2500000
  game.crudeOil = 240
  game.gasoline = 980
  game.feedstock = 220
  game.electricity = 180
  game.waste = 54
  game.totalGasolineProduced = 125000

  for (let index = 0; index < game.grid.length; index += 1) {
    if (index % 4 === 1) continue
    const building = STRESS_BUILDINGS[index % STRESS_BUILDINGS.length]
    const level = (index % 3) + 1
    placeBuilding(game, index, building, level)
  }

  return {
    key: 'stress',
    title: 'Stress world (10x10)',
    caption: 'Scale test only. This mock 10x10 layout is intentionally larger than the viewport to evaluate world growth.',
    game,
  }
}

function getScenario(variant: string | string[] | undefined): Scenario {
  const key = typeof variant === 'string' ? variant : 'empty'

  switch (key) {
    case 'mid':
      return createMidScenario()
    case 'large':
      return createLargeScenario()
    case 'stress':
      return createStressScenario()
    default:
      return createEmptyScenario()
  }
}

const VARIANT_OPTIONS: { key: VariantKey; label: string }[] = [
  { key: 'empty', label: '3x3' },
  { key: 'mid', label: '5x5' },
  { key: 'large', label: '6x6' },
  { key: 'stress', label: '10x10' },
]

export default function DiamondGroundPrototypeScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ variant?: string }>()
  const { width } = useWindowDimensions()
  const {
    dismissAward,
    dismissComboDiscovery,
    dismissEraBanner,
    dismissHiddenEventUnlock,
    dismissWinCelebration,
  } = useGame()
  const scenario = getScenario(params.variant)
  const derived = calculateDerivedStats(scenario.game)
  const viewportWidth = Math.min(width - spacing.lg * 2, 520)

  useEffect(() => {
    dismissAward()
    dismissComboDiscovery()
    dismissEraBanner()
    dismissHiddenEventUnlock()
    dismissWinCelebration()
  }, [dismissAward, dismissComboDiscovery, dismissEraBanner, dismissHiddenEventUnlock, dismissWinCelebration])

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Prototype only</Text>
          <Text style={styles.title}>Diamond Ground Projection</Text>
          <Text style={styles.subtitle}>
            Live Factory stays on `grid`. This route exists only to review clean projection and fixed world scale.
          </Text>
        </View>

        <View style={styles.switcher}>
          {VARIANT_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.switcherButton, option.key === scenario.key && styles.switcherButtonActive]}
              onPress={() => router.replace({ pathname: '/diamond-ground-prototype', params: { variant: option.key } })}
            >
              <Text style={[styles.switcherLabel, option.key === scenario.key && styles.switcherLabelActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View nativeID={`scenario-${scenario.key}`} style={styles.previewCard}>
          <Text style={styles.previewTitle}>{scenario.title}</Text>
          <Text style={styles.previewCaption}>{scenario.caption}</Text>

          <View style={[styles.previewViewport, { width: viewportWidth }]}>
            <FactoryDiamondGroundView
              game={scenario.game}
              derived={derived}
              grid={scenario.game.grid}
              gridLevels={scenario.game.gridLevels}
              containerWidth={viewportWidth}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  header: {
    width: '100%',
    maxWidth: 560,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 234, 215, 0.94)',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  backLabel: {
    color: colors.ink,
    fontWeight: '800',
  },
  eyebrow: {
    color: colors.orangeDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  switcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 560,
  },
  switcherButton: {
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  switcherButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  switcherLabel: {
    color: colors.ink,
    fontWeight: '800',
  },
  switcherLabelActive: {
    color: colors.white,
  },
  previewCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#F8F1E5',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  previewCaption: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  previewViewport: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'visible',
    borderRadius: radii.md,
    backgroundColor: '#D7C39D',
    borderWidth: 1,
    borderColor: '#B39972',
    padding: spacing.md,
  },
})
