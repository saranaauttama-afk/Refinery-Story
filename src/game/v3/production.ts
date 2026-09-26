import {
  V3_DISTILLATION,
  V3_FEEDSTOCK_REFERENCE_CENTS,
  V3_GENERATOR_BY_LEVEL,
  V3_LEVEL_RATE,
  V3_MODULE_MULTIPLIERS,
  V3_PROCESS_UNITS,
  V3_PROFILE_MULTIPLIERS,
  V3_SITE_POWER,
  V3_SPECIALIZATION,
  V3_COMMODITY_ID,
  V3_SPOT_PRICE_CENTS,
  V3_TICKS_PER_CYCLE,
  isV3ProcessBuilding,
  type V3ProcessBuilding,
  type V3ProcessInput,
} from './data'
import { advanceV3Development } from './development'
import { getV3Modifiers } from './modifiers'
import { settleV3Maintenance } from './maintenance'
import { V3_DEFAULT_BLUEPRINT_ID } from './state'
import { addV3JobContribution, advanceV3JobClock, runV3AutoDispatch } from './jobs'
import { advanceV3Awards } from './awards'
import { evaluateV3CampaignProgress } from './campaign'
import { addV3CommodityInventory, addV3VariantInventory, consumeV3ProtectedInventory, getV3ConsumableQuantity, getV3ProductCapacity, getV3ProductQuantity } from './productInventory'
import { advanceV3Recovery, isV3LoanerCell } from './recovery'
import type { ProductKey } from '../types'
import type { V3GameState, V3PlantProgram, V3ProductFamily } from './types'
import { addV3DutyXp, getV3LineEmployee, getV3LocalCrewRate, settleV3Wages } from './workforce'

const EPSILON = 1e-9

export type V3LineStatus = 'ready' | 'paused' | 'setup' | 'invalid'

export type V3LinePlan = {
  cellIndex: number
  building: V3ProcessBuilding
  family: ProductKey
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
  globalRate: number,
): V3LinePlan | null {
  const building = state.world.grid[program.cellIndex]
  if (!isV3ProcessBuilding(building)) return null
  const unit = V3_PROCESS_UNITS[building]
  // Emergency line runs default Standard at Lv1 with no crew/module/bonus; the
  // saved program is retained and resumes on player-confirmed restoration.
  const baseline = state.maintenanceEmergency?.cellIndex === program.cellIndex
  const blueprint = baseline
    ? state.productBlueprints[V3_DEFAULT_BLUEPRINT_ID.gasoline] ?? null
    : state.productBlueprints[program.blueprintId] ?? null
  const level = baseline ? 1 : state.world.gridLevels[program.cellIndex] ?? 1
  const commodityLine = unit.family === 'recycledMaterial'
  let status: V3LineStatus = 'ready'
  if (state.maintenanceEmergency && !baseline) status = 'paused'
  else if (baseline) status = 'ready'
  else if (program.paused) status = 'paused'
  else if (program.setupRemainingTicks > 0) status = 'setup'
  else if (commodityLine
    ? program.blueprintId !== V3_COMMODITY_ID.recycledMaterial || program.installedModule !== 'none'
    : blueprint?.family !== unit.family ||
      blueprint.module !== program.installedModule ||
      level < blueprint.minPlantLevel
  ) status = 'invalid'
  const profile = blueprint ? V3_PROFILE_MULTIPLIERS[blueprint.profile] : V3_PROFILE_MULTIPLIERS.standard
  const module = V3_MODULE_MULTIPLIERS[baseline ? 'none' : program.installedModule]
  const employee = getV3LineEmployee(state, program.cellIndex)
  const loanerRate = isV3LoanerCell(state, program.cellIndex) ? 0.5 : 1
  const noBonus = loanerRate !== 1 || baseline
  const crewRate = status === 'ready' && !noBonus ? getV3LocalCrewRate(state, program.cellIndex) : 0
  // Loaners and the emergency line run the Lv1 baseline without crew, global or specialization effects.
  const specialization = state.world.specialization && !baseline ? V3_SPECIALIZATION[state.world.specialization] : null
  const specializationRate = !noBonus ? specialization?.rate ?? 1 : 1
  const cappedGlobal = !noBonus ? globalRate : 0
  const requestedWork = status === 'ready'
    ? deltaTicks / V3_TICKS_PER_CYCLE * (V3_LEVEL_RATE[level] ?? 0) * profile.work * module.work *
      (1 + crewRate) * (1 + cappedGlobal) * specializationRate * boostRate * loanerRate
    : 0
  const perMinute = 300 / Math.max(deltaTicks, 1)
  const energyPerWork = unit.energyPerWork * profile.energy * module.energy * (specialization?.energy ?? 1)
  return {
    cellIndex: program.cellIndex,
    building,
    family: unit.family,
    blueprintId: baseline ? V3_DEFAULT_BLUEPRINT_ID.gasoline : program.blueprintId,
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
    .map((program) => lineRequest(state, program, deltaTicks, boostRate, getV3Modifiers(state).globalRate.effective))
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

  // Every advanced line first bounds its own input group from opening stock
  // (feedstock / free Petro / waste), then ALL energy consumers share the battery
  // in one allocator, so no product type starves another by fixed order.
  const inputAvailable: Record<Exclude<V3ProcessInput, 'crude'>, number> = {
    feedstock: state.world.feedstock,
    petro: getV3ConsumableQuantity(state, 'petrochemicals', { purpose: 'processing' }),
    waste: state.world.waste,
  }
  const inputBound = lines.map(() => 0)
  for (const input of ['feedstock', 'petro', 'waste'] as const) {
    const indices = lines.map((line, index) => (line.input === input ? index : -1)).filter((index) => index >= 0)
    const work = allocateV3Work(indices.map((index) => outputBound[index]), inputAvailable[input], indices.map((index) => lines[index].inputPerWork))
    indices.forEach((lineIndex, position) => { inputBound[lineIndex] = work[position] })
  }
  const energyIndices = lines.map((line, index) => (line.input !== 'crude' ? index : -1)).filter((index) => index >= 0)
  const energyWork = allocateV3Work(
    energyIndices.map((index) => inputBound[index]),
    generation.chargeAfterGeneration,
    energyIndices.map((index) => lines[index].energyPerWork),
  )
  energyIndices.forEach((lineIndex, position) => { actual[lineIndex] = energyWork[position] })

  const perMinute = 300 / Math.max(deltaTicks, 1)
  const planned = lines.map((line, index) => {
    const work = actual[index]
    const unit = V3_PROCESS_UNITS[line.building]
    let limitedBy: V3LinePlan['limitedBy'] = 'none'
    if (line.requestedWork > EPSILON && work + 1e-7 < line.requestedWork) {
      if (outputBound[index] + 1e-7 < line.requestedWork) limitedBy = 'output_space'
      else if (line.input === 'crude') limitedBy = 'input'
      else limitedBy = inputBound[index] + 1e-7 < outputBound[index] ? 'input' : 'power'
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
  const developed = advanceV3Development(settleV3Maintenance(settlement.state, deltaTicks), deltaTicks)
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

  // Waste consumed by Waste Treatment from opening stock (zero-value byproduct basis).
  const wasteUnitBasis = world.waste > EPSILON ? basis.wasteCents / world.waste : 0
  const wasteConsumed = lines.reduce((sum, line) => sum + (line.input === 'waste' ? line.actualWork * line.inputPerWork : 0), 0)

  let next: V3GameState = developed
  // Polymer: free Petro only (keep floors and job reservations excluded), lowest Q first.
  const petroConsumed = lines.reduce((sum, line) => sum + (line.input === 'petro' ? line.actualWork * line.inputPerWork : 0), 0)
  let petroUnitBasis = 0
  if (petroConsumed > EPSILON) {
    const consumed = consumeV3ProtectedInventory(next, 'petrochemicals', petroConsumed, { purpose: 'processing' })
    next = consumed.state
    petroUnitBasis = consumed.costBasisCents / petroConsumed
  }
  let feedstock = Math.max(0, world.feedstock - feedConsumed)
  let feedstockBasis = Math.max(0, basis.feedstockCents - feedConsumed * feedUnitBasis)
  let waste = Math.max(0, world.waste - wasteConsumed)
  const wasteBasis = Math.max(0, basis.wasteCents - wasteConsumed * wasteUnitBasis)
  const feedstockCapacity = getV3FeedstockCapacity(developed)
  for (const line of lines) {
    if (line.actualWork <= EPSILON) continue
    const wasteRate = developed.world.specialization ? V3_SPECIALIZATION[developed.world.specialization].waste : 1
    const producedWaste = line.actualWork * V3_PROCESS_UNITS[line.building].wastePerWork * wasteRate
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
      const inputUnitBasis = line.input === 'feedstock' ? feedUnitBasis : line.input === 'petro' ? petroUnitBasis : wasteUnitBasis
      outputCost = line.actualWork * line.inputPerWork * inputUnitBasis + line.energyUsed * energyUnitBasis
    }
    if (line.family === 'recycledMaterial') {
      next = addV3CommodityInventory(next, 'recycledMaterial', line.outputQuantity, outputCost).state
      continue
    }
    const added = addV3VariantInventory(next, line.blueprintId, line.outputQuantity, outputCost)
    next = added.state
    const quality = next.productBlueprints[line.blueprintId]?.quality ?? 0
    next = addV3JobContribution(next, line.employeeId, line.family as V3ProductFamily, quality, added.quantity)
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
      wasteCents: wasteBasis,
      electricityCents: remainingEnergy > EPSILON ? Math.max(0, chargedBasis - power.energyUsed * energyUnitBasis) : 0,
    },
    plantPrograms: programs,
  }, Object.fromEntries(lines.map((line) => [line.cellIndex, line.actualWork])))
  return { lines, power, state: evaluateV3CampaignProgress(advanceV3Awards(advanceV3Recovery(advanceV3JobClock(runV3AutoDispatch(producedState)), deltaTicks))) }
}
