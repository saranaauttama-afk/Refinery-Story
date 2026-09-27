import {
  countV3Buildings,
  getV3Building,
  getV3BuildingLevel,
  getV3BuildingLimit,
  getV3BuildingType,
  getV3Parcel,
  hasV3Building,
  validateV3ParcelUnlock,
  validateV3Placement,
} from './yard'
import { getV3FeedstockCapacity } from './production'
import type { BuildingType, ProductKey, WorkerType } from '../types'
import { unlockV3Research, validateV3Research } from './research'
import {
  V3_BUILDINGS,
  V3_MODULE_CHAPTER,
  V3_MODULE_FIT_COST_RATE,
  V3_MODULE_MIN_PLANT_LEVEL,
  V3_PLANT_BY_FAMILY,
  V3_ASPHALT_CONVERSION,
  V3_COMMODITY_ID,
  V3_PROCESS_UNITS,
  V3_ROLES,
  type V3ProcessBuilding,
  V3_SPECIALIZATION_CHAPTER,
  V3_SPOT_PRICE_CENTS,
  V3_STAFF_LEVELS,
  isV3ProcessBuilding,
} from './data'
import { getV3Modifiers } from './modifiers'
import { getV3CrudeUnitPriceCents } from './fame'
import { getV3MarketMultiplier } from './market'
import { enterV3Expo, validateV3ExpoEntry } from './expo'
import { getV3RareCandidate, promoteV3Employee, validateV3Promotion } from './careers'
import { cancelV3Development, startV3Development } from './development'
import { V3_AUTO_REPEAT_CHAPTER, V3_JOB_TEMPLATES, acceptV3Job, cancelV3Job, dispatchV3Job } from './jobs'
import { getV3RushTerms } from './offers'
import { recordV3AdjacencyDiscoveries } from './adjacency'
import { resolveV3InboxItem } from './inbox'
import { getV3EmergencyExitCents } from './maintenance'
import { evaluateV3CampaignProgress } from './campaign'
import {
  addV3CommodityInventory,
  consumeV3Commodity,
  consumeV3SellableInventory,
  getV3CrudeCapacity,
  getV3ProductCapacity,
  getV3ProductQuantity,
  getV3SellableQuantity,
  recordV3Ledger,
} from './productInventory'
import { V3_DEFAULT_BLUEPRINT_ID } from './state'
import { getV3RecoveryOffer, isV3LoanerBuilding, restoreV3StarterLoaners, startV3Recovery } from './recovery'
import {
  canV3StaffLine,
  canV3Support,
  emptyV3EmployeeRecord,
  getV3Employee,
  getV3StaffCap,
  getV3TrainingCost,
  getV3WageCents,
} from './workforce'
import type {
  V3Action,
  V3ActionEvent,
  V3ActionResult,
  V3BuildAction,
  V3GameState,
  V3ModuleKey,
  V3ProductFamily,
  V3TradeAction,
  V3UpgradeAction,
} from './types'

function event(
  tone: V3ActionEvent['tone'],
  messageId: V3ActionEvent['messageId'],
  params?: V3ActionEvent['params'],
): V3ActionEvent {
  return { tone, messageId, ...(params ? { params } : {}) }
}

// Buildings whose V3 capability is implemented end-to-end. Others stay visible
// as locked rather than being placeable with no working system behind them.
export const V3_SUPPORTED_BUILDINGS: ReadonlySet<BuildingType> = new Set<BuildingType>([
  'crudeTank',
  'gasolineTank',
  'distillationUnit',
  'laboratory',
  'powerPlant',
  'lubricantPlant',
  'lubricantTank',
  'jetFuelPlant',
  'jetFuelTank',
  'salesOffice',
  'petrochemicalPlant',
  'petrochemicalTank',
  'polymerPlant',
  'pelletSilo',
  'wasteTreatmentPlant',
  'recyclingBunker',
  'maintenanceWorkshop',
])

const V3_ROLE_NAME: Record<WorkerType, string> = {
  operator: 'Operator',
  mechanic: 'Mechanic',
  salesAgent: 'Sales Agent',
  safetyOfficer: 'Safety Officer',
  chemist: 'Chemist',
  logisticsCoordinator: 'Logistics',
  fuelSpecialist: 'Fuel Specialist',
  aviationSpecialist: 'Aviation Specialist',
  chemicalEngineer: 'Chemical Engineer',
  polymerEngineer: 'Polymer Engineer',
}

const STORAGE_PRODUCT: Partial<Record<BuildingType, ProductKey>> = {
  gasolineTank: 'gasoline',
  lubricantTank: 'lubricants',
  jetFuelTank: 'jetFuel',
  petrochemicalTank: 'petrochemicals',
  pelletSilo: 'plasticPellets',
  recyclingBunker: 'recycledMaterial',
}

export function isV3Commodity(product: ProductKey | 'crude'): product is 'asphalt' | 'recycledMaterial' {
  return product === 'asphalt' || product === 'recycledMaterial'
}

export function isV3TradableFamily(product: ProductKey | 'crude'): product is V3ProductFamily {
  return product !== 'crude' && V3_PLANT_BY_FAMILY[product] !== undefined
}

export type V3ModuleQuote =
  | { blocker: null; costCents: number; params?: undefined }
  | { blocker: 'invalid_cell' | 'locked' | 'plant_level' | 'no_change' | 'insufficient_cash'; costCents: number; params?: Record<string, number> }

/** Shared module fit validation used by the action and the UI preview. */
export function getV3ModuleQuote(state: V3GameState, buildingId: string, module: V3ModuleKey): V3ModuleQuote {
  const building = getV3BuildingType(state, buildingId)
  const program = state.plantPrograms[buildingId]
  if (!isV3ProcessBuilding(building) || !program || isV3LoanerBuilding(state, buildingId) || building === 'wasteTreatmentPlant') return { blocker: 'invalid_cell', costCents: 0 }
  if (program.installedModule === module) return { blocker: 'no_change', costCents: 0 }
  const costCents = module === 'none' ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 100 * V3_MODULE_FIT_COST_RATE)
  if (module !== 'none') {
    if (state.campaignProgress.chapter < V3_MODULE_CHAPTER) return { blocker: 'locked', costCents, params: { chapter: V3_MODULE_CHAPTER } }
    if ((getV3BuildingLevel(state, buildingId)) < V3_MODULE_MIN_PLANT_LEVEL) return { blocker: 'plant_level', costCents, params: { level: V3_MODULE_MIN_PLANT_LEVEL } }
    if (state.world.moneyCents < costCents) return { blocker: 'insufficient_cash', costCents, params: { costCents } }
  }
  return { blocker: null, costCents }
}

/** Default program for a new line: the family's Standard blueprint, or the commodity key. */
export function getV3DefaultProgramId(building: V3ProcessBuilding): string {
  const family = V3_PROCESS_UNITS[building].family
  return family === 'recycledMaterial' ? V3_COMMODITY_ID.recycledMaterial : V3_DEFAULT_BLUEPRINT_ID[family]
}

/**
 * Why a certified recipe cannot run on a line (development is never blocked by
 * this). Shared by set_program and the recipe buttons, so the UI shows the
 * exact missing requirement: plant level, installed module, family or loaner.
 */
export function explainV3ProgramFit(
  state: V3GameState,
  buildingId: string,
  blueprintId: string,
): { messageId: V3ActionEvent['messageId']; params?: Record<string, number | string> } | null {
  const program = state.plantPrograms[buildingId]
  const building = getV3BuildingType(state, buildingId)
  const blueprint = state.productBlueprints[blueprintId]
  if (!program || !isV3ProcessBuilding(building)) return { messageId: 'v3.program.invalid_cell' }
  if (!blueprint) return { messageId: 'v3.program.invalid_blueprint' }
  if (blueprint.family !== V3_PROCESS_UNITS[building].family) return { messageId: 'v3.program.wrong_family' }
  const level = getV3BuildingLevel(state, buildingId)
  if (level < blueprint.minPlantLevel) return { messageId: 'v3.program.plant_level', params: { need: blueprint.minPlantLevel, have: level } }
  if (blueprint.module !== program.installedModule) {
    return { messageId: 'v3.program.module_mismatch', params: { need: blueprint.module, installed: program.installedModule } }
  }
  if (isV3LoanerBuilding(state, buildingId) && blueprintId !== V3_DEFAULT_BLUEPRINT_ID.gasoline) return { messageId: 'v3.program.loaner_default_only' }
  return null
}

export function getV3ActionId(action: Pick<V3Action, 'type' | 'sequence'>): string {
  return `action:${action.type}:${String(action.sequence).padStart(8, '0')}`
}

export function validateV3Build(state: V3GameState, action: V3BuildAction): V3ActionEvent | null {
  if (!V3_SUPPORTED_BUILDINGS.has(action.building)) {
    return event('blocked', 'v3.build.unsupported')
  }
  // Polymer needs a Petro route (Systems S3 building table).
  if (action.building === 'polymerPlant' && !hasV3Building(state, 'petrochemicalPlant')) {
    return event('blocked', 'v3.build.requires_route')
  }
  const capability = V3_BUILDINGS[action.building]
  const requiredChapter = capability.buildChapter
  if (state.campaignProgress.chapter < requiredChapter) {
    return event('blocked', 'v3.build.locked', { chapter: requiredChapter })
  }
  const limit = getV3BuildingLimit(state, action.building)
  if (limit !== null && countV3Buildings(state, action.building) >= limit) {
    return event('blocked', 'v3.place.building_limit', { limit })
  }
  // Placement uses the same yard validator as move/upgrade previews.
  const placement = validateV3Placement(state, action.building, 1, action.x, action.y)
  if (placement) return event('blocked', `v3.place.${placement}`)
  const costCents = capability.buildCostDollars * 100
  if (state.world.moneyCents < costCents) {
    return event('blocked', 'v3.build.insufficient_cash', { costCents })
  }
  return null
}

/**
 * Demolition safeguards: never silently break an active project, the emergency
 * line or stored stock (capacity may not drop below what is held).
 */
export function validateV3Demolish(state: V3GameState, buildingId: string, expectedBuilding: BuildingType): V3ActionEvent | null {
  const building = getV3BuildingType(state, buildingId)
  if (!building) return event('blocked', 'v3.demolish.invalid_cell')
  if (building !== expectedBuilding) return event('blocked', 'v3.demolish.building_changed')
  if (building === 'laboratory' && state.developmentProject?.labBuildingId === buildingId) {
    return event('blocked', 'v3.demolish.active_project')
  }
  const buildingsById = { ...state.world.buildingsById }
  delete buildingsById[buildingId]
  const hypothetical = { ...state, world: { ...state.world, buildingsById } }
  const storedProduct = STORAGE_PRODUCT[building]
  if (
    (building === 'crudeTank' && state.world.crudeOil > getV3CrudeCapacity(hypothetical) + 1e-8) ||
    (storedProduct && getV3ProductQuantity(state, storedProduct) > getV3ProductCapacity(hypothetical, storedProduct) + 1e-8) ||
    (building === 'distillationUnit' && state.world.feedstock > getV3FeedstockCapacity(hypothetical) + 1e-8)
  ) {
    return event('blocked', 'v3.demolish.stock_overflow')
  }
  return null
}

export function validateV3Upgrade(state: V3GameState, action: V3UpgradeAction): V3ActionEvent | null {
  const placed = getV3Building(state, action.buildingId)
  if (!placed) return event('blocked', 'v3.building.missing')
  const building = placed.type
  if (!building || !V3_SUPPORTED_BUILDINGS.has(building) || V3_BUILDINGS[building].upgradeCostDollars === null) {
    return event('blocked', 'v3.upgrade.unsupported')
  }
  const level = getV3BuildingLevel(state, action.buildingId)
  const capability = V3_BUILDINGS[building]
  const cost = capability.upgradeCostDollars?.[level - 1]
  if (cost === undefined) {
    return event('blocked', 'v3.upgrade.max_level')
  }
  const requiredChapter = capability.upgradeChapter?.[level - 1]
  if (requiredChapter !== undefined && state.campaignProgress.chapter < requiredChapter) {
    return event('blocked', 'v3.upgrade.locked', { chapter: requiredChapter })
  }
  // The larger footprint must fit on unlocked, free land before any money moves.
  const placement = validateV3Placement(state, building, level + 1, placed.x, placed.y, placed.id)
  if (placement) return event('blocked', `v3.place.${placement}`)
  const costCents = cost * 100
  if (state.world.moneyCents < costCents) {
    return event('blocked', 'v3.upgrade.insufficient_cash', { costCents })
  }
  return null
}

export function validateV3Trade(state: V3GameState, action: V3TradeAction): V3ActionEvent | null {
  if (!Number.isInteger(action.quantity) || action.quantity <= 0) {
    return event('blocked', 'v3.trade.invalid_amount')
  }
  if (action.direction === 'buy') {
    if (action.product !== 'crude') return event('info', 'v3.trade.inventory_pending')
    if (state.world.moneyCents < getV3CrudeUnitPriceCents(state)) return event('blocked', 'v3.trade.insufficient_cash')
    if (state.world.crudeOil >= getV3CrudeCapacity(state) - 1e-8) return event('blocked', 'v3.trade.storage_full')
  } else {
    if (action.product === 'crude') {
      return event('blocked', 'v3.trade.insufficient_stock')
    }
    if (isV3Commodity(action.product)) {
      if ((state.commodityInventory[action.product]?.quantity ?? 0) + 1e-8 < action.quantity) return event('blocked', 'v3.trade.insufficient_stock')
      return null
    }
    if (!isV3TradableFamily(action.product)) return event('info', 'v3.trade.inventory_pending')
    if (getV3SellableQuantity(state, action.product, action) + 1e-8 < action.quantity) {
      return event('blocked', 'v3.trade.insufficient_stock')
    }
  }
  return null
}

function consumedResult(
  state: V3GameState,
  action: V3Action,
  next: V3GameState,
  resultEvent: V3ActionEvent,
): V3ActionResult {
  // Chapter predicates are re-evaluated after every accepted transaction (never decrease).
  const evaluated = resultEvent.tone === 'success' ? recordV3AdjacencyDiscoveries(evaluateV3CampaignProgress(next)) : next
  return {
    state: { ...evaluated, nextActionSequence: state.nextActionSequence + 1 },
    changed: true,
    actionId: getV3ActionId(action),
    events: [resultEvent],
  }
}

export function reduceV3Action(state: V3GameState, action: V3Action): V3ActionResult {
  const actionId = getV3ActionId(action)
  if (action.sequence !== state.nextActionSequence) {
    return {
      state,
      changed: false,
      actionId,
      events: [event('blocked', 'v3.action.sequence_mismatch', {
        expected: state.nextActionSequence,
        received: action.sequence,
      })],
    }
  }

  if (action.type === 'promote_employee') {
    const invalid = validateV3Promotion(state, action.employeeId)
    if (invalid) return consumedResult(state, action, state, event('blocked', `v3.career.${invalid.blocker}` as V3ActionEvent['messageId'], invalid.params))
    return consumedResult(state, action, promoteV3Employee(state, action.employeeId), event('success', 'v3.action.ok'))
  }

  if (action.type === 'hire_candidate') {
    const candidate = getV3RareCandidate(state)
    if (!candidate || candidate.id !== action.candidateId) return consumedResult(state, action, state, event('blocked', 'v3.candidate.unavailable'))
    if (state.world.employees.length >= getV3StaffCap(state)) return consumedResult(state, action, state, event('blocked', 'v3.hire.staff_cap', { cap: getV3StaffCap(state) }))
    if (state.world.moneyCents < candidate.costCents) return consumedResult(state, action, state, event('blocked', 'v3.hire.insufficient_cash', { costCents: candidate.costCents }))
    const hired = candidate.employee
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents - candidate.costCents, employees: [...state.world.employees, hired] },
      employeeDuties: { ...state.employeeDuties, [hired.id]: { kind: 'reserve' } },
      employeeRecords: { ...state.employeeRecords, [hired.id]: emptyV3EmployeeRecord() },
      campaignProgress: { ...state.campaignProgress, claimedFlags: [...state.campaignProgress.claimedFlags, candidate.id] },
      operatingLedger: { ...state.operatingLedger, capexCents: state.operatingLedger.capexCents + candidate.costCents },
    }, event('success', 'v3.action.ok', { costCents: candidate.costCents }))
  }

  if (action.type === 'enter_expo') {
    const invalid = validateV3ExpoEntry(state, action.blueprintId)
    if (invalid) return consumedResult(state, action, state, event('blocked', `v3.expo.${invalid.blocker}` as V3ActionEvent['messageId'], invalid.params))
    const entered = enterV3Expo(state, action.blueprintId)
    return consumedResult(state, action, entered.state, event('success', 'v3.action.ok', { rank: entered.entry.rank }))
  }

  if (action.type === 'build') {
    const blocker = validateV3Build(state, action)
    if (blocker) return consumedResult(state, action, state, blocker)
    const costCents = V3_BUILDINGS[action.building].buildCostDollars * 100
    const id = `building:${String(action.sequence).padStart(8, '0')}`
    const plantPrograms = isV3ProcessBuilding(action.building)
      ? {
        ...state.plantPrograms,
        [id]: {
          buildingId: id,
          blueprintId: getV3DefaultProgramId(action.building),
          installedModule: 'none' as const,
          setupRemainingTicks: 0,
          paused: false,
        },
      }
      : state.plantPrograms
    return consumedResult(state, action, {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - costCents,
        buildingsById: { ...state.world.buildingsById, [id]: { id, type: action.building, level: 1, x: action.x, y: action.y } },
      },
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + costCents,
      },
      plantPrograms,
    }, event('success', 'v3.action.ok', { buildingId: id }))
  }

  if (action.type === 'demolish') {
    const blocker = validateV3Demolish(state, action.buildingId, action.expectedBuilding)
    if (blocker) return consumedResult(state, action, state, blocker)
    const building = getV3BuildingType(state, action.buildingId)!
    const buildingsById = { ...state.world.buildingsById }
    delete buildingsById[action.buildingId]
    const loaner = isV3LoanerBuilding(state, action.buildingId)
    const refundCents = loaner ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 100 * 0.5)
    const plantPrograms = { ...state.plantPrograms }
    delete plantPrograms[action.buildingId]
    const employeeDuties = Object.fromEntries(Object.entries(state.employeeDuties).map(([employeeId, duty]) => [
      employeeId,
      duty.kind === 'line' && duty.buildingId === action.buildingId ? { kind: 'reserve' as const } : duty,
    ]))
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents + refundCents, buildingsById },
      plantPrograms,
      employeeDuties,
      recoveryState: state.recoveryState ? {
        ...state.recoveryState,
        loanerBuildingIds: state.recoveryState.loanerBuildingIds.filter((id) => id !== action.buildingId),
      } : null,
    }, event('success', 'v3.action.ok', { refundCents }))
  }

  if (action.type === 'upgrade') {
    if (isV3LoanerBuilding(state, action.buildingId)) {
      return consumedResult(state, action, state, event('blocked', 'v3.upgrade.unsupported'))
    }
    const blocker = validateV3Upgrade(state, action)
    if (blocker) return consumedResult(state, action, state, blocker)
    const placed = getV3Building(state, action.buildingId)!
    const costCents = V3_BUILDINGS[placed.type].upgradeCostDollars![placed.level - 1] * 100
    return consumedResult(state, action, {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - costCents,
        buildingsById: { ...state.world.buildingsById, [placed.id]: { ...placed, level: (placed.level + 1) as 2 | 3 } },
      },
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + costCents,
      },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'move_building') {
    const placed = getV3Building(state, action.buildingId)
    if (!placed) return consumedResult(state, action, state, event('blocked', 'v3.building.missing'))
    if (placed.x === action.x && placed.y === action.y) return consumedResult(state, action, state, event('blocked', 'v3.place.overlap'))
    const placement = validateV3Placement(state, placed.type, placed.level, action.x, action.y, placed.id)
    if (placement) return consumedResult(state, action, state, event('blocked', `v3.place.${placement}`))
    // Only the anchor changes: level, program, duties, projects and stock stay keyed by ID.
    // Architecture point for a future move cost/downtime: charge or set setup ticks here.
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, buildingsById: { ...state.world.buildingsById, [placed.id]: { ...placed, x: action.x, y: action.y } } },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'unlock_land_parcel') {
    const invalid = validateV3ParcelUnlock(state, action.parcelId)
    if (invalid) return consumedResult(state, action, state, event('blocked', `v3.land.${invalid.blocker}`, invalid.params))
    const costCents = getV3Parcel(action.parcelId)!.costDollars * 100
    return consumedResult(state, action, {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - costCents,
        unlockedParcelIds: [...state.world.unlockedParcelIds, action.parcelId],
      },
      operatingLedger: { ...state.operatingLedger, capexCents: state.operatingLedger.capexCents + costCents },
    }, event('success', 'v3.action.ok', { costCents }))
  }

  if (action.type === 'assign_duty') {
    const employee = getV3Employee(state, action.employeeId)
    if (!employee) return consumedResult(state, action, state, event('blocked', 'v3.duty.employee_missing'))
    if (state.employeeDuties[employee.id]?.kind === 'development') {
      return consumedResult(state, action, state, event('blocked', 'v3.duty.occupied'))
    }
    if (action.duty.kind === 'development') {
      return consumedResult(state, action, state, event('blocked', 'v3.duty.invalid_target'))
    }
    if (action.duty.kind === 'support' && !canV3Support(employee.type)) {
      return consumedResult(state, action, state, event('blocked', 'v3.duty.ineligible'))
    }
    if (action.duty.kind === 'line') {
      const targetBuildingId = action.duty.buildingId
      if (!isV3ProcessBuilding(getV3BuildingType(state, targetBuildingId)) || !state.plantPrograms[targetBuildingId]) {
        return consumedResult(state, action, state, event('blocked', 'v3.duty.invalid_target'))
      }
      if (!canV3StaffLine(employee.type, getV3BuildingType(state, targetBuildingId))) {
        return consumedResult(state, action, state, event('blocked', 'v3.duty.ineligible'))
      }
      const occupant = Object.entries(state.employeeDuties).find(([id, duty]) =>
        id !== employee.id && duty.kind === 'line' && duty.buildingId === targetBuildingId,
      )
      if (occupant) return consumedResult(state, action, state, event('blocked', 'v3.duty.occupied'))
    }
    return consumedResult(state, action, {
      ...state,
      employeeDuties: { ...state.employeeDuties, [employee.id]: action.duty },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'hire_employee') {
    const rule = V3_ROLES[action.role]
    if (!rule.hireable) return consumedResult(state, action, state, event('blocked', 'v3.hire.unsupported'))
    if (state.campaignProgress.chapter < rule.hireChapter) {
      return consumedResult(state, action, state, event('blocked', 'v3.hire.locked', { chapter: rule.hireChapter }))
    }
    if (state.world.employees.length >= getV3StaffCap(state)) {
      return consumedResult(state, action, state, event('blocked', 'v3.hire.staff_cap', { cap: getV3StaffCap(state) }))
    }
    const costCents = rule.hireCostDollars * 100
    if (state.world.moneyCents < costCents) {
      return consumedResult(state, action, state, event('blocked', 'v3.hire.insufficient_cash', { costCents }))
    }
    // Guaranteed ordinary vacancy candidate: deterministic ID/name, no reroll.
    const id = `employee:${action.role}:${String(action.sequence).padStart(6, '0')}`
    const ordinal = state.world.employees.filter((employee) => employee.type === action.role).length + 1
    const hired = {
      id,
      type: action.role,
      name: `${V3_ROLE_NAME[action.role]} ${ordinal}`,
      level: 1,
      xp: 0,
      skills: [],
    }
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents - costCents, employees: [...state.world.employees, hired] },
      employeeDuties: { ...state.employeeDuties, [id]: { kind: 'reserve' } },
      employeeRecords: { ...state.employeeRecords, [id]: emptyV3EmployeeRecord() },
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + costCents,
      },
    }, event('success', 'v3.action.ok', { costCents }))
  }

  if (action.type === 'train_employee') {
    const employee = getV3Employee(state, action.employeeId)
    if (!employee) return consumedResult(state, action, state, event('blocked', 'v3.train.employee_missing'))
    if (employee.level >= V3_STAFF_LEVELS.maxLevel) return consumedResult(state, action, state, event('blocked', 'v3.train.max_level'))
    const cost = getV3TrainingCost(employee)
    if (state.world.moneyCents < cost.cents) {
      return consumedResult(state, action, state, event('blocked', 'v3.train.insufficient_cash', { costCents: cost.cents }))
    }
    if (state.world.researchPoints + 1e-8 < cost.rp) {
      return consumedResult(state, action, state, event('blocked', 'v3.train.insufficient_rp', { rp: cost.rp }))
    }
    const trained = { ...employee, level: employee.level + 1, xp: 0 }
    // Training is a one-time people investment: capex, not factory operating cost.
    return consumedResult(state, action, {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - cost.cents,
        researchPoints: state.world.researchPoints - cost.rp,
        employees: state.world.employees.map((entry) => entry.id === employee.id ? trained : entry),
      },
      operatingLedger: { ...state.operatingLedger, capexCents: state.operatingLedger.capexCents + cost.cents },
    }, event('success', 'v3.action.ok', { costCents: cost.cents }))
  }

  if (action.type === 'choose_specialization') {
    if (state.world.specialization) return consumedResult(state, action, state, event('blocked', 'v3.specialization.chosen'))
    if (state.campaignProgress.chapter < V3_SPECIALIZATION_CHAPTER) {
      return consumedResult(state, action, state, event('blocked', 'v3.specialization.locked', { chapter: V3_SPECIALIZATION_CHAPTER }))
    }
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, specialization: action.path },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'resume_employee') {
    const employee = getV3Employee(state, action.employeeId)
    if (!employee) return consumedResult(state, action, state, event('blocked', 'v3.duty.employee_missing'))
    const duty = state.employeeDuties[employee.id] ?? { kind: 'reserve' as const }
    if (state.world.moneyCents + 1e-8 < getV3WageCents(employee, duty, 25)) {
      return consumedResult(state, action, state, event('blocked', 'v3.duty.resume_unaffordable'))
    }
    return consumedResult(state, action, {
      ...state,
      unpaidEmployeeIds: state.unpaidEmployeeIds.filter((id) => id !== employee.id),
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'start_development') {
    const started = startV3Development(state, action)
    if (started.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.development.${started.blocker}` as V3ActionEvent['messageId']))
    }
    return consumedResult(state, action, started.state, event('success', 'v3.action.ok'))
  }

  if (action.type === 'cancel_development') {
    const cancelled = cancelV3Development(state)
    if (!cancelled) return consumedResult(state, action, state, event('blocked', 'v3.development.no_project'))
    return consumedResult(state, action, cancelled, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_blueprint_presentation') {
    const blueprint = state.productBlueprints[action.blueprintId]
    if (!blueprint) return consumedResult(state, action, state, event('blocked', 'v3.blueprint.missing'))
    const pinnedCount = Object.values(state.productBlueprints).filter((entry) =>
      entry.family === blueprint.family && entry.pinned && entry.id !== blueprint.id,
    ).length
    const pinned = action.pinned === true && pinnedCount >= 6 ? blueprint.pinned : action.pinned ?? blueprint.pinned
    const archived = action.archived ?? blueprint.archived
    const name = action.name?.trim().slice(0, 32) || blueprint.name
    return consumedResult(state, action, {
      ...state,
      productBlueprints: {
        ...state.productBlueprints,
        [blueprint.id]: { ...blueprint, name, pinned: archived ? false : pinned, archived },
      },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'accept_job') {
    const accepted = acceptV3Job(state, action.templateId, action.sequence, getV3RushTerms(state, action.templateId), action.branch ?? null)
    if (accepted.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.job.${accepted.blocker}` as V3ActionEvent['messageId']))
    }
    return consumedResult(state, action, accepted.state, event('success', 'v3.action.ok'))
  }

  if (action.type === 'restore_operations') {
    if (!state.maintenanceEmergency) return consumedResult(state, action, state, event('blocked', 'v3.maintenance.not_in_emergency'))
    const exitCents = getV3EmergencyExitCents(state)
    if (state.world.moneyCents + 1e-8 < exitCents) {
      return consumedResult(state, action, state, event('blocked', 'v3.maintenance.unaffordable', { costCents: Math.ceil(exitCents) }))
    }
    return consumedResult(state, action, { ...state, maintenanceEmergency: null }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'resolve_inbox') {
    const resolved = resolveV3InboxItem(state, action.itemId, action.choice)
    if (resolved.blocker) return consumedResult(state, action, state, event('blocked', `v3.inbox.${resolved.blocker}`))
    return consumedResult(state, action, resolved.state, event('success', 'v3.action.ok'))
  }

  if (action.type === 'convert_asphalt') {
    const quantity = action.quantity
    if (!Number.isInteger(quantity) || quantity <= 0) return consumedResult(state, action, state, event('blocked', 'v3.trade.invalid_amount'))
    if (state.campaignProgress.chapter < V3_ASPHALT_CONVERSION.chapter) {
      return consumedResult(state, action, state, event('blocked', 'v3.build.locked', { chapter: V3_ASPHALT_CONVERSION.chapter }))
    }
    const crude = quantity * V3_ASPHALT_CONVERSION.crudePerUnit
    if (state.world.crudeOil + 1e-8 < crude) return consumedResult(state, action, state, event('blocked', 'v3.trade.insufficient_stock'))
    if (getV3ProductQuantity(state, 'asphalt') + quantity > getV3ProductCapacity(state, 'asphalt') + 1e-8) {
      return consumedResult(state, action, state, event('blocked', 'v3.trade.storage_full'))
    }
    // Goods only: crude basis moves into asphalt; no per-click reward.
    const crudeBasis = state.world.crudeOil > 1e-8 ? state.materialCostBasis.crudeCents * crude / state.world.crudeOil : 0
    const converted = addV3CommodityInventory({
      ...state,
      world: { ...state.world, crudeOil: state.world.crudeOil - crude },
      materialCostBasis: { ...state.materialCostBasis, crudeCents: Math.max(0, state.materialCostBasis.crudeCents - crudeBasis) },
    }, 'asphalt', quantity, crudeBasis)
    return consumedResult(state, action, converted.state, event('success', 'v3.action.ok', { quantity }))
  }

  if (action.type === 'set_auto_repeat') {
    if (action.templateId !== null) {
      if (state.campaignProgress.chapter < V3_AUTO_REPEAT_CHAPTER) {
        return consumedResult(state, action, state, event('blocked', 'v3.job.auto_repeat_locked', { chapter: V3_AUTO_REPEAT_CHAPTER }))
      }
      const template = V3_JOB_TEMPLATES[action.templateId]
      const proven = template?.requires && state.jobReceipts.receipts.some((receipt) => receipt.templateId === template.requires && receipt.status === 'completed')
      // Branched (Materials) repeats need a per-job product choice, so they are manual only.
      if (!template || template.kind !== 'repeat' || !proven || template.branches) {
        return consumedResult(state, action, state, event('blocked', 'v3.job.auto_repeat_invalid'))
      }
    }
    return consumedResult(state, action, {
      ...state,
      jobReceipts: { ...state.jobReceipts, autoRepeatTemplateId: action.templateId },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'dispatch_job') {
    const dispatched = dispatchV3Job(state, action.quantity, action.blueprintId)
    if (dispatched.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.job.${dispatched.blocker}` as V3ActionEvent['messageId']))
    }
    return consumedResult(state, action, dispatched.state, event('success', 'v3.action.ok', {
      quantity: dispatched.quantity,
      receiptsCents: dispatched.paidCents,
    }))
  }

  if (action.type === 'cancel_job') {
    const cancelled = cancelV3Job(state)
    if (cancelled.blocker) return consumedResult(state, action, state, event('blocked', 'v3.job.no_active_job'))
    return consumedResult(state, action, cancelled.state, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_stock_policy') {
    if (!state.productBlueprints[action.blueprintId]) {
      return consumedResult(state, action, state, event('blocked', 'v3.blueprint.missing'))
    }
    const previous = state.stockPolicies[action.blueprintId] ?? { keepQuantity: 0, autoSell: false, autoDispatch: false }
    const keepQuantity = action.keepQuantity === undefined
      ? previous.keepQuantity
      : Math.max(0, Number.isFinite(action.keepQuantity) ? action.keepQuantity : 0)
    return consumedResult(state, action, {
      ...state,
      stockPolicies: {
        ...state.stockPolicies,
        [action.blueprintId]: {
          keepQuantity,
          autoSell: action.autoSell ?? previous.autoSell,
          autoDispatch: action.autoDispatch ?? previous.autoDispatch,
        },
      },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'start_recovery') {
    if (state.recoveryState?.status === 'running') {
      return consumedResult(state, action, state, event('blocked', 'v3.recovery.already_running'))
    }
    const started = startV3Recovery(state, action.sequence)
    if (!started) return consumedResult(state, action, state, event('blocked', 'v3.recovery.not_available'))
    return consumedResult(state, action, started, event('success', 'v3.action.ok'))
  }

  if (action.type === 'restore_starter_loaners') {
    const offer = getV3RecoveryOffer(state)
    if (!offer.missingBuildings.length) {
      return consumedResult(state, action, state, event('blocked', 'v3.recovery.no_missing_route'))
    }
    if (offer.emptySlotsNeeded > 0) {
      return consumedResult(state, action, state, event('blocked', 'v3.recovery.clear_slots', { slots: offer.emptySlotsNeeded }))
    }
    const restored = restoreV3StarterLoaners(state)
    if (!restored) return consumedResult(state, action, state, event('blocked', 'v3.recovery.not_available'))
    return consumedResult(state, action, restored, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_program') {
    const program = state.plantPrograms[action.buildingId]
    const blueprint = state.productBlueprints[action.blueprintId]
    const building = getV3BuildingType(state, action.buildingId)
    if (!program || !isV3ProcessBuilding(building)) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_cell'))
    }
    const fit = explainV3ProgramFit(state, action.buildingId, action.blueprintId)
    if (fit) return consumedResult(state, action, state, event('blocked', fit.messageId, fit.params))
    const changedProgram = program.blueprintId === blueprint.id
      ? program
      : { ...program, blueprintId: blueprint.id, setupRemainingTicks: 25 }
    return consumedResult(state, action, {
      ...state,
      plantPrograms: { ...state.plantPrograms, [action.buildingId]: changedProgram },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_pause') {
    const program = state.plantPrograms[action.buildingId]
    if (!program || !isV3ProcessBuilding(getV3BuildingType(state, action.buildingId))) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_cell'))
    }
    return consumedResult(state, action, {
      ...state,
      plantPrograms: {
        ...state.plantPrograms,
        [action.buildingId]: { ...program, paused: action.paused },
      },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_module') {
    const quote = getV3ModuleQuote(state, action.buildingId, action.module)
    if (quote.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.module.${quote.blocker}` as V3ActionEvent['messageId'], quote.params))
    }
    const program = state.plantPrograms[action.buildingId]
    const blueprint = state.productBlueprints[program.blueprintId]
    // Never silently run a blueprint on hardware it was not certified for:
    // an incompatible line pauses until the player selects a matching program.
    const compatible = blueprint?.module === action.module
    const next: V3GameState = {
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents - quote.costCents },
      operatingLedger: { ...state.operatingLedger, capexCents: state.operatingLedger.capexCents + quote.costCents },
      plantPrograms: {
        ...state.plantPrograms,
        [action.buildingId]: { ...program, installedModule: action.module, paused: compatible ? program.paused : true },
      },
    }
    return consumedResult(state, action, next, event('success', 'v3.action.ok', { costCents: quote.costCents, paused: compatible ? 0 : 1 }))
  }

  if (action.type === 'buy_research') {
    const invalid = validateV3Research(state, action.researchId)
    if (invalid) {
      return consumedResult(state, action, state, event('blocked', `v3.research.${invalid.blocker}` as V3ActionEvent['messageId'], invalid.params))
    }
    return consumedResult(state, action, unlockV3Research(state, action.researchId), event('success', 'v3.action.ok'))
  }



  const blocker = validateV3Trade(state, action)
  if (blocker) return consumedResult(state, action, state, blocker)
  if (action.direction === 'buy' && action.product === 'crude') {
    const actual = Math.min(
      action.quantity,
      Math.floor(state.world.moneyCents / getV3CrudeUnitPriceCents(state)),
      Math.max(0, getV3CrudeCapacity(state) - state.world.crudeOil),
    )
    const costCents = actual * getV3CrudeUnitPriceCents(state)
    const purchased = {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - costCents,
        crudeOil: state.world.crudeOil + actual,
      },
      materialCostBasis: {
        ...state.materialCostBasis,
        crudeCents: state.materialCostBasis.crudeCents + costCents,
      },
    }
    return consumedResult(
      state,
      action,
      recordV3Ledger(purchased, { cashOutflowsCents: costCents }),
      event('success', 'v3.action.ok', { quantity: actual, costCents }),
    )
  }
  if (action.direction === 'sell' && (isV3TradableFamily(action.product) || isV3Commodity(action.product))) {
    const consumed = isV3Commodity(action.product)
      ? consumeV3Commodity(state, action.product, action.quantity)
      : consumeV3SellableInventory(state, action.product, action.quantity, action)
    // Spot uses the base price plus the capped trade channel; no Q multiplier.
    // Seasonal market applies to Q-graded families only; commodities sell at list.
    const market = isV3Commodity(action.product) ? 1 : getV3MarketMultiplier(state, action.product)
    const receiptsCents = Math.round(consumed.quantity * V3_SPOT_PRICE_CENTS[action.product] * market * (1 + getV3Modifiers(state).trade.effective))
    const sold = {
      ...consumed.state,
      world: {
        ...consumed.state.world,
        moneyCents: consumed.state.world.moneyCents + receiptsCents,
      },
    }
    return consumedResult(
      state,
      action,
      recordV3Ledger(sold, { receiptsCents, cogsCents: consumed.costBasisCents, unrecognizedCents: consumed.estimatedBasis ? receiptsCents : 0 }),
      event('success', 'v3.action.ok', { quantity: consumed.quantity, receiptsCents }),
    )
  }
  return consumedResult(state, action, state, event('info', 'v3.trade.inventory_pending'))
}
