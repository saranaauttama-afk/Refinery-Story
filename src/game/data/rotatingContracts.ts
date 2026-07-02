import type { GameState, ProductKey, RotatingContract } from '../types'
import { ECONOMY_BALANCE, ROTATING_CONTRACT_BALANCE } from './balance'

// --- Rotating "Rush Orders" ---
// Transient, time-limited premium contracts. They appear on their own, pay a
// premium over the goods' raw sell value, and expire if not filled in time.
// Held live in GameState.rotatingContracts; spawned/expired in the tick loop
// (useGameLoop) and removed on completion. Kept RN-free so the headless sim
// could exercise them if wired in.

// Per-product raw unit value (what a rush order's reward is scaled off of).
const PRODUCT_UNIT_VALUE: Record<ProductKey, number> = {
  gasoline: ECONOMY_BALANCE.gasolinePrice,
  asphalt: ECONOMY_BALANCE.gasolinePrice, // no dedicated asphalt price; treat like gasoline
  jetFuel: ECONOMY_BALANCE.jetFuelPrice,
  lubricants: ECONOMY_BALANCE.lubricantPrice,
  petrochemicals: ECONOMY_BALANCE.petrochemicalsPrice,
  recycledMaterial: ECONOMY_BALANCE.recycledMaterialPrice,
  plasticPellets: ECONOMY_BALANCE.plasticPelletsPrice,
}

// Which building unlocks a rush order for a given product. Gasoline is always
// eligible (the distillation core); the rest require the producing plant so an
// offer is never for something the player can't make.
const PRODUCT_REQUIRED_BUILDING: { product: ProductKey; building: GameState['grid'][number] }[] = [
  { product: 'gasoline', building: null }, // always eligible
  { product: 'jetFuel', building: 'jetFuelPlant' },
  { product: 'lubricants', building: 'lubricantPlant' },
  { product: 'petrochemicals', building: 'petrochemicalPlant' },
  { product: 'plasticPellets', building: 'polymerPlant' },
  { product: 'recycledMaterial', building: 'wasteTreatmentPlant' },
]

// Products the player can currently be asked for, given what they've built.
function eligibleProducts(game: GameState): ProductKey[] {
  const built = new Set(game.grid.filter((c) => c !== null))
  return PRODUCT_REQUIRED_BUILDING.filter(
    (e) => e.building === null || built.has(e.building),
  ).map((e) => e.product)
}

// How much of `productKey` the player currently holds (gasoline lives on its
// own field; everything else in productInventory).
export function getRotatingContractHave(game: GameState, productKey: ProductKey): number {
  return productKey === 'gasoline' ? game.gasoline : (game.productInventory[productKey] ?? 0)
}

// Build one rush order scaled to the current refinery level, for a random
// eligible product. Returns null if nothing is eligible (shouldn't happen —
// gasoline is always in).
function generateRotatingContract(game: GameState, currentTick: number): RotatingContract | null {
  const products = eligibleProducts(game)
  if (products.length === 0) return null
  const productKey = products[Math.floor(Math.random() * products.length)]

  const levelOver = Math.max(0, game.refineryLevel - ROTATING_CONTRACT_BALANCE.minRefineryLevel)
  // A little variety in size (±25%) on top of the level-scaled base.
  const sizeJitter = 0.75 + Math.random() * 0.5
  const required = Math.max(
    10,
    Math.round(
      (ROTATING_CONTRACT_BALANCE.baseRequirement +
        levelOver * ROTATING_CONTRACT_BALANCE.requirementPerLevel) *
        sizeJitter,
    ),
  )
  const reward = Math.round(
    required * PRODUCT_UNIT_VALUE[productKey] * ROTATING_CONTRACT_BALANCE.rewardPremium,
  )
  return {
    id: game.rotatingContractCounter + 1,
    productKey,
    required,
    reward,
    rpReward: Math.max(1, Math.round(reward * ROTATING_CONTRACT_BALANCE.rpPerReward)),
    reputationReward: ROTATING_CONTRACT_BALANCE.reputationReward,
    spawnedAtTick: currentTick,
    expiresAtTick: currentTick + ROTATING_CONTRACT_BALANCE.lifetimeTicks,
  }
}

// Tick hook: drop expired offers, then maybe spawn a new one. Returns the
// updated slice of state (only the rotating-contract fields) so the caller can
// merge it. Cheap enough to run every tick (tiny arrays).
export function updateRotatingContracts(
  game: GameState,
  currentTick: number,
): Pick<GameState, 'rotatingContracts' | 'rotatingContractCounter' | 'lastRotatingSpawnTick'> {
  let rotatingContracts = game.rotatingContracts.filter((c) => currentTick < c.expiresAtTick)
  let rotatingContractCounter = game.rotatingContractCounter
  let lastRotatingSpawnTick = game.lastRotatingSpawnTick

  const canSpawn =
    game.refineryLevel >= ROTATING_CONTRACT_BALANCE.minRefineryLevel &&
    rotatingContracts.length < ROTATING_CONTRACT_BALANCE.maxActive &&
    currentTick - game.lastRotatingSpawnTick >= ROTATING_CONTRACT_BALANCE.spawnIntervalTicks

  if (canSpawn && Math.random() < ROTATING_CONTRACT_BALANCE.spawnChance) {
    const contract = generateRotatingContract(game, currentTick)
    if (contract) {
      rotatingContracts = [...rotatingContracts, contract]
      rotatingContractCounter = contract.id
      lastRotatingSpawnTick = currentTick
    }
  }

  return { rotatingContracts, rotatingContractCounter, lastRotatingSpawnTick }
}
