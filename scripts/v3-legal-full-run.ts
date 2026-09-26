/**
 * V3 legal full-run simulation (R3 evidence, read-only).
 *
 * A deterministic heuristic player that starts from createInitialV3GameState()
 * and uses ONLY reduceV3Action + runV3ProductionTick — no fixtures, no direct
 * state edits. It reports chapter/milestone timings and, if it cannot clear,
 * exactly where it stalled. It is evidence for the R3 gate and a baseline for
 * V3-18 calibration, not a balance change.
 */
import { reduceV3Action } from '../src/game/v3/actions'
import { V3_BUILDINGS, V3_LAND_PARCELS, V3_PLANT_BY_FAMILY, V3_ROLES, V3_SPOT_PRICE_CENTS } from '../src/game/v3/data'
import { evaluateV3ClearConditions } from '../src/game/v3/campaign'
import { V3_JOB_TEMPLATES } from '../src/game/v3/jobs'
import { getV3OfferView } from '../src/game/v3/offers'
import { getV3RecoveryOffer } from '../src/game/v3/recovery'
import { validateV3ExpoEntry } from '../src/game/v3/expo'
import { V3_RIVALS, getV3PlayerRank, getV3IndustryScore, getV3RivalScore } from '../src/game/v3/rivals'
import { getV3CrudeCapacity, getV3ProductCapacity, getV3ProductQuantity, getV3SellableQuantity, getV3StockAllocations } from '../src/game/v3/productInventory'
import { evaluateV3Production, runV3ProductionTick } from '../src/game/v3/production'
import { getV3AvailableKnowledgeRank, validateV3Research } from '../src/game/v3/research'
import { createInitialV3GameState } from '../src/game/v3/state'
import type { V3Action, V3GameState, V3ModuleKey, V3ProcessProfile, V3ProductFamily } from '../src/game/v3/types'
import { getV3StaffCap } from '../src/game/v3/workforce'
import { countV3Buildings, findV3PlacementSpot, getV3BuildingLimit, listV3Buildings } from '../src/game/v3/yard'
import type { BuildingType, ResearchKey } from '../src/game/types'

type Input = V3Action extends infer A ? (A extends unknown ? Omit<A, 'sequence'> : never) : never
const DECISION_TICKS = 50
const MAX_TICKS = Number(process.env.V3_RUN_MAX_TICKS ?? 360_000) // 20 h of simulated time
const log: string[] = []
let state = createInitialV3GameState()
let actions = 0
let rejected = 0

const blockedCounts: Record<string, number> = {}
function tryAct(action: Input): boolean {
  const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
  if (result.events[0]?.tone !== 'success') {
    const key = `${action.type}:${result.events[0]?.messageId}`
    blockedCounts[key] = (blockedCounts[key] ?? 0) + 1
  }
  if (result.events[0]?.tone === 'success') {
    state = result.state
    actions += 1
    return true
  }
  rejected += 1
  state = result.state // sequence is consumed either way, exactly like the UI
  return false
}
const minutes = () => (state.world.tickCount / 300).toFixed(1)
const note = (text: string) => log.push(`[${minutes()}m C${state.campaignProgress.chapter} $${(state.world.moneyCents / 100).toFixed(0)}] ${text}`)
const cash = () => state.world.moneyCents
const reserve = () => 60_000 + state.world.employees.length * 15_000 + (state.campaignProgress.chapter >= 2 ? 50_000 : 0)

function build(type: BuildingType): string | null {
  if (V3_BUILDINGS[type].buildChapter > state.campaignProgress.chapter) return null
  const limit = getV3BuildingLimit(state, type)
  if (limit !== null && countV3Buildings(state, type) >= limit) return null
  let spot = findV3PlacementSpot(state, type)
  if (!spot) {
    const parcel = V3_LAND_PARCELS.find((entry) => !state.world.unlockedParcelIds.includes(entry.id) &&
      entry.chapter <= state.campaignProgress.chapter && (!entry.requires || state.world.unlockedParcelIds.includes(entry.requires)) &&
      cash() >= entry.costDollars * 100 + V3_BUILDINGS[type].buildCostDollars * 100 + reserve())
    if (!parcel || !tryAct({ type: 'unlock_land_parcel', parcelId: parcel.id })) return null
    note(`unlocked land ${parcel.id}`)
    spot = findV3PlacementSpot(state, type)
    if (!spot) return null
  }
  if (cash() < V3_BUILDINGS[type].buildCostDollars * 100 + reserve()) return null
  const before = new Set(Object.keys(state.world.buildingsById))
  if (!tryAct({ type: 'build', building: type, ...spot })) return null
  const id = Object.keys(state.world.buildingsById).find((key) => !before.has(key))!
  note(`built ${type}`)
  return id
}

function upgrade(type: BuildingType, toLevel: number): boolean {
  const target = listV3Buildings(state).find((building) => building.type === type && building.level < toLevel)
  if (!target) return false
  const cost = V3_BUILDINGS[type].upgradeCostDollars?.[target.level - 1]
  if (cost === undefined || cash() < cost * 100 + reserve()) return false
  if (tryAct({ type: 'upgrade', buildingId: target.id })) { note(`upgraded ${type} → Lv${target.level + 1}`); return true }
  // Growth blocked: move it to a spot that fits the next footprint, then retry next decision.
  const spot = findV3PlacementSpot(state, type, target.level + 1, target.id)
  if (spot && tryAct({ type: 'move_building', buildingId: target.id, x: spot.x, y: spot.y })) note(`moved ${type} to make room`)
  return false
}

/** Cheapest config reaching Q (Systems S2): profile/module/rank/lead. */
function recipeFor(quality: number): { profile: V3ProcessProfile; module: V3ModuleKey; rank: 0 | 1 | 2; lead: boolean } | null {
  const options: Array<{ profile: V3ProcessProfile; module: V3ModuleKey; rank: 0 | 1 | 2; lead: boolean; q: number }> = [
    { profile: 'volume', module: 'none', rank: 0, lead: false, q: 35 },
    { profile: 'precision', module: 'none', rank: 0, lead: false, q: 55 },
    { profile: 'precision', module: 'none', rank: 0, lead: true, q: 60 },
    { profile: 'precision', module: 'precision', rank: 0, lead: false, q: 65 },
    { profile: 'precision', module: 'precision', rank: 1, lead: false, q: 70 },
    { profile: 'precision', module: 'precision', rank: 1, lead: true, q: 75 },
    { profile: 'precision', module: 'precision', rank: 2, lead: false, q: 75 },
  ]
  return options.find((option) => option.q >= quality && (option.module === 'none' || state.campaignProgress.chapter >= 2) &&
    option.rank <= getV3AvailableKnowledgeRank(state, lab() ?? '') &&
    (!option.lead || state.world.employees.some((employee) => employee.type === 'operator' && employee.level >= 3))) ?? null
}
const lab = () => listV3Buildings(state).find((building) => building.type === 'laboratory')?.id ?? null
const bestQuality = (family: V3ProductFamily) => Math.max(0, ...Object.values(state.productBlueprints).filter((blueprint) => blueprint.family === family).map((blueprint) => blueprint.quality))

/** Next milestone to chase: lowest chapter, then lowest Q, routes the bot can open. */
function nextMilestone() {
  const done = new Set(state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').map((receipt) => receipt.templateId))
  return Object.values(V3_JOB_TEMPLATES)
    .filter((template) => ((template.kind === 'milestone' || template.kind === 'showcase' || template.kind === 'tutorial') && !done.has(template.id)) ||
      (template.id === 'local:starter-repeat' && state.campaignProgress.chapter === 1))
    .filter((template) => template.minimumChapter <= state.campaignProgress.chapter && (!template.requires || done.has(template.requires)))
    .filter((template) => template.kind !== 'showcase' || !state.campaignProgress.showcaseReceiptId)
    .sort((a, b) => a.minimumChapter - b.minimumChapter || a.minimumQuality - b.minimumQuality || a.id.localeCompare(b.id))
}

/** Operating burn (wages + maintenance) per simulated second over the last minute. */
function burnPerSecond(): number {
  const now = Math.floor(state.world.tickCount / 5)
  const recent = state.operatingLedger.buckets.filter((bucket) => bucket.second > now - 60)
  const spent = recent.reduce((sum, bucket) => sum + bucket.wagesCents + bucket.maintenanceCents, 0)
  return spent / Math.max(1, Math.min(60, now))
}
const runwaySeconds = () => { const burn = burnPerSecond(); return burn > 0 ? cash() / burn : Infinity }

/** Cash discipline a careful player would use: recovery, and dropping jobs that outlast the money. */
function manageSafety() {
  if (getV3RecoveryOffer(state).tollingAvailable && tryAct({ type: 'start_recovery' })) note('started recovery tolling')
  const job = state.acceptedJob
  if (job && runwaySeconds() < 60) {
    const view = getV3OfferView(state, job.templateId, job.family)
    const remaining = job.quantity - job.deliveredQuantity
    if ((view.etaSeconds ?? Infinity) > 120 && remaining > 0 && tryAct({ type: 'cancel_job' })) note(`cancelled ${job.templateId} (cash runway)`)
  }
}

function manageJobs() {
  const job = state.acceptedJob
  // Cash crisis: a human would cancel a job that locks up sellable stock (paid shipments stay paid).
  if (job && cash() < 5_000 && state.world.crudeOil < 1 && getV3SellableQuantity(state, job.family) < 1) {
    if (tryAct({ type: 'cancel_job' })) note(`cancelled ${job.templateId} to raise cash`)
    return
  }
  if (job) {
    const eligible = getV3StockAllocations(state, job.family).reduce((sum, allocation) => sum + allocation.jobReserved, 0)
    const quantity = Math.min(Math.floor(eligible + 1e-8), job.quantity - job.deliveredQuantity)
    if (quantity > 0 && tryAct({ type: 'dispatch_job', quantity }) && !state.acceptedJob) note(`completed ${job.templateId}`)
    return
  }
  for (const template of nextMilestone()) {
    const branches = template.branches ?? [null]
    for (const branch of branches) {
      const family = branch?.family ?? template.family
      const quality = branch?.minimumQuality ?? template.minimumQuality
      if (bestQuality(family) < quality) continue
      const plant = V3_PLAN_ROUTE[family]
      if (!plant || countV3Buildings(state, plant) === 0) continue
      const view = getV3OfferView(state, template.id, branch?.family ?? null)
      if (view.acceptBlocker || view.etaSeconds === null) continue
      // Do not start an order the cash cannot outlast.
      if (view.etaSeconds > Math.max(180, runwaySeconds() * 0.7)) continue
      if (tryAct(branch ? { type: 'accept_job', templateId: template.id, branch: branch.family } : { type: 'accept_job', templateId: template.id })) {
        note(`accepted ${template.id}${branch ? ` (${branch.family})` : ''}`)
        return
      }
    }
  }
}
const V3_PLAN_ROUTE = V3_PLAN_BY_FAMILY()
function V3_PLAN_BY_FAMILY() { return V3_PLANT_BY_FAMILY as Partial<Record<V3ProductFamily, BuildingType>> }

/** Quality the bot currently needs per family (next milestone it could chase). */
function neededQuality(): Partial<Record<V3ProductFamily, number>> {
  const need: Partial<Record<V3ProductFamily, number>> = {}
  for (const template of nextMilestone()) {
    for (const branch of template.branches ?? [null]) {
      const family = branch?.family ?? template.family
      const quality = branch?.minimumQuality ?? template.minimumQuality
      need[family] = Math.min(need[family] ?? Infinity, quality)
    }
  }
  if (state.acceptedJob) need[state.acceptedJob.family] = state.acceptedJob.minimumQuality
  return need
}

function manageDevelopment() {
  const labId = lab()
  if (!labId || state.developmentProject) return
  // Expo flagship: once rank2 + an Operator Lv3 lead exist, certify a Q80 recipe.
  const lead80 = state.world.employees.find((employee) => employee.type === 'operator' && employee.level >= 3 && state.employeeDuties[employee.id]?.kind !== 'development')
  if (bestQuality('gasoline') < 80 && getV3AvailableKnowledgeRank(state, labId) >= 2 && lead80 &&
    tryAct({ type: 'start_development', family: 'gasoline', profile: 'precision', module: 'precision', knowledgeRank: 2, leadEmployeeId: lead80.id, labBuildingId: labId })) {
    note('develop gasoline Q80 flagship')
    return
  }
  for (const [family, quality] of Object.entries(neededQuality()) as Array<[V3ProductFamily, number]>) {
    // C2 needs 40 units of one DEVELOPED Gasoline recipe, so at C1 only developed ones count.
    const developedOnly = state.campaignProgress.chapter === 1
    const have = Math.max(0, ...Object.values(state.productBlueprints)
      .filter((blueprint) => blueprint.family === family && (!developedOnly || blueprint.provenance === 'developed'))
      .map((blueprint) => blueprint.quality))
    if (have >= quality) continue
    const recipe = recipeFor(quality)
    if (!recipe) continue
    const lead = recipe.lead ? state.world.employees.find((employee) => employee.type === 'operator' && employee.level >= 3 && state.employeeDuties[employee.id]?.kind !== 'development') : null
    if (recipe.lead && !lead) continue
    if (tryAct({ type: 'start_development', family, profile: recipe.profile, module: recipe.module, knowledgeRank: recipe.rank, leadEmployeeId: lead?.id ?? null, labBuildingId: labId })) {
      note(`develop ${family} ${recipe.profile}/${recipe.module}/r${recipe.rank}${recipe.lead ? '+lead' : ''}`)
      return
    }
  }
}

/** Point every line at the cheapest blueprint that satisfies its family's current need. */
function managePrograms() {
  const need = neededQuality()
  for (const building of listV3Buildings(state)) {
    const program = state.plantPrograms[building.id]
    if (!program || building.type === 'wasteTreatmentPlant') continue
    const family = Object.entries(V3_PLAN_ROUTE).find(([, plant]) => plant === building.type)?.[0] as V3ProductFamily | undefined
    if (!family) continue
    const target = need[family] ?? 0
    const candidates = Object.values(state.productBlueprints)
      .filter((blueprint) => blueprint.family === family && blueprint.quality >= target && blueprint.minPlantLevel <= building.level)
      .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
    const best = candidates[0]
    if (!best) continue
    if (best.module !== program.installedModule) {
      if (tryAct({ type: 'set_module', buildingId: building.id, module: best.module })) note(`fit ${best.module} module on ${building.type}`)
      else continue
    }
    if (program.blueprintId !== best.id) tryAct({ type: 'set_program', buildingId: building.id, blueprintId: best.id })
    if (state.plantPrograms[building.id]?.paused) tryAct({ type: 'set_pause', buildingId: building.id, paused: false })
  }
}

function manageStaff() {
  const lines = listV3Buildings(state).filter((building) => state.plantPrograms[building.id] && building.type !== 'wasteTreatmentPlant')
  const staffed = new Set(Object.values(state.employeeDuties).flatMap((duty) => (duty.kind === 'line' ? [duty.buildingId] : [])))
  for (const line of lines) {
    if (staffed.has(line.id)) continue
    let worker = state.world.employees.find((employee) => state.employeeDuties[employee.id]?.kind === 'reserve' && V3_ROLES[employee.type].lineBuildings.includes(line.type as never))
    if (!worker && state.world.employees.length < getV3StaffCap(state) && cash() > 60_000 + reserve()) {
      if (tryAct({ type: 'hire_employee', role: 'operator' })) worker = state.world.employees.at(-1)
    }
    if (worker && tryAct({ type: 'assign_duty', employeeId: worker.id, duty: { kind: 'line', buildingId: line.id } })) staffed.add(line.id)
  }
  for (const employee of state.world.employees) if (state.unpaidEmployeeIds.includes(employee.id)) tryAct({ type: 'resume_employee', employeeId: employee.id })
}

/** Enter the annual Expo with the best developed recipe that has samples. */
function manageExpo() {
  const recipes = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.provenance === 'developed')
    .sort((a, b) => b.quality - a.quality)
  for (const recipe of recipes) {
    if (!validateV3ExpoEntry(state, recipe.id)) {
      if (tryAct({ type: 'enter_expo', blueprintId: recipe.id })) note(`expo entry ${recipe.name} → #${state.expoResults.at(-1)?.rank}`)
      return
    }
  }
}

function manageResearch() {
  const order: ResearchKey[] = ['premiumFuel', 'advancedProcessing', 'betterPumps', 'biggerTanks', 'advancedDistillation', 'industrialStorage', 'premiumContracts', 'contractAnalytics', 'storageOptimization']
  for (const id of order) if (!validateV3Research(state, id) && tryAct({ type: 'buy_research', researchId: id })) note(`research ${id}`)
}

function manageTrade() {
  const room = Math.floor(getV3CrudeCapacity(state) - state.world.crudeOil + 1e-8)
  const affordable = Math.floor((cash() - 5_000) / 1_000)
  const buy = Math.min(room, affordable)
  if (buy > 0) tryAct({ type: 'trade', direction: 'buy', product: 'crude', quantity: buy })
  // Sell free stock above a development-sample float; never touch job reservations.
  for (const family of ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets'] as V3ProductFamily[]) {
    const free = Math.floor(getV3SellableQuantity(state, family) + 1e-8)
    // Free stock excludes job reservations, so selling it never harms an order.
    // Keep a small float for Lab samples unless the tank is filling or cash is short.
    const full = getV3ProductQuantity(state, family) > getV3ProductCapacity(state, family) * 0.6
    const float = full || runwaySeconds() < 120 ? 0 : 12
    const sell = free - float
    if (sell > 0 && V3_SPOT_PRICE_CENTS[family]) tryAct({ type: 'trade', direction: 'sell', product: family, quantity: sell })
  }
  for (const commodity of ['recycledMaterial', 'asphalt'] as const) {
    const quantity = Math.floor(state.commodityInventory[commodity]?.quantity ?? 0)
    if (quantity > 0) tryAct({ type: 'trade', direction: 'sell', product: commodity, quantity })
  }
}

function manageInvestment() {
  const chapter = state.campaignProgress.chapter
  if (chapter >= 1 && !lab()) build('laboratory')
  if (chapter >= 2) {
    if (countV3Buildings(state, 'powerPlant') === 0) build('powerPlant')
    else if (countV3Buildings(state, 'lubricantPlant') === 0) build('lubricantPlant')
    upgrade('distillationUnit', 2)
    upgrade('laboratory', 2)
    upgrade('lubricantPlant', 2)
    if (countV3Buildings(state, 'distillationUnit') < (getV3BuildingLimit(state, 'distillationUnit') ?? 1)) build('distillationUnit')
  }
  if (chapter >= 3) {
    if (countV3Buildings(state, 'jetFuelPlant') === 0) build('jetFuelPlant')
    upgrade('jetFuelPlant', 2)
    upgrade('powerPlant', 2)
    if (countV3Buildings(state, 'jetFuelTank') === 0) build('jetFuelTank')
  }
  if (chapter >= 4) {
    upgrade('laboratory', 3)
    if (countV3Buildings(state, 'petrochemicalPlant') === 0) build('petrochemicalPlant')
  }
  // Power: add supply when requested demand exceeds potential supply.
  const plan = evaluateV3Production(state, 25).power
  if (plan.requestedDemandPerMinute > plan.potentialSupplyPerMinute * 0.9) {
    if (!upgrade('powerPlant', 3)) build('powerPlant')
  }
}

const trajectory: string[] = []
/**
 * Reinvestment a growing refinery would make with surplus cash: more product
 * lines per family (up to 3), Lv3 upgrades, tanks for full families, support
 * buildings, and land when the yard is full. Spends only above a safety buffer.
 */
function manageExpansion() {
  const buffer = 200_000 + reserve()
  if (cash() < buffer) return
  const chapter = state.campaignProgress.chapter
  const plants: BuildingType[] = ['lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant', 'polymerPlant']
  const tanks: Partial<Record<BuildingType, BuildingType>> = { lubricantPlant: 'lubricantTank', jetFuelPlant: 'jetFuelTank', petrochemicalPlant: 'petrochemicalTank', polymerPlant: 'pelletSilo' }
  for (const type of ['distillationUnit', 'crudeTank', 'gasolineTank', ...plants] as BuildingType[]) {
    if (cash() < buffer) return
    for (let level = 2; level <= 3; level++) while (upgrade(type, level) && cash() > buffer) { /* upgrade all of this type */ }
  }
  if (chapter >= 2 && countV3Buildings(state, 'maintenanceWorkshop') === 0) build('maintenanceWorkshop')
  if (chapter >= 3 && countV3Buildings(state, 'salesOffice') === 0) build('salesOffice')
  for (const plant of plants) {
    if (cash() < buffer || V3_BUILDINGS[plant].buildChapter > chapter) continue
    if (countV3Buildings(state, plant) < 3) build(plant)
    const tank = tanks[plant]!
    if (countV3Buildings(state, tank) < countV3Buildings(state, plant)) build(tank)
  }
  if (countV3Buildings(state, 'crudeTank') < 1 + countV3Buildings(state, 'distillationUnit')) build('crudeTank')
  if (countV3Buildings(state, 'gasolineTank') < countV3Buildings(state, 'distillationUnit')) build('gasolineTank')
}

const reached: Record<number, string> = {}
const outcome = { cleared: false, stalledReason: '' }
let lastProgressTick = 0
let lastSignature = ''
while (state.world.tickCount < MAX_TICKS) {
  if (state.maintenanceEmergency) tryAct({ type: 'restore_operations' })
  manageSafety()
  manageJobs()
  manageDevelopment()
  managePrograms()
  manageStaff()
  manageResearch()
  manageExpo()
  manageInvestment()
  manageExpansion()
  manageTrade()
  for (let index = 0; index < DECISION_TICKS; index += 25) state = runV3ProductionTick(state, 25).state
  if (state.world.tickCount % 3_000 < DECISION_TICKS) {
    const rivalsNow = V3_RIVALS.map((rival) => getV3RivalScore(rival, state.world.tickCount))
    trajectory.push(`${minutes()}m score ${getV3IndustryScore(state).total} rivals ${rivalsNow.join('/')} rep ${state.world.reputation} bestQ ${Math.max(0, ...Object.values(state.productBlueprints).map((blueprint) => blueprint.quality))}`)
  }
  const chapter = state.campaignProgress.chapter
  if (!reached[chapter]) { reached[chapter] = minutes(); note(`reached chapter ${chapter}`) }
  const signature = `${chapter}|${state.jobReceipts.receipts.length}|${Object.keys(state.productBlueprints).length}|${Object.keys(state.world.buildingsById).length}|rank${getV3PlayerRank(state)}|expo${state.expoResults.filter((entry) => entry.rank === 1).length}|${Math.floor(getV3IndustryScore(state).total / 500)}`
  if (signature !== lastSignature) { lastSignature = signature; lastProgressTick = state.world.tickCount }
  if (chapter >= 5) { outcome.cleared = true; if (process.env.V3_RUN_TRAJECTORY !== '1') break }
  if (process.env.V3_RUN_TRAJECTORY !== '1' && state.world.tickCount - lastProgressTick > 36_000) { outcome.stalledReason = 'no progress for 2 simulated hours'; break }
}
if (!outcome.cleared && !outcome.stalledReason) outcome.stalledReason = `tick cap ${MAX_TICKS}`

const clear = evaluateV3ClearConditions(state)
const nowSecond = Math.floor(state.world.tickCount / 5)
const window = state.operatingLedger.buckets.filter((bucket) => bucket.second > nowSecond - 180)
const perMinute = (key: 'receiptsCents' | 'cogsCents' | 'wagesCents' | 'maintenanceCents' | 'cashOutflowsCents') => Math.round(window.reduce((sum, bucket) => sum + bucket[key], 0) / 3 / 100)
const economy = { receipts: perMinute('receiptsCents'), cogs: perMinute('cogsCents'), wages: perMinute('wagesCents'), maintenance: perMinute('maintenanceCents'), outflows: perMinute('cashOutflowsCents') }
const lines = evaluateV3Production(state, 25).lines.map((line) => `${line.building}:${line.status}:${line.limitedBy}:${line.actualOutputPerMinute.toFixed(0)}/${line.potentialOutputPerMinute.toFixed(0)}`)
console.log(log.join('\n'))
console.log('--- trajectory (every 10 min)')
console.log(trajectory.join('\n'))
console.log('\n=== V3 legal full run (fresh state, reducer + tick only) ===')
console.log(JSON.stringify({
  cleared: outcome.cleared,
  stalledReason: outcome.stalledReason || null,
  simulatedMinutes: Number(minutes()),
  chapterReachedAtMinute: reached,
  actions, rejectedActions: rejected, blockedCounts,
  moneyDollars: Math.round(cash() / 100),
  economyPerMinuteDollars: economy, lines, crude: Math.round(state.world.crudeOil),
  partners: clear.partners, families: clear.families, showcase: clear.showcase,
  industryLeader: clear.industryLeader, expoWin: clear.expoWin, rank: getV3PlayerRank(state), industryScore: getV3IndustryScore(state),
  expoResults: state.expoResults.map((entry) => `Y${entry.year}:#${entry.rank}(Q${entry.quality})`),
  rolling180ProfitDollars: Math.round(clear.rollingProfitCents / 100),
  milestones: state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').map((receipt) => receipt.templateId),
  blueprints: Object.values(state.productBlueprints).filter((blueprint) => blueprint.provenance === 'developed').map((blueprint) => `${blueprint.family}:Q${blueprint.quality}`),
  buildings: listV3Buildings(state).map((building) => `${building.type}:L${building.level}`),
  unlockedParcels: state.world.unlockedParcelIds,
  staff: state.world.employees.map((employee) => `${employee.type}:L${employee.level}`),
}, null, 2))
process.exitCode = outcome.cleared ? 0 : 1
