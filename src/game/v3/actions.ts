import type { BuildingType, ProductKey, WorkerType } from '../types'
import { unlockV3Research, validateV3Research } from './research'
import {
  V3_BUILDINGS,
  V3_CRUDE_PRICE_CENTS,
  V3_MODULE_CHAPTER,
  V3_MODULE_FIT_COST_RATE,
  V3_MODULE_MIN_PLANT_LEVEL,
  V3_PLANT_BY_FAMILY,
  V3_PROCESS_UNITS,
  V3_ROLES,
  V3_SPECIALIZATION_CHAPTER,
  V3_SPOT_PRICE_CENTS,
  V3_STAFF_LEVELS,
  isV3ProcessBuilding,
} from './data'
import { getV3Modifiers } from './modifiers'
import { expandV3Grid } from './expansion'
import { cancelV3Development, startV3Development } from './development'
import { acceptV3Job, cancelV3Job, dispatchV3Job } from './jobs'
import {
  consumeV3SellableInventory,
  getV3CrudeCapacity,
  getV3ProductCapacity,
  getV3ProductQuantity,
  getV3SellableQuantity,
  recordV3Ledger,
} from './productInventory'
import { V3_DEFAULT_BLUEPRINT_ID } from './state'
import { getV3RecoveryOffer, isV3LoanerCell, restoreV3StarterLoaners, startV3Recovery } from './recovery'
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

const STORAGE_PRODUCT: Partial<Record<BuildingType, V3ProductFamily>> = {
  gasolineTank: 'gasoline',
  lubricantTank: 'lubricants',
  jetFuelTank: 'jetFuel',
}

export function isV3TradableFamily(product: ProductKey | 'crude'): product is V3ProductFamily {
  return product !== 'crude' && V3_PLANT_BY_FAMILY[product] !== undefined
}

export type V3ModuleQuote =
  | { blocker: null; costCents: number; params?: undefined }
  | { blocker: 'invalid_cell' | 'locked' | 'plant_level' | 'no_change' | 'insufficient_cash'; costCents: number; params?: Record<string, number> }

/** Shared module fit validation used by the action and the UI preview. */
export function getV3ModuleQuote(state: V3GameState, cellIndex: number, module: V3ModuleKey): V3ModuleQuote {
  const building = state.world.grid[cellIndex]
  const program = state.plantPrograms[cellIndex]
  if (!isV3ProcessBuilding(building) || !program || isV3LoanerCell(state, cellIndex)) return { blocker: 'invalid_cell', costCents: 0 }
  if (program.installedModule === module) return { blocker: 'no_change', costCents: 0 }
  const costCents = module === 'none' ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 100 * V3_MODULE_FIT_COST_RATE)
  if (module !== 'none') {
    if (state.campaignProgress.chapter < V3_MODULE_CHAPTER) return { blocker: 'locked', costCents, params: { chapter: V3_MODULE_CHAPTER } }
    if ((state.world.gridLevels[cellIndex] ?? 1) < V3_MODULE_MIN_PLANT_LEVEL) return { blocker: 'plant_level', costCents, params: { level: V3_MODULE_MIN_PLANT_LEVEL } }
    if (state.world.moneyCents < costCents) return { blocker: 'insufficient_cash', costCents, params: { costCents } }
  }
  return { blocker: null, costCents }
}

export function getV3ActionId(action: Pick<V3Action, 'type' | 'sequence'>): string {
  return `action:${action.type}:${String(action.sequence).padStart(8, '0')}`
}

export function validateV3Build(state: V3GameState, action: V3BuildAction): V3ActionEvent | null {
  if (!Number.isInteger(action.cellIndex) || action.cellIndex < 0 || action.cellIndex >= state.world.grid.length) {
    return event('blocked', 'v3.build.invalid_cell')
  }
  if (state.world.grid[action.cellIndex] !== null) {
    return event('blocked', 'v3.build.occupied')
  }
  if (!V3_SUPPORTED_BUILDINGS.has(action.building)) {
    return event('blocked', 'v3.build.unsupported')
  }
  const capability = V3_BUILDINGS[action.building]
  const requiredChapter = capability.buildChapter
  if (state.campaignProgress.chapter < requiredChapter) {
    return event('blocked', 'v3.build.locked', { chapter: requiredChapter })
  }
  const costCents = capability.buildCostDollars * 100
  if (state.world.moneyCents < costCents) {
    return event('blocked', 'v3.build.insufficient_cash', { costCents })
  }
  return null
}

export function validateV3Upgrade(state: V3GameState, action: V3UpgradeAction): V3ActionEvent | null {
  if (!Number.isInteger(action.cellIndex) || action.cellIndex < 0 || action.cellIndex >= state.world.grid.length) {
    return event('blocked', 'v3.upgrade.invalid_cell')
  }
  const building = state.world.grid[action.cellIndex]
  if (!building || !V3_SUPPORTED_BUILDINGS.has(building) || V3_BUILDINGS[building].upgradeCostDollars === null) {
    return event('blocked', 'v3.upgrade.unsupported')
  }
  const level = state.world.gridLevels[action.cellIndex] ?? 1
  const capability = V3_BUILDINGS[building]
  const cost = capability.upgradeCostDollars?.[level - 1]
  if (cost === undefined) {
    return event('blocked', 'v3.upgrade.max_level')
  }
  const requiredChapter = capability.upgradeChapter?.[level - 1]
  if (requiredChapter !== undefined && state.campaignProgress.chapter < requiredChapter) {
    return event('blocked', 'v3.upgrade.locked', { chapter: requiredChapter })
  }
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
    if (state.world.moneyCents < V3_CRUDE_PRICE_CENTS) return event('blocked', 'v3.trade.insufficient_cash')
    if (state.world.crudeOil >= getV3CrudeCapacity(state) - 1e-8) return event('blocked', 'v3.trade.storage_full')
  } else {
    if (action.product === 'crude') {
      return event('blocked', 'v3.trade.insufficient_stock')
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
  return {
    state: { ...next, nextActionSequence: state.nextActionSequence + 1 },
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

  if (action.type === 'build') {
    const blocker = validateV3Build(state, action)
    if (blocker) return consumedResult(state, action, state, blocker)
    const costCents = V3_BUILDINGS[action.building].buildCostDollars * 100
    const grid = [...state.world.grid]
    const gridLevels = [...state.world.gridLevels]
    grid[action.cellIndex] = action.building
    gridLevels[action.cellIndex] = 1
    const plantPrograms = isV3ProcessBuilding(action.building)
      ? {
        ...state.plantPrograms,
        [action.cellIndex]: {
          cellIndex: action.cellIndex,
          blueprintId: V3_DEFAULT_BLUEPRINT_ID[V3_PROCESS_UNITS[action.building].family],
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
        grid,
        gridLevels,
      },
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + costCents,
      },
      plantPrograms,
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'demolish') {
    if (!Number.isInteger(action.cellIndex) || action.cellIndex < 0 || action.cellIndex >= state.world.grid.length) {
      return consumedResult(state, action, state, event('blocked', 'v3.demolish.invalid_cell'))
    }
    const building = state.world.grid[action.cellIndex]
    if (!building) return consumedResult(state, action, state, event('blocked', 'v3.demolish.invalid_cell'))
    if (building !== action.expectedBuilding) {
      return consumedResult(state, action, state, event('blocked', 'v3.demolish.building_changed'))
    }
    if (building === 'laboratory' && state.developmentProject?.labCellIndex === action.cellIndex) {
      return consumedResult(state, action, state, event('blocked', 'v3.demolish.active_project'))
    }
    const grid = [...state.world.grid]
    grid[action.cellIndex] = null
    const hypothetical = { ...state, world: { ...state.world, grid } }
    const storedProduct = STORAGE_PRODUCT[building]
    if (
      (building === 'crudeTank' && state.world.crudeOil > getV3CrudeCapacity(hypothetical) + 1e-8) ||
      (storedProduct && getV3ProductQuantity(state, storedProduct) > getV3ProductCapacity(hypothetical, storedProduct) + 1e-8)
    ) {
      return consumedResult(state, action, state, event('blocked', 'v3.demolish.stock_overflow'))
    }
    const loaner = isV3LoanerCell(state, action.cellIndex)
    const refundCents = loaner ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 100 * 0.5)
    const plantPrograms = { ...state.plantPrograms }
    delete plantPrograms[action.cellIndex]
    const employeeDuties = Object.fromEntries(Object.entries(state.employeeDuties).map(([employeeId, duty]) => [
      employeeId,
      duty.kind === 'line' && duty.cellIndex === action.cellIndex ? { kind: 'reserve' as const } : duty,
    ]))
    return consumedResult(state, action, {
      ...state,
      world: { ...state.world, moneyCents: state.world.moneyCents + refundCents, grid },
      plantPrograms,
      employeeDuties,
      recoveryState: state.recoveryState ? {
        ...state.recoveryState,
        loanerCellIndices: state.recoveryState.loanerCellIndices.filter((index) => index !== action.cellIndex),
      } : null,
    }, event('success', 'v3.action.ok', { refundCents }))
  }

  if (action.type === 'upgrade') {
    if (isV3LoanerCell(state, action.cellIndex)) {
      return consumedResult(state, action, state, event('blocked', 'v3.upgrade.unsupported'))
    }
    const blocker = validateV3Upgrade(state, action)
    if (blocker) return consumedResult(state, action, state, blocker)
    const building = state.world.grid[action.cellIndex]!
    const level = state.world.gridLevels[action.cellIndex] ?? 1
    const costCents = V3_BUILDINGS[building].upgradeCostDollars![level - 1] * 100
    const gridLevels = [...state.world.gridLevels]
    gridLevels[action.cellIndex] = level + 1
    return consumedResult(state, action, {
      ...state,
      world: {
        ...state.world,
        moneyCents: state.world.moneyCents - costCents,
        gridLevels,
      },
      operatingLedger: {
        ...state.operatingLedger,
        capexCents: state.operatingLedger.capexCents + costCents,
      },
    }, event('success', 'v3.action.ok'))
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
      const targetCellIndex = action.duty.cellIndex
      if (!isV3ProcessBuilding(state.world.grid[targetCellIndex]) || !state.plantPrograms[targetCellIndex]) {
        return consumedResult(state, action, state, event('blocked', 'v3.duty.invalid_target'))
      }
      if (!canV3StaffLine(employee.type, state.world.grid[targetCellIndex])) {
        return consumedResult(state, action, state, event('blocked', 'v3.duty.ineligible'))
      }
      const occupant = Object.entries(state.employeeDuties).find(([id, duty]) =>
        id !== employee.id && duty.kind === 'line' && duty.cellIndex === targetCellIndex,
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
    const accepted = acceptV3Job(state, action.templateId, action.sequence)
    if (accepted.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.job.${accepted.blocker}` as V3ActionEvent['messageId']))
    }
    return consumedResult(state, action, accepted.state, event('success', 'v3.action.ok'))
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
    const program = state.plantPrograms[action.cellIndex]
    const blueprint = state.productBlueprints[action.blueprintId]
    const building = state.world.grid[action.cellIndex]
    if (!program || !isV3ProcessBuilding(building)) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_cell'))
    }
    if (!blueprint || blueprint.family !== V3_PROCESS_UNITS[building].family || (state.world.gridLevels[action.cellIndex] ?? 1) < blueprint.minPlantLevel) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_blueprint'))
    }
    if (blueprint.module !== program.installedModule) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.module_mismatch'))
    }
    if (isV3LoanerCell(state, action.cellIndex) && action.blueprintId !== V3_DEFAULT_BLUEPRINT_ID.gasoline) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_blueprint'))
    }
    const changedProgram = program.blueprintId === blueprint.id
      ? program
      : { ...program, blueprintId: blueprint.id, setupRemainingTicks: 25 }
    return consumedResult(state, action, {
      ...state,
      plantPrograms: { ...state.plantPrograms, [action.cellIndex]: changedProgram },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_pause') {
    const program = state.plantPrograms[action.cellIndex]
    if (!program || !isV3ProcessBuilding(state.world.grid[action.cellIndex])) {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_cell'))
    }
    return consumedResult(state, action, {
      ...state,
      plantPrograms: {
        ...state.plantPrograms,
        [action.cellIndex]: { ...program, paused: action.paused },
      },
    }, event('success', 'v3.action.ok'))
  }

  if (action.type === 'set_module') {
    const quote = getV3ModuleQuote(state, action.cellIndex, action.module)
    if (quote.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.module.${quote.blocker}` as V3ActionEvent['messageId'], quote.params))
    }
    const program = state.plantPrograms[action.cellIndex]
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
        [action.cellIndex]: { ...program, installedModule: action.module, paused: compatible ? program.paused : true },
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

  if (action.type === 'expand_grid') {
    const expanded = expandV3Grid(state)
    if (expanded.blocker) {
      return consumedResult(state, action, state, event('blocked', `v3.expand.${expanded.blocker}` as V3ActionEvent['messageId'], expanded.params))
    }
    return consumedResult(state, action, expanded.state, event('success', 'v3.action.ok'))
  }

  const blocker = validateV3Trade(state, action)
  if (blocker) return consumedResult(state, action, state, blocker)
  if (action.direction === 'buy' && action.product === 'crude') {
    const actual = Math.min(
      action.quantity,
      Math.floor(state.world.moneyCents / V3_CRUDE_PRICE_CENTS),
      Math.max(0, getV3CrudeCapacity(state) - state.world.crudeOil),
    )
    const costCents = actual * V3_CRUDE_PRICE_CENTS
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
  if (action.direction === 'sell' && isV3TradableFamily(action.product)) {
    const consumed = consumeV3SellableInventory(state, action.product, action.quantity, action)
    // Spot uses the base price plus the capped trade channel; no Q multiplier.
    const receiptsCents = Math.round(consumed.quantity * V3_SPOT_PRICE_CENTS[action.product] * (1 + getV3Modifiers(state).trade.effective))
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
      recordV3Ledger(sold, { receiptsCents, cogsCents: consumed.costBasisCents }),
      event('success', 'v3.action.ok', { quantity: consumed.quantity, receiptsCents }),
    )
  }
  return consumedResult(state, action, state, event('info', 'v3.trade.inventory_pending'))
}
