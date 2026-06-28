/**
 * Balance sanity-check sim.
 *
 * Refinery Story has no test suite; this is a throwaway-but-reusable harness
 * that imports the REAL pure functions from gameCalculations and prints the
 * shape of the balance curves so we can eyeball them after tuning.
 *
 * Run:  npx tsx scripts/balance-sim.ts
 *
 * It deliberately only touches the RN-free pure layer (gameCalculations +
 * balance + data tables). It does NOT run the tick loop (that lives in the RN
 * hook); instead it constructs representative GameStates and reads the derived
 * stats, the deterministic market waves, and the saturation/incident curves.
 */
import {
  createInitialGameState,
  createNewEmployee,
  calculateDerivedStats,
  getCrudePrice,
  getCrudeMarketMultiplier,
  getIncidentChance,
  getEsgDrift,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  getUpgradeReputationRequirement,
  applyProductSaturation,
  recoverProductMarket,
  countBuildings,
} from '../src/game/utils/gameCalculations'
import { MARKET_BALANCE } from '../src/game/data/balance'
import type { BuildingType, GameState, GridCell, WorkerType } from '../src/game/types'

const hr = (label: string) => console.log(`\n=== ${label} ===`)
const r2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

// ---------------------------------------------------------------------------
// helpers to fabricate representative game states
// ---------------------------------------------------------------------------

function buildGrid(plan: Partial<Record<BuildingType, number>>, size = 36): GridCell[] {
  const grid: GridCell[] = Array(size).fill(null)
  let i = 0
  for (const [type, count] of Object.entries(plan)) {
    for (let n = 0; n < (count ?? 0) && i < size; n++) {
      grid[i++] = type as BuildingType
    }
  }
  return grid
}

function mkState(opts: {
  level?: number
  grid?: GridCell[]
  workers?: Partial<Record<WorkerType, number>>
  prestige?: number
  esg?: number
  tickCount?: number
}): GameState {
  const g = createInitialGameState()
  g.refineryLevel = opts.level ?? g.refineryLevel
  g.prestigeLevel = opts.prestige ?? 0
  g.esgScore = opts.esg ?? g.esgScore
  g.tickCount = opts.tickCount ?? 0
  if (opts.grid) g.grid = opts.grid
  if (opts.workers) {
    // Worker bonuses are read off game.employees (not workerCounts), so build a
    // real roster and keep the count↔employees invariant in sync.
    for (const [t, c] of Object.entries(opts.workers)) {
      const type = t as WorkerType
      for (let n = 0; n < (c ?? 0); n++) {
        g.employees.push(createNewEmployee(g.employees, type))
      }
      g.workerCounts[type] = c ?? 0
    }
  }
  return g
}

// ===========================================================================
// 1. Crude price wave (Dynamic Market)
// ===========================================================================
hr('1. Crude price wave over one full period')
{
  const period = MARKET_BALANCE.crudePeriodTicks
  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (let t = 0; t < period; t++) {
    const p = getCrudePrice(t)
    min = Math.min(min, p)
    max = Math.max(max, p)
    sum += p
  }
  console.log(`period            : ${period} ticks (~${r2((period * 0.2) / 60)} min real @200ms)`)
  console.log(`price range       : ${money(min)} .. ${money(max)}  (mean ${money(sum / period)})`)
  console.log(`mult range        : ${r2(getCrudeMarketMultiplier(period * 0.75))} .. ${r2(getCrudeMarketMultiplier(period * 0.25))}`)
  console.log(`sample @0/¼/½/¾   : ${[0, 0.25, 0.5, 0.75].map((f) => money(getCrudePrice(period * f))).join('  ')}`)
}

// ===========================================================================
// 2. Product saturation (dump penalty + recovery)
// ===========================================================================
hr('2. Product saturation — dump a batch then recover')
{
  let market: GameState['productMarket'] = {}
  const sellBatch = 50
  let sold = 0
  // sell until it hits the floor
  while ((market['gasoline'] ?? 1) > MARKET_BALANCE.saturationFloor + 1e-9 && sold < 100000) {
    market = applyProductSaturation(market, 'gasoline', sellBatch)
    sold += sellBatch
  }
  console.log(`floor             : ${MARKET_BALANCE.saturationFloor} (per-unit drop ${MARKET_BALANCE.saturationPerUnitSold})`)
  console.log(`units to hit floor: ${sold}  (level now ${r2(market['gasoline'] ?? 1)})`)
  // recovery
  let ticks = 0
  while ((market['gasoline'] ?? 1) < 1 && ticks < 100000) {
    market = recoverProductMarket(market)
    ticks++
  }
  console.log(`recovery to 1.0   : ${ticks} ticks (~${r2((ticks * 0.2) / 60)} min) @ +${MARKET_BALANCE.saturationRecoveryPerTick}/tick`)
}

// ===========================================================================
// 3. Incident chance vs ESG
// ===========================================================================
hr('3. Incident chance vs ESG score')
for (let esg = 0; esg <= 100; esg += 20) {
  const pct = getIncidentChance(esg) * 100
  console.log(`ESG ${String(esg).padStart(3)}        : ${r2(pct)}% per roll`)
}

// ===========================================================================
// 4. ESG drift by build composition
// ===========================================================================
hr('4. ESG drift per tick by build composition')
{
  const clean = buildGrid({ distillationUnit: 2, powerPlant: 1, wasteTreatmentPlant: 2 })
  const dirty = buildGrid({ distillationUnit: 4, lubricantPlant: 3, petrochemicalPlant: 3, polymerPlant: 2 })
  const g1 = mkState({ grid: clean })
  const g2 = mkState({ grid: dirty })
  console.log(`clean build       : ${r2(getEsgDrift(g1, countBuildings(clean)))}/tick`)
  console.log(`dirty build       : ${r2(getEsgDrift(g2, countBuildings(dirty)))}/tick`)
}

// ===========================================================================
// 5. Progression curve — production / price / revenue / upgrade gates
// ===========================================================================
hr('5. Progression: production rate, sell price, gross/sec, upgrade gates')
{
  // A representative loadout that grows with the refinery level.
  const stages = [
    { level: 1, grid: buildGrid({ distillationUnit: 1 }), workers: { operator: 1 } },
    { level: 3, grid: buildGrid({ distillationUnit: 2, lubricantPlant: 1, powerPlant: 1 }), workers: { operator: 3, salesAgent: 1 } },
    { level: 6, grid: buildGrid({ distillationUnit: 4, lubricantPlant: 2, jetFuelPlant: 1, powerPlant: 1 }), workers: { operator: 6, salesAgent: 2, mechanic: 1 } },
    { level: 10, grid: buildGrid({ distillationUnit: 6, lubricantPlant: 3, jetFuelPlant: 2, petrochemicalPlant: 2, powerPlant: 2 }), workers: { operator: 10, salesAgent: 4, mechanic: 2, fuelSpecialist: 2 } },
  ]
  console.log('lvl | prod/s | sell$  | gross/s | crudeStore | upgrade$  | prodReq | repReq')
  for (const s of stages) {
    const g = mkState(s)
    const d = calculateDerivedStats(g)
    const grossPerSec = d.productionRate * d.sellPrice
    console.log(
      `${String(s.level).padStart(3)} | ` +
        `${r2(d.productionRate).toFixed(2).padStart(6)} | ` +
        `${String(d.sellPrice).padStart(5)} | ` +
        `${money(grossPerSec).padStart(7)} | ` +
        `${String(d.maxCrudeStorage).padStart(10)} | ` +
        `${money(getUpgradeCost(s.level)).padStart(9)} | ` +
        `${String(getUpgradeProductionRequirement(s.level)).padStart(7)} | ` +
        `${String(getUpgradeReputationRequirement(s.level)).padStart(6)}`,
    )
  }
}

// ===========================================================================
// 6. Prestige & power-adjacency effect on worker production multiplier
// ===========================================================================
hr('6. Prestige (New Game+) production multiplier')
{
  const grid = buildGrid({ distillationUnit: 4, lubricantPlant: 2, powerPlant: 1 })
  const workers = { operator: 6, salesAgent: 2 }
  for (let p = 0; p <= 3; p++) {
    const d = calculateDerivedStats(mkState({ level: 6, grid, workers, prestige: p }))
    console.log(
      `prestige ${p}        : workerMult ${r2(d.workerProductionMultiplier)}  ` +
        `prod/s ${r2(d.productionRate)}  sell ${money(d.sellPrice)}`,
    )
  }
}

console.log('\n(done)')
