import {
  V3_DISTILLATION,
  V3_FEEDSTOCK_REFERENCE_CENTS,
  V3_GENERATOR_BY_LEVEL,
  V3_LEVEL_RATE,
  V3_MODULE_MULTIPLIERS,
  V3_PROCESS_UNITS,
  V3_PROFILE_MULTIPLIERS,
  V3_SITE_POWER,
  V3_SPOT_PRICE_CENTS,
  V3_TICKS_PER_CYCLE,
  isV3ProcessBuilding,
  type V3ProcessBuilding,
  type V3ProcessInput,
} from './data'
import { advanceV3Development } from './development'
import { addV3JobContribution, runV3AutoDispatch } from './jobs'
import { addV3VariantInventory, getV3ProductCapacity, getV3ProductQuantity } from './productInventory'
import { advanceV3Recovery, isV3LoanerCell } from './recovery'
import type { V3GameState, V3PlantProgram, V3ProductFamily } from './types'
import { addV3DutyXp, getV3LineEmployee, getV3LocalCrewRate, settleV3Wages } from './workforce'

const EPSILON = 1e-9

export type V3LineStatus = 'ready' | 'paused' | 'setup' | 'invalid'

export type V3LinePlan = {
  cellIndex: number
  building: V3ProcessBuilding
  family: V3ProductFamily
  blueprintId: string
  status: V3LineStatus
  requestedWork: number
  actualWork: number
  input: V3ProcessInput
  inputPerWork: number
  energyPerWork: number
  outputQuantity: number
  feedstock: number
  discardedFeedstock: number
  waste: number
  disposedWaste: number
  energyUsed: number
  potentialOutputPerMinute: number
  actualOutputPerMinute: number
  potentialEnergyPerMinute: number
  crewRate: number
  employeeId: string | null
  limitedBy: 'none' | 'output_space' | 'input' | 'power'
}

export type V3PowerPlan = {
  batteryCapacity: number
  openingCharge: number
  siteEnergy: number
  generatorEnergy: number
  generatorFuel: number
  crudeReservedForDistillation: number
  chargeAfterGeneration: number
  energyUsed: number
  potentialSupplyPerMinute: number
  requestedDemandPerMinute: number
  actualDemandPerMinute: number
}

export type V3ProductionPlan = {
  lines: V3LinePlan[]
  power: V3PowerPlan
}

export function getV3FeedstockCapacity(state: V3GameState): number {
  const cells = state.world.grid.filter((cell) => cell === 'distillationUnit').length
  return V3_DISTILLATION.feedstockBaseCapacity + cells * V3_DISTILLATION.feedstockCapacityPerCell
}

function generatorCells(state: V3GameState): Array<{ cellIndex: number; level: number }> {
  const cells: Array<{ cellIndex: number; level: number }> = []
  state.world.grid.forEach((cell, cellIndex) => {
    if (cell === 'powerPlant') cells.push({ cellIndex, level: state.world.gridLevels[cellIndex] ?? 1 })
  })
  return cells
}

export function getV3BatteryCapacity(state: V3GameState): number {
  return V3_SITE_POWER.battery + generatorCells(state)
    .reduce((sum, { level }) => sum + (V3_GENERATOR_BY_LEVEL[level]?.battery ?? 0), 0)
}

/** Energy supply per full 5s cycle before fuel limits (site + all generators). */
export function getV3PotentialPowerPerCycle(state: V3GameState): number {
  return V3_SITE_POWER.energyPerCycle + generatorCells(state)
    .reduce((sum, { level }) => sum + (V3_GENERATOR_BY_LEVEL[level]?.energyPerCycle ?? 0), 0)
}

function lineRequest(
  state: V3GameState,
  program: V3PlantProgram,
  deltaTicks: number,
  boostRate: number,
): V3LinePlan | null {
  const building = state.world.grid[program.cellIndex]
  if (!isV3ProcessBuilding(building)) return null
  const unit = V3_PROCESS_UNITS[building]
  const blueprint = state.productBlueprints[program.blueprintId] ?? null
  const level = state.world.gridLevels[program.cellIndex] ?? 1
  let status: V3LineStatus = 'ready'
  if (program.paused) status = 'paused'
  else if (program.setupRemainingTicks > 0) status = 'setup'
  else if (
    blueprint?.family !== unit.family ||
    blueprint.module !== program.installedModule ||
    level < blueprint.minPlantLevel
  ) status = 'invalid'
  const profile = blueprint ? V3_PROFILE_MULTIPLIERS[blueprint.profile] : V3_PROFILE_MULTIPLIERS.standard
  const module = V3_MODULE_MULTIPLIERS[program.installedModule]
  const employee = getV3LineEmployee(state, program.cellIndex)
  const loanerRate = isV3LoanerCell(state, program.cellIndex) ? 0.5 : 1
  const crewRate = status === 'ready' && loanerRate === 1 ? getV3LocalCrewRate(state, program.cellIndex) : 0
  const requestedWork = status === 'ready'
    ? deltaTicks / V3_TICKS_PER_CYCLE * (V3_LEVEL_RATE[level] ?? 0) * profile.work * module.work * (1 + crewRate) * boostRate * loanerRate
    : 0
  const perMinute = 300 / Math.max(deltaTicks, 1)
  const energyPerWork = unit.energyPerWork * profile.energy * module.energy
  return {
    cellIndex: program.cellIndex,
    building,
    family: unit.family,
    blueprintId: program.blueprintId,
    status,
    requestedWork,
    actualWork: 0,
    input: unit.input,
    inputPerWork: unit.inputPerWork * profile.input * module.input,
    energyPerWork,
    outputQuantity: 0,
    feedstock: 0,
    discardedFeedstock: 0,
    waste: 0,
    disposedWaste: 0,
    energyUsed: 0,
    potentialOutputPerMinute: requestedWork * unit.outputPerWork * perMinute,
    actualOutputPerMinute: 0,
    potentialEnergyPerMinute: requestedWork * energyPerWork * perMinute,
    crewRate,
    employeeId: employee?.id ?? null,
    limitedBy: 'none',
  }
}

/** Progressive equal-weight allocation of one shared resource across capped requests. */
export function allocateV3Work(maxWork: number[], available: number, perWork: number[]): number[] {
  const work = maxWork.map((cap, index) => (perWork[index] <= EPSILON ? Math.max(0, cap) : 0))
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

function boundByOutputSpace(state: V3GameState, lines: V3LinePlan[]): number[] {
  const bound = lines.map(() => 0)
  const families = [...new Set(lines.map((line) => line.family))]
  for (const family of families) {
    const indices = lines.map((line, index) => (line.family === family ? index : -1)).filter((index) => index >= 0)
    const space = Math.max(0, getV3ProductCapacity(state, family) - getV3ProductQuantity(state, family))
    const perWork = indices.map((index) => V3_PROCESS_UNITS[lines[index].building].outputPerWork)
    const allocated = allocateV3Work(indices.map((index) => lines[index].requestedWork), space, perWork)
    indices.forEach((lineIndex, position) => { bound[lineIndex] = allocated[position] })
  }
  return bound
}

function planGeneration(state: V3GameState, deltaTicks: number, crudeReserved: number) {
  const capacity = getV3BatteryCapacity(state)
  const opening = state.world.electricity
  const space = Math.max(0, capacity - opening)
  const cycleFraction = deltaTicks / V3_TICKS_PER_CYCLE
  const siteEnergy = Math.min(space, V3_SITE_POWER.energyPerCycle * cycleFraction)
  const generators = generatorCells(state).map(({ level }) => V3_GENERATOR_BY_LEVEL[level] ?? V3_GENERATOR_BY_LEVEL[0])
  const potential = generators.map((generator) => generator.energyPerCycle * cycleFraction)
  const totalPotential = potential.reduce((sum, value) => sum + value, 0)
  const wanted = Math.min(Math.max(0, space - siteEnergy), totalPotential)
  let fuel = 0
  if (totalPotential > EPSILON) {
    generators.forEach((generator, index) => {
      const energy = wanted * potential[index] / totalPotential
      if (generator.energyPerCycle > 0) fuel += energy * generator.crudePerCycle / generator.energyPerCycle
    })
  }
  const availableFuel = Math.max(0, state.world.crudeOil - crudeReserved)
  const scale = fuel > availableFuel + EPSILON && fuel > EPSILON ? availableFuel / fuel : 1
  const generatorEnergy = wanted * scale
  const generatorFuel = fuel * scale
  return {
    batteryCapacity: capacity,
    openingCharge: opening,
    siteEnergy,
    generatorEnergy,
    generatorFuel,
    chargeAfterGeneration: opening + siteEnergy + generatorEnergy,
  }
}

export function evaluateV3Production(state: V3GameState, deltaTicks = 1, boostRate = 1): V3ProductionPlan {
  const lines = Object.values(state.plantPrograms)
    .sort((a, b) => a.cellIndex - b.cellIndex)
    .map((program) => lineRequest(state, program, deltaTicks, boostRate))
    .filter((line): line is V3LinePlan => line !== null)
  const outputBound = boundByOutputSpace(state, lines)
  const actual = lines.map(() => 0)

  // Distillation first: its due crude is reserved before generator fuel.
  const crudeIndices = lines.map((line, index) => (line.input === 'crude' ? index : -1)).filter((index) => index >= 0)
  const crudeWork = allocateV3Work(
    crudeIndices.map((index) => outputBound[index]),
    state.world.crudeOil,
    crudeIndices.map((index) => lines[index].inputPerWork),
  )
  crudeIndices.forEach((lineIndex, position) => { actual[lineIndex] = crudeWork[position] })
  const crudeReserved = crudeIndices.reduce((sum, index) => sum + actual[index] * lines[index].inputPerWork, 0)

  const generation = planGeneration(state, deltaTicks, crudeReserved)

  // Downstream lines share opening feedstock, then the charged battery.
  const feedIndices = lines.map((line, index) => (line.input === 'feedstock' ? index : -1)).filter((index) => index >= 0)
  const feedWork = allocateV3Work(
    feedIndices.map((index) => outputBound[index]),
    state.world.feedstock,
    feedIndices.map((index) => lines[index].inputPerWork),
  )
  const energyWork = allocateV3Work(
    feedWork,
    generation.chargeAfterGeneration,
    feedIndices.map((index) => lines[index].energyPerWork),
  )
  feedIndices.forEach((lineIndex, position) => { actual[lineIndex] = energyWork[position] })

  const perMinute = 300 / Math.max(deltaTicks, 1)
  const planned = lines.map((line, index) => {
    const work = actual[index]
    const unit = V3_PROCESS_UNITS[line.building]
    let limitedBy: V3LinePlan['limitedBy'] = 'none'
    if (line.requestedWork > EPSILON && work + 1e-7 < line.requestedWork) {
      if (outputBound[index] + 1e-7 < line.requestedWork) limitedBy = 'output_space'
      else if (line.input === 'crude') limitedBy = 'input'
      else {
        const position = feedIndices.indexOf(index)
        limitedBy = feedWork[position] + 1e-7 < outputBound[index] ? 'input' : 'power'
      }
    }
    return {
      ...line,
      actualWork: work,
      outputQuantity: work * unit.outputPerWork,
      energyUsed: work * line.energyPerWork,
      actualOutputPerMinute: work * unit.outputPerWork * perMinute,
      limitedBy,
    }
  })
  const energyUsed = planned.reduce((sum, line) => sum + line.energyUsed, 0)
  return {
    lines: planned,
    power: {
      ...generation,
      crudeReservedForDistillation: crudeReserved,
      energyUsed,
      potentialSupplyPerMinute: getV3PotentialPowerPerCycle(state) * 12,
      requestedDemandPerMinute: planned.reduce((sum, line) => sum + line.potentialEnergyPerMinute, 0),
      actualDemandPerMinute: energyUsed * perMinute,
    },
  }
}

/** Compatibility view used by Gasoline regression checks. */
export function evaluateV3GasolineProduction(state: V3GameState, deltaTicks = 1, boostRate = 1): V3LinePlan[] {
  return evaluateV3Production(state, deltaTicks, boostRate).lines.filter((line) => line.family === 'gasoline')
}

export type V3ProductionResult = {
  state: V3GameState
  lines: V3LinePlan[]
  power: V3PowerPlan
}

export function runV3ProductionTick(state: V3GameState, deltaTicks = 1, boostRate = 1): V3ProductionResult {
  const settlement = state.recoveryState?.status === 'running'
    ? { state, paidEmployeeIds: [], unpaidEmployeeIds: state.unpaidEmployeeIds, wagesCents: 0 }
    : settleV3Wages(state, deltaTicks)
  const developed = advanceV3Development(settlement.state, deltaTicks)
  const { lines, power } = evaluateV3Production(developed, deltaTicks, boostRate)
  const world = developed.world
  const basis = developed.materialCostBasis

  // Crude: distillation input plus generator fuel, both from opening stock.
  const crudeUnitBasis = world.crudeOil > EPSILON ? basis.crudeCents / world.crudeOil : 0
  const distillCrude = lines.reduce((sum, line) => sum + (line.input === 'crude' ? line.actualWork * line.inputPerWork : 0), 0)
  const fuelCents = power.generatorFuel * crudeUnitBasis

  // Battery: generator fuel basis moves into the battery; site energy has zero basis.
  const chargedEnergy = power.chargeAfterGeneration
  const chargedBasis = basis.electricityCents + fuelCents
  const energyUnitBasis = chargedEnergy > EPSILON ? chargedBasis / chargedEnergy : 0

  // Feedstock consumed from opening stock by downstream lines.
  const feedUnitBasis = world.feedstock > EPSILON ? basis.feedstockCents / world.feedstock : 0
  const feedConsumed = lines.reduce((sum, line) => sum + (line.input === 'feedstock' ? line.actualWork * line.inputPerWork : 0), 0)

  let next: V3GameState = developed
  let feedstock = Math.max(0, world.feedstock - feedConsumed)
  let feedstockBasis = Math.max(0, basis.feedstockCents - feedConsumed * feedUnitBasis)
  let waste = world.waste
  const feedstockCapacity = getV3FeedstockCapacity(developed)
  for (const line of lines) {
    if (line.actualWork <= EPSILON) continue
    const producedWaste = line.actualWork * V3_PROCESS_UNITS[line.building].wastePerWork
    const retainedWaste = Math.min(producedWaste, Math.max(0, V3_DISTILLATION.wasteCapacity - waste))
    waste += retainedWaste
    line.waste = retainedWaste
    line.disposedWaste = producedWaste - retainedWaste
    let outputCost: number
    if (line.input === 'crude') {
      const inputCost = line.actualWork * line.inputPerWork * crudeUnitBasis
      const producedFeedstock = line.actualWork * V3_DISTILLATION.feedstockPerWork
      const retainedFeedstock = Math.min(producedFeedstock, Math.max(0, feedstockCapacity - feedstock))
      const outputValue = line.outputQuantity * V3_SPOT_PRICE_CENTS.gasoline
      const feedstockValue = retainedFeedstock * V3_FEEDSTOCK_REFERENCE_CENTS
      outputCost = feedstockValue > EPSILON ? inputCost * outputValue / (outputValue + feedstockValue) : inputCost
      feedstock += retainedFeedstock
      feedstockBasis += inputCost - outputCost
      line.feedstock = retainedFeedstock
      line.discardedFeedstock = producedFeedstock - retainedFeedstock
    } else {
      outputCost = line.actualWork * line.inputPerWork * feedUnitBasis + line.energyUsed * energyUnitBasis
    }
    const added = addV3VariantInventory(next, line.blueprintId, line.outputQuantity, outputCost)
    next = added.state
    const quality = next.productBlueprints[line.blueprintId]?.quality ?? 0
    next = addV3JobContribution(next, line.employeeId, line.family, quality, added.quantity)
  }

  const programs = { ...next.plantPrograms }
  for (const program of Object.values(programs)) {
    if (program.setupRemainingTicks > 0) {
      programs[program.cellIndex] = { ...program, setupRemainingTicks: Math.max(0, program.setupRemainingTicks - deltaTicks) }
    }
  }
  const remainingEnergy = Math.max(0, chargedEnergy - power.energyUsed)
  const producedState = addV3DutyXp({
    ...next,
    world: {
      ...next.world,
      tickCount: next.world.tickCount + deltaTicks,
      crudeOil: Math.max(0, world.crudeOil - distillCrude - power.generatorFuel),
      feedstock,
      electricity: remainingEnergy,
      waste,
    },
    materialCostBasis: {
      ...next.materialCostBasis,
      crudeCents: Math.max(0, basis.crudeCents - (distillCrude + power.generatorFuel) * crudeUnitBasis),
      feedstockCents: feedstockBasis,
      electricityCents: remainingEnergy > EPSILON ? Math.max(0, chargedBasis - power.energyUsed * energyUnitBasis) : 0,
    },
    plantPrograms: programs,
  }, Object.fromEntries(lines.map((line) => [line.cellIndex, line.actualWork])))
  return { lines, power, state: advanceV3Recovery(runV3AutoDispatch(producedState), deltaTicks) }
}
