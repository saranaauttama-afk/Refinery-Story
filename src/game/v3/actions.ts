import type { BuildingType, ProductKey } from '../types'
import { V3_BUILDINGS, V3_CRUDE_PRICE_CENTS, V3_SPOT_PRICE_CENTS } from './data'
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
import { getV3Employee, getV3WageCents } from './workforce'
import type {
  V3Action,
  V3ActionEvent,
  V3ActionResult,
  V3BuildAction,
  V3GameState,
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
  if (!building || V3_BUILDINGS[building].upgradeCostDollars === null) {
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
    if (action.product !== 'gasoline') return event('info', 'v3.trade.inventory_pending')
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
    const plantPrograms = action.building === 'distillationUnit'
      ? {
        ...state.plantPrograms,
        [action.cellIndex]: {
          cellIndex: action.cellIndex,
          blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline,
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
    if (
      (building === 'crudeTank' && state.world.crudeOil > getV3CrudeCapacity(hypothetical) + 1e-8) ||
      (building === 'gasolineTank' && getV3ProductQuantity(state, 'gasoline') > getV3ProductCapacity(hypothetical, 'gasoline') + 1e-8)
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
    if (action.duty.kind !== 'line' && action.duty.kind !== 'reserve') {
      return consumedResult(state, action, state, event('blocked', 'v3.duty.invalid_target'))
    }
    if (action.duty.kind === 'line') {
      const targetCellIndex = action.duty.cellIndex
      if (state.world.grid[targetCellIndex] !== 'distillationUnit' || !state.plantPrograms[targetCellIndex]) {
        return consumedResult(state, action, state, event('blocked', 'v3.duty.invalid_target'))
      }
      if (employee.type !== 'operator') {
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
    if (!program || state.world.grid[action.cellIndex] !== 'distillationUnit') {
      return consumedResult(state, action, state, event('blocked', 'v3.program.invalid_cell'))
    }
    if (!blueprint || blueprint.family !== 'gasoline' || (state.world.gridLevels[action.cellIndex] ?? 1) < blueprint.minPlantLevel) {
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
    if (!program || state.world.grid[action.cellIndex] !== 'distillationUnit') {
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
  if (action.direction === 'sell' && action.product === 'gasoline') {
    const consumed = consumeV3SellableInventory(state, action.product, action.quantity, action)
    const receiptsCents = consumed.quantity * V3_SPOT_PRICE_CENTS[action.product]
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
