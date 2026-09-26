import type { ProductKey } from '../types'
import { V3_COMMODITY_ID, V3_STORAGE } from './data'
import { getV3Modifiers } from './modifiers'
import type {
  V3CommodityFamily,
  V3GameState,
  V3InventoryEntry,
  V3LedgerBucket,
  V3ProductFamily,
} from './types'

const EPSILON = 1e-8

type StorageBuilding =
  | 'gasolineTank'
  | 'lubricantTank'
  | 'jetFuelTank'
  | 'petrochemicalTank'
  | 'recyclingBunker'
  | 'pelletSilo'

const STORAGE_BUILDING_BY_PRODUCT: Partial<Record<ProductKey, StorageBuilding>> = {
  gasoline: 'gasolineTank',
  lubricants: 'lubricantTank',
  jetFuel: 'jetFuelTank',
  petrochemicals: 'petrochemicalTank',
  recycledMaterial: 'recyclingBunker',
  plasticPellets: 'pelletSilo',
}

function storageContribution(building: StorageBuilding, level: number): number {
  switch (building) {
    case 'gasolineTank': return V3_STORAGE.gasolineTankByLevel[level] ?? 0
    case 'lubricantTank': return V3_STORAGE.lubricantTankByLevel[level] ?? 0
    case 'jetFuelTank': return V3_STORAGE.jetFuelTankByLevel[level] ?? 0
    case 'petrochemicalTank': return V3_STORAGE.petrochemicalTankByLevel[level] ?? 0
    case 'recyclingBunker': return V3_STORAGE.recyclingBunkerByLevel[level] ?? 0
    case 'pelletSilo': return V3_STORAGE.pelletSiloByLevel[level] ?? 0
  }
}

/** Physical storage plus capped research/support bonuses (Systems S3/S4). */
function withStorageBonuses(state: V3GameState, physical: number, core: boolean): number {
  const modifiers = getV3Modifiers(state)
  const base = physical + (core ? modifiers.coreStorageFlat : 0)
  return base * (1 + modifiers.storagePercent.effective) + modifiers.mechanicStorageFlat
}

export function getV3CrudeCapacity(state: V3GameState): number {
  return withStorageBonuses(state, getV3PhysicalCrudeCapacity(state), true)
}

export function getV3PhysicalCrudeCapacity(state: V3GameState): number {
  let capacity = V3_STORAGE.baseCrude
  for (let index = 0; index < state.world.grid.length; index++) {
    if (state.world.grid[index] === 'crudeTank') {
      capacity += V3_STORAGE.crudeTankByLevel[state.world.gridLevels[index] ?? 1] ?? 0
    }
  }
  return capacity
}

export function getV3ProductCapacity(state: V3GameState, product: ProductKey): number {
  return withStorageBonuses(state, getV3PhysicalProductCapacity(state, product), product === 'gasoline')
}

export function getV3PhysicalProductCapacity(state: V3GameState, product: ProductKey): number {
  let capacity = V3_STORAGE.baseByProduct[product]
  const storageBuilding = STORAGE_BUILDING_BY_PRODUCT[product]
  if (!storageBuilding) return capacity
  for (let index = 0; index < state.world.grid.length; index++) {
    if (state.world.grid[index] === storageBuilding) {
      capacity += storageContribution(storageBuilding, state.world.gridLevels[index] ?? 1)
    }
  }
  return capacity
}

export function getV3ProductQuantity(state: V3GameState, product: ProductKey): number {
  if (product === 'asphalt' || product === 'recycledMaterial') {
    return state.commodityInventory[product]?.quantity ?? 0
  }
  return Object.values(state.variantInventory).reduce((sum, entry) => {
    const blueprint = state.productBlueprints[entry.blueprintId]
    return blueprint?.family === product ? sum + entry.quantity : sum
  }, 0)
}

export type V3InventoryMutation = {
  state: V3GameState
  quantity: number
  costBasisCents: number
  estimatedBasis: boolean
}

export function addV3VariantInventory(
  state: V3GameState,
  blueprintId: string,
  quantity: number,
  costBasisCents: number,
  estimatedBasis = false,
): V3InventoryMutation {
  const blueprint = state.productBlueprints[blueprintId]
  if (!blueprint || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(costBasisCents) || costBasisCents < 0) {
    return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  }
  const space = Math.max(0, getV3ProductCapacity(state, blueprint.family) - getV3ProductQuantity(state, blueprint.family))
  const added = Math.min(quantity, space)
  if (added <= EPSILON) return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  const acceptedCost = costBasisCents * (added / quantity)
  const previous = state.variantInventory[blueprintId]
  const entry: V3InventoryEntry = {
    blueprintId,
    quantity: (previous?.quantity ?? 0) + added,
    totalCostBasisCents: (previous?.totalCostBasisCents ?? 0) + acceptedCost,
    estimatedBasis: (previous?.estimatedBasis ?? false) || estimatedBasis,
  }
  return {
    state: { ...state, variantInventory: { ...state.variantInventory, [blueprintId]: entry } },
    quantity: added,
    costBasisCents: acceptedCost,
    estimatedBasis: entry.estimatedBasis,
  }
}

/** Commodity (Q-less) stock: recycled material and asphalt share the same capacity rules. */
export function addV3CommodityInventory(
  state: V3GameState,
  commodity: V3CommodityFamily,
  quantity: number,
  costBasisCents: number,
): V3InventoryMutation {
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(costBasisCents) || costBasisCents < 0) {
    return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  }
  const space = Math.max(0, getV3ProductCapacity(state, commodity) - getV3ProductQuantity(state, commodity))
  const added = Math.min(quantity, space)
  if (added <= EPSILON) return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  const acceptedCost = costBasisCents * (added / quantity)
  const previous = state.commodityInventory[commodity]
  const entry: V3InventoryEntry = {
    blueprintId: V3_COMMODITY_ID[commodity],
    quantity: (previous?.quantity ?? 0) + added,
    totalCostBasisCents: (previous?.totalCostBasisCents ?? 0) + acceptedCost,
    estimatedBasis: false,
  }
  return {
    state: { ...state, commodityInventory: { ...state.commodityInventory, [commodity]: entry } },
    quantity: added,
    costBasisCents: acceptedCost,
    estimatedBasis: false,
  }
}

export function consumeV3Commodity(state: V3GameState, commodity: V3CommodityFamily, quantity: number): V3InventoryMutation {
  const entry = state.commodityInventory[commodity]
  if (!entry || !Number.isFinite(quantity) || quantity <= 0 || entry.quantity + EPSILON < quantity) {
    return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  }
  const costBasisCents = entry.totalCostBasisCents * (quantity / entry.quantity)
  const remaining = entry.quantity - quantity
  const commodityInventory = { ...state.commodityInventory }
  if (remaining <= EPSILON) delete commodityInventory[commodity]
  else commodityInventory[commodity] = { ...entry, quantity: remaining, totalCostBasisCents: Math.max(0, entry.totalCostBasisCents - costBasisCents) }
  return { state: { ...state, commodityInventory }, quantity, costBasisCents, estimatedBasis: false }
}

/**
 * Q-eligibility for the accepted job. Showcase orders additionally require a
 * blueprint the player developed (provenance `developed`), never starter stock.
 */
export function isV3JobEligibleVariant(state: V3GameState, blueprintId: string, quality: number): boolean {
  const job = state.acceptedJob
  if (!job || quality + EPSILON < job.minimumQuality) return false
  return !job.templateId.startsWith('showcase:') || state.productBlueprints[blueprintId]?.provenance === 'developed'
}

export type V3StockAllocation = {
  blueprintId: string
  quality: number
  quantity: number
  kept: number
  jobReserved: number
  free: number
}

export type V3InventoryPurpose = 'manual-sale' | 'auto-sale' | 'sample' | 'processing' | 'job-dispatch'

export type V3InventoryConsumeOptions = {
  blueprintId?: string
  purpose?: V3InventoryPurpose
  overrideKeep?: boolean
}

export function getV3StockAllocations(state: V3GameState, product: ProductKey): V3StockAllocation[] {
  const entries: Array<{ blueprintId: string; quality: number; quantity: number }> = []
  if (product === 'asphalt' || product === 'recycledMaterial') {
    const entry = state.commodityInventory[product]
    if (entry) entries.push({ blueprintId: entry.blueprintId, quality: 0, quantity: entry.quantity })
  } else {
    for (const entry of Object.values(state.variantInventory)) {
      const blueprint = state.productBlueprints[entry.blueprintId]
      if (blueprint?.family === product) {
        entries.push({ blueprintId: entry.blueprintId, quality: blueprint.quality, quantity: entry.quantity })
      }
    }
  }
  entries.sort((a, b) => a.quality - b.quality || a.blueprintId.localeCompare(b.blueprintId))

  const allocations = entries.map((entry) => {
    const keep = Math.max(0, state.stockPolicies[entry.blueprintId]?.keepQuantity ?? 0)
    const kept = Math.min(entry.quantity, keep)
    return { ...entry, kept, jobReserved: 0, free: entry.quantity - kept }
  })
  const job = state.acceptedJob
  if (job?.status === 'accepted' && job.family === product) {
    let remaining = Math.max(0, job.quantity - job.deliveredQuantity)
    for (const allocation of allocations) {
      if (!isV3JobEligibleVariant(state, allocation.blueprintId, allocation.quality)) continue
      const reserved = Math.min(allocation.free, remaining)
      allocation.jobReserved = reserved
      allocation.free -= reserved
      remaining -= reserved
      if (remaining <= EPSILON) break
    }
  }
  return allocations
}

export function getV3SellableQuantity(
  state: V3GameState,
  product: ProductKey,
  options: { blueprintId?: string; source?: 'manual' | 'auto'; overrideKeep?: boolean } = {},
): number {
  const source = options.source ?? 'manual'
  return getV3StockAllocations(state, product)
    .filter((entry) => !options.blueprintId || entry.blueprintId === options.blueprintId)
    .filter((entry) => source !== 'auto' || state.stockPolicies[entry.blueprintId]?.autoSell === true)
    .reduce((sum, entry) => {
      const keep = source === 'manual' && options.overrideKeep ? 0 : entry.kept
      return sum + Math.max(0, entry.quantity - keep - entry.jobReserved)
    }, 0)
}

export function getV3ConsumableQuantity(
  state: V3GameState,
  product: V3ProductFamily,
  options: V3InventoryConsumeOptions = {},
): number {
  const purpose = options.purpose ?? 'processing'
  return getV3StockAllocations(state, product)
    .filter((entry) => !options.blueprintId || entry.blueprintId === options.blueprintId)
    .filter((entry) => purpose !== 'auto-sale' || state.stockPolicies[entry.blueprintId]?.autoSell === true)
    .reduce((sum, entry) => {
      if (purpose === 'job-dispatch') {
        const job = state.acceptedJob
        if (options.blueprintId && job && isV3JobEligibleVariant(state, entry.blueprintId, entry.quality)) {
          return sum + Math.max(0, entry.quantity - entry.kept)
        }
        return sum + entry.jobReserved
      }
      const keep = purpose === 'manual-sale' && options.overrideKeep ? 0 : entry.kept
      return sum + Math.max(0, entry.quantity - keep - entry.jobReserved)
    }, 0)
}

function consumeEntry(
  inventory: Record<string, V3InventoryEntry>,
  blueprintId: string,
  quantity: number,
): { inventory: Record<string, V3InventoryEntry>; costBasisCents: number; estimatedBasis: boolean } {
  const entry = inventory[blueprintId]
  if (!entry || quantity <= EPSILON) return { inventory, costBasisCents: 0, estimatedBasis: false }
  const actual = Math.min(quantity, entry.quantity)
  const costBasisCents = entry.quantity > EPSILON
    ? entry.totalCostBasisCents * (actual / entry.quantity)
    : 0
  const remaining = entry.quantity - actual
  const next = { ...inventory }
  if (remaining <= EPSILON) {
    delete next[blueprintId]
  } else {
    next[blueprintId] = {
      ...entry,
      quantity: remaining,
      totalCostBasisCents: Math.max(0, entry.totalCostBasisCents - costBasisCents),
    }
  }
  return { inventory: next, costBasisCents, estimatedBasis: entry.estimatedBasis }
}

export function consumeV3ProtectedInventory(
  state: V3GameState,
  product: V3ProductFamily,
  quantity: number,
  options: V3InventoryConsumeOptions = {},
): V3InventoryMutation {
  const purpose = options.purpose ?? 'processing'
  if (!Number.isFinite(quantity) || quantity <= 0 || getV3ConsumableQuantity(state, product, options) + EPSILON < quantity) {
    return { state, quantity: 0, costBasisCents: 0, estimatedBasis: false }
  }
  const allocations = getV3StockAllocations(state, product)
    .filter((entry) => !options.blueprintId || entry.blueprintId === options.blueprintId)
    .filter((entry) => purpose !== 'auto-sale' || state.stockPolicies[entry.blueprintId]?.autoSell === true)
  let inventory = state.variantInventory
  let remaining = quantity
  let totalCost = 0
  let estimatedBasis = false
  for (const allocation of allocations) {
    const keep = purpose === 'manual-sale' && options.overrideKeep ? 0 : allocation.kept
    const available = purpose === 'job-dispatch'
      ? options.blueprintId && state.acceptedJob && isV3JobEligibleVariant(state, allocation.blueprintId, allocation.quality)
        ? Math.max(0, allocation.quantity - allocation.kept)
        : allocation.jobReserved
      : Math.max(0, allocation.quantity - keep - allocation.jobReserved)
    const take = Math.min(available, remaining)
    const consumed = consumeEntry(inventory, allocation.blueprintId, take)
    inventory = consumed.inventory
    totalCost += consumed.costBasisCents
    estimatedBasis ||= consumed.estimatedBasis
    remaining -= take
    if (remaining <= EPSILON) break
  }
  return {
    state: { ...state, variantInventory: inventory },
    quantity,
    costBasisCents: totalCost,
    estimatedBasis,
  }
}

export function consumeV3SellableInventory(
  state: V3GameState,
  product: V3ProductFamily,
  quantity: number,
  options: { blueprintId?: string; source?: 'manual' | 'auto'; overrideKeep?: boolean } = {},
): V3InventoryMutation {
  return consumeV3ProtectedInventory(state, product, quantity, {
    blueprintId: options.blueprintId,
    purpose: options.source === 'auto' ? 'auto-sale' : 'manual-sale',
    overrideKeep: options.overrideKeep,
  })
}

export type V3LedgerDelta = {
  receiptsCents?: number
  cashOutflowsCents?: number
  cogsCents?: number
  wagesCents?: number
  maintenanceCents?: number
  /** Part of receiptsCents excluded from recognized operating profit (bonuses, estimated-basis sales). */
  unrecognizedCents?: number
}

export function recordV3Ledger(state: V3GameState, delta: V3LedgerDelta): V3GameState {
  const second = Math.floor(state.world.tickCount / 5)
  const previous = state.operatingLedger.buckets.at(-1)
  const bucket: V3LedgerBucket = previous?.second === second
    ? { ...previous }
    : { second, receiptsCents: 0, cashOutflowsCents: 0, cogsCents: 0, wagesCents: 0, maintenanceCents: 0, unrecognizedCents: 0 }
  bucket.receiptsCents += delta.receiptsCents ?? 0
  bucket.cashOutflowsCents += delta.cashOutflowsCents ?? 0
  bucket.cogsCents += delta.cogsCents ?? 0
  bucket.wagesCents += delta.wagesCents ?? 0
  bucket.maintenanceCents += delta.maintenanceCents ?? 0
  bucket.unrecognizedCents += delta.unrecognizedCents ?? 0
  const recognized = (delta.receiptsCents ?? 0) - (delta.unrecognizedCents ?? 0) -
    (delta.cogsCents ?? 0) - (delta.wagesCents ?? 0) - (delta.maintenanceCents ?? 0)
  const buckets = previous?.second === second
    ? [...state.operatingLedger.buckets.slice(0, -1), bucket]
    : [...state.operatingLedger.buckets, bucket].slice(-180)
  return {
    ...state,
    operatingLedger: {
      ...state.operatingLedger,
      buckets,
      lifetimeReceiptsCents: state.operatingLedger.lifetimeReceiptsCents + (delta.receiptsCents ?? 0),
      lifetimeCashOutflowsCents: state.operatingLedger.lifetimeCashOutflowsCents + (delta.cashOutflowsCents ?? 0),
      lifetimeCogsCents: state.operatingLedger.lifetimeCogsCents + (delta.cogsCents ?? 0),
      lifetimeOperatingExpenseCents: state.operatingLedger.lifetimeOperatingExpenseCents +
        (delta.wagesCents ?? 0) + (delta.maintenanceCents ?? 0),
      lifetimeRecognizedProfitCents: state.operatingLedger.lifetimeRecognizedProfitCents + recognized,
    },
  }
}

/** Rolling recognized operating profit over the last `seconds` of simulated time. */
export function getV3RollingOperatingProfit(state: V3GameState, seconds = 180): { cents: number; complete: boolean } {
  const now = Math.floor(state.world.tickCount / 5)
  const cents = state.operatingLedger.buckets
    .filter((bucket) => bucket.second > now - seconds)
    .reduce((sum, bucket) => sum + bucket.receiptsCents - bucket.unrecognizedCents - bucket.cogsCents - bucket.wagesCents - bucket.maintenanceCents, 0)
  return { cents, complete: state.world.tickCount >= seconds * 5 }
}
