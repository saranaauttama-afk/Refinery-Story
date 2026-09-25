import { V3_DISTILLATION, V3_LEVEL_RATE, V3_MODULE_MULTIPLIERS, V3_PROFILE_MULTIPLIERS, V3_TICKS_PER_CYCLE } from './data'
import { advanceV3Development } from './development'
import { addV3JobContribution, runV3AutoDispatch } from './jobs'
import { addV3VariantInventory, getV3ProductCapacity, getV3ProductQuantity } from './productInventory'
import { advanceV3Recovery, isV3LoanerCell } from './recovery'
import type { V3GameState, V3PlantProgram, V3ProductBlueprint } from './types'
import { addV3DutyXp, getV3LineEmployee, getV3LocalCrewRate, settleV3Wages } from './workforce'

const EPSILON = 1e-9

export type V3GasolineLinePlan = {
  cellIndex: number
  blueprintId: string
  status: 'ready' | 'paused' | 'setup' | 'invalid'
  requestedWork: number
  actualWork: number
  crudePerWork: number
  gasoline: number
  feedstock: number
  discardedFeedstock: number
  waste: number
  disposedWaste: number
  potentialGasolinePerMinute: number
  actualGasolinePerMinute: number
  crewRate: number
  employeeId: string | null
}

function feedstockCapacity(state: V3GameState): number {
  const cells = state.world.grid.filter((cell) => cell === 'distillationUnit').length
  return V3_DISTILLATION.feedstockBaseCapacity + cells * V3_DISTILLATION.feedstockCapacityPerCell
}

function lineRequest(
  state: V3GameState,
  cellIndex: number,
  program: V3PlantProgram,
  deltaTicks: number,
  boostRate: number,
): { plan: V3GasolineLinePlan; blueprint: V3ProductBlueprint | null } {
  const blueprint = state.productBlueprints[program.blueprintId] ?? null
  const level = state.world.gridLevels[cellIndex] ?? 1
  let status: V3GasolineLinePlan['status'] = 'ready'
  if (program.paused) status = 'paused'
  else if (program.setupRemainingTicks > 0) status = 'setup'
  else if (
    state.world.grid[cellIndex] !== 'distillationUnit' ||
    blueprint?.family !== 'gasoline' ||
    blueprint.module !== program.installedModule ||
    level < (blueprint?.minPlantLevel ?? 99)
  ) status = 'invalid'
  const profile = blueprint ? V3_PROFILE_MULTIPLIERS[blueprint.profile] : V3_PROFILE_MULTIPLIERS.standard
  const module = V3_MODULE_MULTIPLIERS[program.installedModule]
  const employee = getV3LineEmployee(state, cellIndex)
  const loanerRate = isV3LoanerCell(state, cellIndex) ? 0.5 : 1
  const crewRate = status === 'ready' && loanerRate === 1 ? getV3LocalCrewRate(state, cellIndex) : 0
  const requestedWork = status === 'ready'
    ? deltaTicks / V3_TICKS_PER_CYCLE * (V3_LEVEL_RATE[level] ?? 0) * profile.work * module.work * (1 + crewRate) * boostRate * loanerRate
    : 0
  const crudePerWork = V3_DISTILLATION.crudePerWork * profile.input * module.input
  return {
    blueprint,
    plan: {
      cellIndex,
      blueprintId: program.blueprintId,
      status,
      requestedWork,
      actualWork: 0,
      crudePerWork,
      gasoline: 0,
      feedstock: 0,
      discardedFeedstock: 0,
      waste: 0,
      disposedWaste: 0,
      potentialGasolinePerMinute: requestedWork * V3_DISTILLATION.gasolinePerWork * 300 / Math.max(deltaTicks, 1),
      actualGasolinePerMinute: 0,
      crewRate,
      employeeId: employee?.id ?? null,
    },
  }
}

function allocateWork(maxWork: number[], available: number, perWork: number[]): number[] {
  const work = maxWork.map(() => 0)
  let remaining = Math.max(0, available)
  let active = maxWork.map((cap, index) => ({ cap, index })).filter(({ cap, index }) => cap > EPSILON && perWork[index] > EPSILON)
  while (active.length && remaining > EPSILON) {
    const sharedWork = remaining / active.reduce((sum, { index }) => sum + perWork[index], 0)
    const capped = active.filter(({ cap, index }) => cap - work[index] <= sharedWork + EPSILON)
    if (!capped.length) {
      for (const { index } of active) work[index] += sharedWork
      break
    }
    const done = new Set<number>()
    for (const { cap, index } of capped) {
      const added = Math.max(0, cap - work[index])
      work[index] += added
      remaining -= added * perWork[index]
      done.add(index)
    }
    active = active.filter(({ index }) => !done.has(index))
  }
  return work
}

export function evaluateV3GasolineProduction(
  state: V3GameState,
  deltaTicks = 1,
  boostRate = 1,
): V3GasolineLinePlan[] {
  const requests = Object.values(state.plantPrograms)
    .sort((a, b) => a.cellIndex - b.cellIndex)
    .map((program) => lineRequest(state, program.cellIndex, program, deltaTicks, boostRate).plan)
  const gasSpace = Math.max(0, getV3ProductCapacity(state, 'gasoline') - getV3ProductQuantity(state, 'gasoline'))
  const outputBound = allocateWork(
    requests.map((request) => request.requestedWork),
    gasSpace,
    requests.map(() => V3_DISTILLATION.gasolinePerWork),
  )
  const crudeBound = allocateWork(outputBound, state.world.crudeOil, requests.map((request) => request.crudePerWork))
  return requests.map((request, index) => ({
    ...request,
    actualWork: crudeBound[index],
    gasoline: crudeBound[index] * V3_DISTILLATION.gasolinePerWork,
    actualGasolinePerMinute: crudeBound[index] * V3_DISTILLATION.gasolinePerWork * 300 / Math.max(deltaTicks, 1),
  }))
}

export type V3ProductionResult = {
  state: V3GameState
  lines: V3GasolineLinePlan[]
}

export function runV3ProductionTick(state: V3GameState, deltaTicks = 1, boostRate = 1): V3ProductionResult {
  const settlement = state.recoveryState?.status === 'running'
    ? { state, paidEmployeeIds: [], unpaidEmployeeIds: state.unpaidEmployeeIds, wagesCents: 0 }
    : settleV3Wages(state, deltaTicks)
  const developed = advanceV3Development(settlement.state, deltaTicks)
  const lines = evaluateV3GasolineProduction(developed, deltaTicks, boostRate)
  const totalCrude = lines.reduce((sum, line) => sum + line.actualWork * line.crudePerWork, 0)
  const crudeUnitBasis = state.world.crudeOil > EPSILON ? state.materialCostBasis.crudeCents / state.world.crudeOil : 0
  let next = developed
  let feedstock = developed.world.feedstock
  let feedstockBasis = developed.materialCostBasis.feedstockCents
  let waste = developed.world.waste
  for (const line of lines) {
    if (line.actualWork <= EPSILON) continue
    const producedFeedstock = line.actualWork * V3_DISTILLATION.feedstockPerWork
    const retainedFeedstock = Math.min(producedFeedstock, Math.max(0, feedstockCapacity(state) - feedstock))
    const producedWaste = line.actualWork * V3_DISTILLATION.wastePerWork
    const retainedWaste = Math.min(producedWaste, Math.max(0, V3_DISTILLATION.wasteCapacity - waste))
    const inputCost = line.actualWork * line.crudePerWork * crudeUnitBasis
    const gasolineValue = line.gasoline * 18
    const feedstockValue = retainedFeedstock * 8
    const gasolineCost = feedstockValue > EPSILON ? inputCost * gasolineValue / (gasolineValue + feedstockValue) : inputCost
    const feedstockCost = inputCost - gasolineCost
    const added = addV3VariantInventory(next, line.blueprintId, line.gasoline, gasolineCost)
    next = added.state
    const quality = next.productBlueprints[line.blueprintId]?.quality ?? 0
    next = addV3JobContribution(next, line.employeeId, 'gasoline', quality, added.quantity)
    feedstock += retainedFeedstock
    feedstockBasis += feedstockCost
    waste += retainedWaste
    line.feedstock = retainedFeedstock
    line.discardedFeedstock = producedFeedstock - retainedFeedstock
    line.waste = retainedWaste
    line.disposedWaste = producedWaste - retainedWaste
  }
  const programs = { ...next.plantPrograms }
  for (const program of Object.values(programs)) {
    if (program.setupRemainingTicks > 0) {
      programs[program.cellIndex] = { ...program, setupRemainingTicks: Math.max(0, program.setupRemainingTicks - deltaTicks) }
    }
  }
  const producedState = addV3DutyXp({
    ...next,
    world: {
      ...next.world,
      tickCount: next.world.tickCount + deltaTicks,
      crudeOil: Math.max(0, next.world.crudeOil - totalCrude),
      feedstock,
      waste,
    },
    materialCostBasis: {
      ...next.materialCostBasis,
      crudeCents: Math.max(0, next.materialCostBasis.crudeCents - totalCrude * crudeUnitBasis),
      feedstockCents: feedstockBasis,
    },
    plantPrograms: programs,
  }, Object.fromEntries(lines.map((line) => [line.cellIndex, line.actualWork])))
  return { lines, state: advanceV3Recovery(runV3AutoDispatch(producedState), deltaTicks) }
}
