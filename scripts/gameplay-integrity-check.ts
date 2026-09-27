/**
 * Gameplay V3 integrity harness.
 *
 * Run diagnostic baseline:
 *   node --import tsx scripts/gameplay-integrity-check.ts
 * Require repaired R0 invariants:
 *   node --import tsx scripts/gameplay-integrity-check.ts --require-fixed
 *
 * This uses the real tick and derived-stat code. Constructed fixtures are not
 * evidence that a player can legally reach their configured level/economy.
 */
import assert from 'node:assert/strict'
import { tick } from '../src/game/utils/gameTick'
import {
  calculateDerivedStats,
  cellAcceptsSpecialist,
  createInitialGameState,
} from '../src/game/utils/gameCalculations'
import {
  getBuildingUpgradeCost,
  UPGRADEABLE_BUILDINGS,
} from '../src/game/data/buildingUpgrades'
import type { BuildingType, GameState, ProductKey } from '../src/game/types'

const REQUIRE_FIXED = process.argv.includes('--require-fixed')
const REQUIRE_ATOMIC = REQUIRE_FIXED || process.argv.includes('--require-atomic')

function fixture(buildings: BuildingType[], overrides: Partial<GameState> = {}): GameState {
  const game = createInitialGameState()
  const size = Math.max(9, buildings.length)
  return {
    ...game,
    refineryLevel: 30,
    grid: [...buildings, ...Array(size - buildings.length).fill(null)],
    gridLevels: Array(size).fill(1),
    productionProgress: 0,
    productInventory: {
      ...game.productInventory,
      asphalt: 0,
      jetFuel: 0,
      lubricants: 0,
      petrochemicals: 0,
      recycledMaterial: 0,
      plasticPellets: 0,
    },
    ...overrides,
  }
}

function atProductionCycle(game: GameState): GameState {
  return { ...game, tickCount: 24 }
}

function capacitiesAtLevels(building: BuildingType, levels: number[]): number[] {
  return levels.map((level) => {
    const game = fixture([building])
    game.gridLevels[0] = level
    const d = calculateDerivedStats(game)
    switch (building) {
      case 'powerPlant': return d.maxElectricityStorage
      case 'lubricantTank': return d.maxLubricantsStorage
      case 'jetFuelTank': return d.maxJetFuelStorage
      case 'petrochemicalTank': return d.maxPetrochemicalsStorage
      case 'recyclingBunker': return d.maxRecycledMaterialStorage
      case 'pelletSilo': return d.maxPlasticPelletsStorage
      default: throw new Error(`Unsupported capacity fixture: ${building}`)
    }
  })
}

function finiteAndNonnegative(game: GameState) {
  const values: [string, number][] = [
    ['money', game.money],
    ['crudeOil', game.crudeOil],
    ['gasoline', game.gasoline],
    ['feedstock', game.feedstock],
    ['electricity', game.electricity],
    ['waste', game.waste],
  ]
  for (const key of Object.keys(game.productInventory) as ProductKey[]) {
    values.push([`productInventory.${key}`, game.productInventory[key]])
  }
  for (const [name, value] of values) {
    assert.ok(Number.isFinite(value), `${name} must be finite, got ${value}`)
    assert.ok(value >= -1e-8, `${name} must be nonnegative, got ${value}`)
  }
}

const noGeneratorBefore = atProductionCycle(fixture(
  ['crudeTank', 'distillationUnit', 'lubricantPlant'],
  { crudeOil: 0, feedstock: 20, electricity: 0 },
))
const noGeneratorAfter = tick(noGeneratorBefore)

const dryGeneratorBefore = atProductionCycle(fixture(
  ['crudeTank', 'distillationUnit', 'lubricantPlant', 'powerPlant'],
  { crudeOil: 0, feedstock: 20, electricity: 0 },
))
const dryGeneratorAfter = tick(dryGeneratorBefore)

const powerCaps = capacitiesAtLevels('powerPlant', [1, 2, 3])
const tankTypes: BuildingType[] = [
  'lubricantTank',
  'jetFuelTank',
  'petrochemicalTank',
  'recyclingBunker',
  'pelletSilo',
]
const tankCaps = Object.fromEntries(tankTypes.map((type) => [type, capacitiesAtLevels(type, [1, 2, 3])]))

const currentAssignmentMatrix = {
  lubricantPlant: cellAcceptsSpecialist('lubricantPlant'),
  jetFuelPlant: cellAcceptsSpecialist('jetFuelPlant'),
  petrochemicalPlant: cellAcceptsSpecialist('petrochemicalPlant'),
  polymerPlant: cellAcceptsSpecialist('polymerPlant'),
  distillationUnit: cellAcceptsSpecialist('distillationUnit'),
}

const report = {
  mode: REQUIRE_FIXED ? 'required R0 invariants' : 'diagnostic baseline',
  constructedFixture: true,
  noGenerator: {
    feedstock: `${noGeneratorBefore.feedstock} -> ${noGeneratorAfter.feedstock}`,
    electricity: `${noGeneratorBefore.electricity} -> ${noGeneratorAfter.electricity}`,
    lubricants: `${noGeneratorBefore.productInventory.lubricants} -> ${noGeneratorAfter.productInventory.lubricants}`,
  },
  dryGenerator: {
    feedstock: `${dryGeneratorBefore.feedstock} -> ${dryGeneratorAfter.feedstock}`,
    electricity: `${dryGeneratorBefore.electricity} -> ${dryGeneratorAfter.electricity}`,
    lubricants: `${dryGeneratorBefore.productInventory.lubricants} -> ${dryGeneratorAfter.productInventory.lubricants}`,
  },
  capacityByLevel: { powerPlant: powerCaps, ...tankCaps },
  assignmentMatrix: currentAssignmentMatrix,
}

console.log(JSON.stringify(report, null, 2))

if (REQUIRE_ATOMIC) {
  const partialInputBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant'],
    { crudeOil: 0, feedstock: 3, electricity: 0 },
  ))
  const partialInputAfter = tick(partialInputBefore)
  assert.ok(Math.abs(partialInputAfter.feedstock) < 1e-8)
  assert.ok(Math.abs(partialInputAfter.productInventory.lubricants - 2.5) < 1e-8)

  const nearlyFullBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant'],
    {
      crudeOil: 0,
      feedstock: 20,
      electricity: 0,
      productInventory: {
        ...createInitialGameState().productInventory,
        lubricants: 199,
      },
    },
  ))
  const nearlyFullAfter = tick(nearlyFullBefore)
  assert.ok(Math.abs(nearlyFullAfter.productInventory.lubricants - 200) < 1e-8)
  assert.ok(Math.abs(nearlyFullAfter.feedstock - 18.8) < 1e-8)

  const fairFeedstockBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant', 'jetFuelPlant'],
    { crudeOil: 0, feedstock: 7, electricity: 20 },
  ))
  const fairFeedstockAfter = tick(fairFeedstockBefore)
  assert.ok(Math.abs(fairFeedstockAfter.productInventory.lubricants - 2.5) < 1e-8)
  assert.ok(Math.abs(fairFeedstockAfter.productInventory.jetFuel - 2.5) < 1e-8)

  const fairPowerBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant', 'jetFuelPlant', 'powerPlant'],
    { crudeOil: 0, feedstock: 20, electricity: 0 },
  ))
  const fairPowerAfter = tick(fairPowerBefore)
  assert.ok(Math.abs(fairPowerAfter.productInventory.lubricants - (20 / 7)) < 1e-8)
  assert.ok(Math.abs(fairPowerAfter.productInventory.jetFuel - (20 / 7)) < 1e-8)
  assert.ok(Math.abs(fairPowerAfter.feedstock - 12) < 1e-8)
  assert.ok(Math.abs(fairPowerAfter.electricity) < 1e-8)

  const polymerFairBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant', 'polymerPlant', 'powerPlant'],
    {
      crudeOil: 0,
      feedstock: 20,
      electricity: 0,
      productInventory: {
        ...createInitialGameState().productInventory,
        petrochemicals: 20,
      },
    },
  ))
  const polymerFairAfter = tick(polymerFairBefore)
  assert.ok(Math.abs(polymerFairAfter.productInventory.lubricants - (20 / 9)) < 1e-8)
  assert.ok(Math.abs(polymerFairAfter.productInventory.plasticPellets - (20 / 9)) < 1e-8)
  assert.ok(Math.abs(polymerFairAfter.feedstock - (20 - (8 / 3))) < 1e-8)
  assert.ok(Math.abs(polymerFairAfter.productInventory.petrochemicals - (20 - (8 / 3))) < 1e-8)
  finiteAndNonnegative(partialInputAfter)
  finiteAndNonnegative(nearlyFullAfter)
  finiteAndNonnegative(fairFeedstockAfter)
  finiteAndNonnegative(fairPowerAfter)
  finiteAndNonnegative(polymerFairAfter)
  console.log('PASS: V3-01 atomic partial-work and fair-allocation invariants')
}

if (REQUIRE_FIXED) {
  finiteAndNonnegative(noGeneratorAfter)
  finiteAndNonnegative(dryGeneratorAfter)
  assert.ok(dryGeneratorAfter.productInventory.lubricants > 0, 'permanent site supply must restart one advanced plant')
  assert.ok(dryGeneratorAfter.electricity >= 0, 'power can never become negative')

  const fullLubeBefore = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'lubricantPlant'],
    {
      crudeOil: 0,
      feedstock: 20,
      electricity: 0,
      productInventory: {
        ...createInitialGameState().productInventory,
        lubricants: 200,
      },
    },
  ))
  const fullLubeAfter = tick(fullLubeBefore)
  assert.equal(fullLubeAfter.feedstock, fullLubeBefore.feedstock, 'zero output must consume zero feedstock')

  const generationByLevel = [1, 2, 3].map((level) => {
    const before = atProductionCycle(fixture(['powerPlant'], { crudeOil: 100, electricity: 0 }))
    before.gridLevels[0] = level
    before.gasoline = calculateDerivedStats(before).maxGasolineStorage
    const after = tick(before)
    return { electricity: after.electricity, crudeUsed: before.crudeOil - after.crudeOil }
  })
  assert.deepEqual(generationByLevel, [
    { electricity: 16, crudeUsed: 1 },
    { electricity: 28, crudeUsed: 2 },
    { electricity: 46, crudeUsed: 3 },
  ], 'site and generator output/fuel must follow the V3 level table')

  const fullBatteryBefore = atProductionCycle(fixture(['powerPlant'], { crudeOil: 100 }))
  fullBatteryBefore.gasoline = calculateDerivedStats(fullBatteryBefore).maxGasolineStorage
  fullBatteryBefore.electricity = calculateDerivedStats(fullBatteryBefore).maxElectricityStorage
  const fullBatteryAfter = tick(fullBatteryBefore)
  assert.equal(fullBatteryAfter.crudeOil, fullBatteryBefore.crudeOil, 'a full battery must not burn generator fuel')

  const gasWithoutGenerator = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit'],
    { crudeOil: 100, gasoline: 0 },
  ))
  const gasWithGenerator = atProductionCycle(fixture(
    ['crudeTank', 'distillationUnit', 'powerPlant'],
    { crudeOil: 100, gasoline: 0 },
  ))
  const gasA = tick(gasWithoutGenerator)
  const gasB = tick(gasWithGenerator)
  assert.equal(gasB.totalGasolineProduced, gasA.totalGasolineProduced, 'gasoline output must not depend on electricity')

  assert.ok(powerCaps[1] > powerCaps[0] && powerCaps[2] > powerCaps[1], 'power capacity must increase by level')
  for (const [type, caps] of Object.entries(tankCaps)) {
    assert.ok(caps[1] > caps[0] && caps[2] > caps[1], `${type} capacity must increase by level`)
  }
  const mixedTankLevels = fixture(['lubricantTank', 'lubricantTank'])
  mixedTankLevels.gridLevels = [1, 2, ...mixedTankLevels.gridLevels.slice(2)]
  assert.equal(
    calculateDerivedStats(mixedTankLevels).maxLubricantsStorage,
    200 + 75 + 190,
    'each tank cell must contribute its own level capacity',
  )
  assert.deepEqual(currentAssignmentMatrix, {
    lubricantPlant: false,
    jetFuelPlant: true,
    petrochemicalPlant: true,
    polymerPlant: true,
    distillationUnit: false,
  }, 'R0 keeps truthful current specialist eligibility; Operator/Lube arrives in V3-06')
  for (const type of ['powerPlant', ...tankTypes] as BuildingType[]) {
    assert.ok(UPGRADEABLE_BUILDINGS.includes(type), `${type} must be routed through the central upgrade capability`)
    assert.ok((getBuildingUpgradeCost(type, 1) ?? 0) > 0, `${type} Lv1 must have an upgrade cost`)
    assert.ok((getBuildingUpgradeCost(type, 2) ?? 0) > 0, `${type} Lv2 must have an upgrade cost`)
    assert.equal(getBuildingUpgradeCost(type, 3), null, `${type} Lv3 must be max level`)
  }
  console.log('PASS: required R0 integrity invariants')
} else {
  console.log('DIAGNOSTIC ONLY: known failures above are expected before V3-01/V3-02')
}
