/**
 * Full-loop playthrough sim — estimates time-to-Industry-Legend and surfaces
 * where progression bottlenecks, by running the REAL per-tick economy
 * (gameTick.tick + applyAutoTrade + closeBusinessYear) under a documented
 * "auto-pilot" build policy.
 *
 * Run:  npx tsx scripts/full-loop-sim.ts
 *
 * FAITHFUL (real game code): production (gasoline + downstream + power + waste),
 * storage caps, market saturation, auto-buy crude / auto-sell everything,
 * refinery-upgrade gates, year-end awards (S-grade), all derived stats.
 *
 * MODELLED / ASSUMED (documented, biases noted):
 *  - Build/hire/research decisions: a greedy auto-pilot (see policy below). One
 *    reasonable playstyle, not optimal — a skilled player is faster.
 *  - Grid is filled linearly, so adjacency synergies aren't optimised →
 *    production is a touch CONSERVATIVE (time slightly over-estimated).
 *  - Contracts/standing orders aren't simulated individually; instead a steady
 *    "contract income" drip (cash + RP + reputation) approximates an active
 *    player working the contract board. These gate research/leveling/reputation
 *    but are NOT the time-dominant goals ($1M cash + 100k gasoline come from
 *    production, which is faithful), so the headline estimate is robust.
 */
import { tick, applyAutoTrade, type AutoTradeSettings } from '../src/game/utils/gameTick'
import {
  createInitialGameState,
  createNewEmployee,
  calculateDerivedStats,
  closeBusinessYear,
  getUpgradeBlockers,
  getUpgradeCost,
  getMaxHireCount,
} from '../src/game/utils/gameCalculations'
import { BUILDINGS } from '../src/game/data/buildings'
import { RESEARCH_ITEMS } from '../src/game/data/research'
import { CONTRACTS } from '../src/game/data/contracts'
import { AWARDS_BALANCE, CORE_BALANCE, EXPANSION_BALANCE, MAX_REFINERY_LEVEL, STANDING_ORDER_BALANCE } from '../src/game/data/balance'
import { areAllEndgameGoalsComplete, ENDGAME_GOALS } from '../src/game/data/endgameGoals'
import type { BuildingType, GameState, WorkerType } from '../src/game/types'

const YEAR_TICKS = AWARDS_BALANCE.yearLengthTicks
const TICK_S = CORE_BALANCE.tickMs / 1000
const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
const fmtTime = (ticks: number) => {
  const sec = ticks * TICK_S
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return `${h}h ${m}m  (${ticks.toLocaleString()} ticks)`
}

// Faithful income: complete real one-time contracts + fulfill real repeatable
// standing orders (the actual RP/reputation/cash engine), instead of a fake drip.
type ProductKey = keyof GameState['productInventory']
const CONTRACT_PRODUCT_FIELDS: [keyof (typeof CONTRACTS)[number], ProductKey][] = [
  ['petrochemicalsRequired', 'petrochemicals'],
  ['lubricantsRequired', 'lubricants'],
  ['jetFuelRequired', 'jetFuel'],
  ['asphaltRequired', 'asphalt'],
  ['recycledMaterialRequired', 'recycledMaterial'],
  ['plasticPelletsRequired', 'plasticPellets'],
]

// Work every available order/contract the player currently can. Mirrors the real
// completeContract / fulfillStandingOrder handlers (consumes inventory, applies
// the contract reward/RP multipliers, marks one-time contracts done, sets
// standing-order cooldowns).
function workOrders(g: GameState): GameState {
  let next = g
  const d = calculateDerivedStats(next)

  // Repeatable standing orders (the endgame engine).
  for (const order of STANDING_ORDER_BALANCE) {
    if (next.refineryLevel < order.unlockLevel) continue
    const cd = next.standingOrderCooldowns[order.key]
    if (cd !== undefined && cd > next.tickCount) continue
    if (next.productInventory[order.productKey] < order.required) continue
    next = {
      ...next,
      money: next.money + order.reward,
      researchPoints: next.researchPoints + order.rpReward,
      reputation: next.reputation + order.reputationReward,
      productInventory: { ...next.productInventory, [order.productKey]: next.productInventory[order.productKey] - order.required },
      standingOrderCooldowns: { ...next.standingOrderCooldowns, [order.key]: next.tickCount + order.cooldownTicks },
      yearStats: { ...next.yearStats, moneyEarned: next.yearStats.moneyEarned + order.reward },
    }
  }

  // One-time contracts.
  for (const c of CONTRACTS) {
    if (next.completedContractIds.includes(c.id) || next.refineryLevel < c.unlockLevel) continue
    const costs = CONTRACT_PRODUCT_FIELDS
      .map(([field, key]) => ({ key, need: (c[field] as number | undefined) ?? 0 }))
      .filter((x) => x.need > 0)
    const isProduct = costs.length > 0
    if (isProduct) {
      if (costs.some((x) => next.productInventory[x.key] < x.need)) continue
    } else if (next.gasoline < c.gasolineRequired) continue
    const inv = { ...next.productInventory }
    for (const x of costs) inv[x.key] -= x.need
    const reward = Math.round(c.reward * d.contractRewardMultiplier)
    const rp = Math.round(c.rpReward * d.contractRpRewardMultiplier)
    next = {
      ...next,
      gasoline: isProduct ? next.gasoline : next.gasoline - c.gasolineRequired,
      productInventory: inv,
      money: next.money + reward,
      researchPoints: next.researchPoints + rp,
      reputation: next.reputation + c.reputationReward,
      completedContractCount: next.completedContractCount + 1,
      completedContractIds: [...next.completedContractIds, c.id],
      yearStats: { ...next.yearStats, moneyEarned: next.yearStats.moneyEarned + reward, contractsCompleted: next.yearStats.contractsCompleted + 1 },
    }
  }
  return next
}

const autoTrade: AutoTradeSettings = {
  enabled: true,
  buyThreshold: 35,
  sellThreshold: 80,
  productSellThresholds: {},
}

// Desired building counts by refinery level — capped by available cells.
function targetLoadout(level: number): Partial<Record<BuildingType, number>> {
  const t: Partial<Record<BuildingType, number>> = {
    distillationUnit: Math.min(6, 1 + Math.floor(level / 2)),
    crudeTank: 3,
    productTank: 2,
  }
  // Power must cover downstream electricity demand AND leave headroom for the
  // electricity-gated gasoline line — under-provisioning silently starves
  // gasoline (each power plant = 12/cycle; downstream eats 3/4/5/6 each).
  if (level >= (BUILDINGS.powerPlant.unlockLevel ?? 99)) t.powerPlant = level >= 15 ? 5 : level >= 10 ? 3 : 2
  if (level >= (BUILDINGS.laboratory.unlockLevel ?? 99)) t.laboratory = 1
  if (level >= (BUILDINGS.salesOffice.unlockLevel ?? 99)) t.salesOffice = 1
  if (level >= (BUILDINGS.maintenanceWorkshop.unlockLevel ?? 99)) t.maintenanceWorkshop = 1
  if (level >= (BUILDINGS.lubricantPlant.unlockLevel ?? 99)) t.lubricantPlant = 2
  if (level >= (BUILDINGS.jetFuelPlant.unlockLevel ?? 99)) t.jetFuelPlant = 2
  if (level >= (BUILDINGS.petrochemicalPlant.unlockLevel ?? 99)) t.petrochemicalPlant = 2
  if (level >= (BUILDINGS.wasteTreatmentPlant.unlockLevel ?? 99)) t.wasteTreatmentPlant = 1
  if (level >= (BUILDINGS.polymerPlant.unlockLevel ?? 99)) t.polymerPlant = 1
  if (level >= (BUILDINGS.lubricantTank.unlockLevel ?? 99)) t.lubricantTank = 1
  if (level >= (BUILDINGS.jetFuelTank.unlockLevel ?? 99)) t.jetFuelTank = 1
  if (level >= (BUILDINGS.petrochemicalTank.unlockLevel ?? 99)) t.petrochemicalTank = 1
  return t
}

const WORKER_PRIORITY: WorkerType[] = [
  'operator', 'salesAgent', 'fuelSpecialist', 'mechanic', 'aviationSpecialist',
  'chemicalEngineer', 'polymerEngineer', 'chemist', 'safetyOfficer', 'logisticsCoordinator',
]

function countOnGrid(g: GameState, type: BuildingType): number {
  return g.grid.reduce((n, c) => n + (c === type ? 1 : 0), 0)
}
function firstEmpty(g: GameState): number {
  return g.grid.findIndex((c) => c === null)
}

// One auto-pilot decision pass: spend money on the highest-value next thing.
function decide(g: GameState): GameState {
  let next = g

  // 1. Upgrade refinery level whenever unblocked.
  if (next.refineryLevel < MAX_REFINERY_LEVEL && getUpgradeBlockers(next).length === 0) {
    next = { ...next, money: next.money - getUpgradeCost(next.refineryLevel), refineryLevel: next.refineryLevel + 1 }
  }

  // 2. Build toward the target loadout (cheapest missing first).
  const target = targetLoadout(next.refineryLevel)
  const missing = (Object.entries(target) as [BuildingType, number][])
    .filter(([type, want]) => countOnGrid(next, type) < want)
    .sort((a, b) => BUILDINGS[a[0]].cost - BUILDINGS[b[0]].cost)
  for (const [type] of missing) {
    const cell = firstEmpty(next)
    if (cell < 0) break
    if (next.money < BUILDINGS[type].cost) continue
    const grid = next.grid.slice()
    grid[cell] = type
    next = { ...next, grid, money: next.money - BUILDINGS[type].cost }
  }

  // 3. Hire workers to cap (priority order).
  const cap = getMaxHireCount(next.refineryLevel)
  for (const type of WORKER_PRIORITY) {
    while ((next.workerCounts[type] ?? 0) < cap && next.money > 4000) {
      const employees = [...next.employees, createNewEmployee(next.employees, type)]
      next = {
        ...next,
        employees,
        workerCounts: { ...next.workerCounts, [type]: (next.workerCounts[type] ?? 0) + 1 },
        money: next.money - 1500, // representative hire cost
      }
    }
  }

  // 4. Unlock cheapest affordable research (respect prerequisites).
  for (const r of [...RESEARCH_ITEMS].sort((a, b) => a.cost - b.cost)) {
    if (next.unlockedResearchIds.includes(r.key)) continue
    if (r.prerequisite && !next.unlockedResearchIds.includes(r.prerequisite)) continue
    if (next.researchPoints < r.cost) continue
    next = {
      ...next,
      researchPoints: next.researchPoints - r.cost,
      unlockedResearchIds: [...next.unlockedResearchIds, r.key],
      unlockedResearchCount: next.unlockedResearchCount + 1,
    }
  }

  // 5. Expand grid when full + gated level reached + affordable.
  const nextExp = EXPANSION_BALANCE[next.gridExpansionLevel + 1] as
    | { cells: number; cost?: number; requiresRefineryLevel?: number }
    | undefined
  if (nextExp && firstEmpty(next) < 0 && next.refineryLevel >= (nextExp.requiresRefineryLevel ?? 0) && next.money >= (nextExp.cost ?? 0)) {
    const grid = next.grid.slice()
    while (grid.length < nextExp.cells) grid.push(null)
    const gridLevels = next.gridLevels.slice()
    while (gridLevels.length < nextExp.cells) gridLevels.push(1)
    next = { ...next, grid, gridLevels, gridExpansionLevel: next.gridExpansionLevel + 1, money: next.money - (nextExp.cost ?? 0) }
  }

  return next
}

const DECISION_EVERY = 25
const MAX_TICKS = 1_500_000 // ~83h cap

export type PlaythroughResult = {
  game: GameState
  goalTick: Record<string, number>
  yearScores: { year: number; score: number; grade: string }[]
}

// Reusable so scripts/sim-check.ts can assert on it (regression gate).
export function runPlaythrough(): PlaythroughResult {
  let g = createInitialGameState()
  const goalTick: Record<string, number> = {}
  const yearScores: { year: number; score: number; grade: string }[] = []

  for (let step = 0; step < MAX_TICKS; step++) {
    g = tick(g)
    // Work real orders BEFORE auto-trade so contracts/standing orders get first
    // claim on inventory (a player who works the boards), then sell the rest.
    if (g.tickCount % 5 === 0) g = workOrders(g)
    g = applyAutoTrade(g, autoTrade)

    if (g.tickCount % DECISION_EVERY === 0) g = decide(g)

    // year-end close (awards / S-grade / reputation)
    if (g.tickCount > 0 && g.tickCount % YEAR_TICKS === 0) {
      const closed = closeBusinessYear(g)
      yearScores.push({ year: g.businessYear, score: closed.record.score, grade: closed.record.grade })
      g = closed.game
    }

    // record goal completion ticks
    for (const goal of ENDGAME_GOALS) {
      if (goalTick[goal.key] === undefined && goal.isComplete(g)) goalTick[goal.key] = g.tickCount
    }
    if (areAllEndgameGoalsComplete(g)) { goalTick['LEGEND'] = g.tickCount; break }
  }
  return { game: g, goalTick, yearScores }
}

function printReport({ game: g, goalTick, yearScores }: PlaythroughResult) {
  console.log('=== Full-loop playthrough (auto-pilot) ===\n')
  const d = calculateDerivedStats(g)
  console.log(`reached: level ${g.refineryLevel}/${MAX_REFINERY_LEVEL}  cash ${fmtMoney(g.money)}  ` +
    `research ${g.unlockedResearchIds.length}/${RESEARCH_ITEMS.length}  grid L${g.gridExpansionLevel}/3  ` +
    `lifetime gas ${Math.round(g.totalGasolineProduced).toLocaleString()}  rep ${Math.round(g.reputation)}  ` +
    `bestAward ${g.awardHistory.map((a) => a.grade).join('') || '-'}`)
  console.log(`final gas/sec ${Math.round(d.productionRate * d.prestigeOutputMultiplier * d.speedOverflowYieldMultiplier * 10) / 10}  business year ${g.businessYear}\n`)

  console.log('time to each endgame goal:')
  for (const goal of ENDGAME_GOALS) {
    const tk = goalTick[goal.key]
    const p = goal.progress(g)
    console.log(`  ${goal.key.padEnd(18)}: ${tk !== undefined ? fmtTime(tk) : `NOT MET (${Math.round(p.current).toLocaleString()}/${p.target.toLocaleString()})`}`)
  }
  console.log(`\n  ${'INDUSTRY LEGEND'.padEnd(18)}: ${goalTick['LEGEND'] !== undefined ? fmtTime(goalTick['LEGEND']) : 'NOT REACHED within cap'}`)

  console.log('\nannual award score by year:')
  for (const y of [1, 2, 3, 5, 8, 12, 20]) {
    const rec = yearScores.find((r) => r.year === y)
    if (rec) console.log(`  year ${String(y).padStart(2)}: score ${rec.score.toLocaleString().padStart(8)}  grade ${rec.grade}`)
  }
}

if (require.main === module) printReport(runPlaythrough())
