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
  getProductMarketLevel,
  countBuildings,
  getYearlyPayroll,
} from '../src/game/utils/gameCalculations'
import { MARKET_BALANCE, WAGE_BALANCE, AWARDS_BALANCE, CORE_BALANCE, ECONOMY_BALANCE } from '../src/game/data/balance'
import type { BuildingType, GameState, GridCell, WorkerType } from '../src/game/types'

const hr = (label: string) => console.log(`\n=== ${label} ===`)
const r2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

// Effective gasoline/sec = batches/sec × yield-per-batch. productionRate alone
// (batches/sec) understates output once the speed floor recovers as yield.
const effGasPerSec = (d: ReturnType<typeof calculateDerivedStats>) =>
  d.productionRate *
  (1 + d.perkProductionBonusRate) *
  d.prestigeOutputMultiplier *
  d.speedOverflowYieldMultiplier

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

const annualPayroll = (
  level: number,
  grid: GridCell[],
  workers: Partial<Record<WorkerType, number>>,
) => getYearlyPayroll(mkState({ level, grid, workers }))

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
  console.log('lvl | prod/s | gas/s | sell$  | gross/s | crudeStore | upgrade$  | prodReq | repReq')
  for (const s of stages) {
    const g = mkState(s)
    const d = calculateDerivedStats(g)
    const gasPerSec = effGasPerSec(d)
    const grossPerSec = gasPerSec * d.sellPrice
    console.log(
      `${String(s.level).padStart(3)} | ` +
        `${r2(d.productionRate).toFixed(2).padStart(6)} | ` +
        `${r2(gasPerSec).toFixed(2).padStart(5)} | ` +
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
hr('6. Prestige (New Game+) is now a flat OUTPUT bonus (yield, not speed)')
{
  const grid = buildGrid({ distillationUnit: 4, lubricantPlant: 2, powerPlant: 1 })
  const workers = { operator: 6, salesAgent: 2 }
  for (let p = 0; p <= 3; p++) {
    const d = calculateDerivedStats(mkState({ level: 6, grid, workers, prestige: p }))
    const gasPerSec = effGasPerSec(d)
    console.log(
      `prestige ${p}        : outputMult ${r2(d.prestigeOutputMultiplier)}  ` +
        `prod/s ${r2(d.productionRate)} (capped)  gas/s ${r2(gasPerSec)}  gross/s ${money(gasPerSec * d.sellPrice)}`,
    )
  }
}

// ===========================================================================
// 7. Speed-floor recovery — operators now matter past the cap (via yield)
// ===========================================================================
hr('7. Speed-floor recovery: operators past the cap (was a dead stat)')
{
  const grid = buildGrid({ distillationUnit: 4 })
  for (const lvl of [3, 4, 6]) {
    const a = calculateDerivedStats(mkState({ level: lvl, grid, workers: { operator: 0 } }))
    const b = calculateDerivedStats(mkState({ level: lvl, grid, workers: { operator: 12 } }))
    const floored = b.productionRate <= a.productionRate + 1e-6
    console.log(
      `lvl ${lvl}: prod/s ${r2(a.productionRate)}→${r2(b.productionRate)} ${floored ? '(speed capped)' : ''}  ` +
        `gas/s 0op ${r2(effGasPerSec(a))} → 12op ${r2(effGasPerSec(b))}  ` +
        `overflowYield@12op ${r2(b.speedOverflowYieldMultiplier)}`,
    )
  }
}

// ===========================================================================
// 8. Gasoline unit economics + staff ROI (is hiring still worth it?)
// ===========================================================================
hr('8. Gasoline unit economics & staff ROI (sustained, level 8)')
{
  const YEAR_S = (AWARDS_BALANCE.yearLengthTicks * CORE_BALANCE.tickMs) / 1000
  const grid8 = buildGrid({ distillationUnit: 6, lubricantPlant: 3, jetFuelPlant: 2, powerPlant: 2 })
  const base = { operator: 3, salesAgent: 2, fuelSpecialist: 1 }

  // Sustained annual gasoline economy. Throughput is the floored batch rate
  // (productionRate); we assume crude is kept stocked and product sold, so this
  // is a fair steady-state baseline (an upper bound when crude/storage bind).
  const annual = (d: ReturnType<typeof calculateDerivedStats>) => {
    const batchesPerSec = d.productionRate
    const gasPerSec = effGasPerSec(d)
    return {
      gasPerSec,
      grossRev: gasPerSec * d.sellPrice * YEAR_S,
      crudeCost: batchesPerSec * d.crudePrice * YEAR_S,
      net: (gasPerSec * d.sellPrice - batchesPerSec * d.crudePrice) * YEAR_S,
    }
  }

  const d8 = calculateDerivedStats(mkState({ level: 8, grid: grid8, workers: base }))
  const a = annual(d8)
  const yieldPerBatch = effGasPerSec(d8) / d8.productionRate
  console.log(`business year     : ${AWARDS_BALANCE.yearLengthTicks} ticks (${YEAR_S}s real)`)
  console.log(`gasoline/sec      : ${r2(a.gasPerSec)}   sell ${money(d8.sellPrice)}   crude ${money(d8.crudePrice)}`)
  console.log(`margin per crude  : ${money(d8.sellPrice * yieldPerBatch - d8.crudePrice)}  (sell×${r2(yieldPerBatch)} yield − crude)`)
  console.log(`annual gross      : ${money(a.grossRev)}   crude cost ${money(a.crudeCost)}   net ${money(a.net)}`)
  console.log(`annual payroll    : ${money(annualPayroll(8, grid8, base))} (whole crew) — ${r2((annualPayroll(8, grid8, base) / a.grossRev) * 100)}% of gross`)

  console.log('\nmarginal hire ROI (one more, gasoline-line effect only):')
  for (const type of ['operator', 'salesAgent', 'fuelSpecialist'] as const) {
    const d1 = calculateDerivedStats(
      mkState({ level: 8, grid: grid8, workers: { ...base, [type]: (base[type] ?? 0) + 1 } }),
    )
    const dNet = annual(d1).net - a.net
    const wage = WAGE_BALANCE.perWorker[type]
    console.log(
      `+1 ${type.padEnd(14)}: +${money(dNet)}/yr  vs wage ${money(wage)}/yr  → ROI ${r2(dNet / wage)}x` +
        (type === 'salesAgent' ? '  (also lifts downstream — understated)' : ''),
    )
  }

  // Stack curve: value of the Nth operator on top of (N-1). Diminishing returns
  // should make the 4th much weaker than the 1st — that's the stack-vs-spread
  // decision the cap used to lack.
  console.log('\noperator stack curve (Nth operator, gross/yr it adds):')
  let prevNet = annual(calculateDerivedStats(mkState({ level: 8, grid: grid8, workers: { operator: 0 } }))).net
  for (let n = 1; n <= 4; n++) {
    const net = annual(calculateDerivedStats(mkState({ level: 8, grid: grid8, workers: { operator: n } }))).net
    console.log(`  operator #${n}: +${money(net - prevNet)}/yr` + (n === 1 ? ' (full)' : ` (${r2((net - prevNet) / 1)}…)`))
    prevNet = net
  }
}

// ===========================================================================
// 9. Early-game affordability — wages shouldn't crush a fresh save
// ===========================================================================
hr('9. Early-game payroll vs income (sanity: not brutal)')
{
  const YEAR_S = (AWARDS_BALANCE.yearLengthTicks * CORE_BALANCE.tickMs) / 1000
  const earlies = [
    { level: 1, grid: buildGrid({ distillationUnit: 1 }), workers: { operator: 2 } },
    { level: 3, grid: buildGrid({ distillationUnit: 2, powerPlant: 1 }), workers: { operator: 3 } },
  ]
  for (const s of earlies) {
    const d = calculateDerivedStats(mkState(s))
    const grossYr = effGasPerSec(d) * d.sellPrice * YEAR_S
    const pay = getYearlyPayroll(mkState(s))
    console.log(`lvl ${s.level}: annual gross ${money(grossYr)}  payroll ${money(pay)}  (${r2((pay / grossYr) * 100)}% of gross)`)
  }
}

// ===========================================================================
// 10. Auto-trade saturation guard — dump-to-threshold vs floor-aware
// ===========================================================================
hr('10. Auto-trade gasoline: dump vs floor-only vs smart (hold, but dump to avoid overflow)')
{
  const TICKS = AWARDS_BALANCE.yearLengthTicks
  const STORAGE = 200
  const SELL_THRESHOLD = 80
  const BUFFER = 5
  const OVERFLOW_GUARD = MARKET_BALANCE.autoSellOverflowGuardPct // below floor, still dump if tank this full
  const BASE_PRICE = ECONOMY_BALANCE.gasolinePrice
  const FLOOR = MARKET_BALANCE.autoSellMarketFloor

  const lvlOf = (market: GameState['productMarket']) =>
    getProductMarketLevel({ productMarket: market } as GameState, 'gasoline')

  type Mode = 'dump' | 'floor' | 'smart'
  const run = (mode: Mode, gasPerTick: number) => {
    let stock = 0
    let market: GameState['productMarket'] = { gasoline: 1 }
    let revenue = 0
    let sold = 0
    let lost = 0
    for (let t = 0; t < TICKS; t++) {
      const room = STORAGE - stock
      const add = Math.min(gasPerTick, room)
      lost += gasPerTick - add
      stock += add
      market = recoverProductMarket(market)
      const lvl = lvlOf(market)
      const pct = (stock / STORAGE) * 100
      const healthy = lvl >= FLOOR
      // target % to sell DOWN to (null = don't sell this tick)
      let targetPct: number | null = null
      if (pct > SELL_THRESHOLD) {
        if (mode === 'dump') targetPct = SELL_THRESHOLD - BUFFER
        else if (mode === 'floor') targetPct = healthy ? SELL_THRESHOLD - BUFFER : null
        else {
          // smart: sell to threshold when price is healthy; otherwise hold for
          // recovery, but still dump down to the overflow guard so production
          // isn't wasted to a full tank.
          if (healthy) targetPct = SELL_THRESHOLD - BUFFER
          else if (pct > OVERFLOW_GUARD) targetPct = OVERFLOW_GUARD - BUFFER
        }
      }
      if (targetPct !== null) {
        const excess = Math.max(0, stock - Math.floor((targetPct / 100) * STORAGE))
        if (excess > 0) {
          revenue += excess * Math.round(BASE_PRICE * lvl)
          sold += excess
          stock -= excess
          market = applyProductSaturation(market, 'gasoline', excess)
        }
      }
    }
    return { revenue, sold, lost, avgPrice: sold > 0 ? revenue / sold : 0, endLvl: lvlOf(market) }
  }

  const fmt = (r: ReturnType<typeof run>, name: string) =>
    `  ${name.padEnd(12)}: revenue ${money(r.revenue).padStart(8)}  avg price ${money(r.avgPrice)}  ` +
    `mkt end ${r2(r.endLvl)}  lostProd ${Math.round(r.lost)}`
  for (const [label, rate] of [['OVERPRODUCE 1.6/tick (~level 8)', 1.6], ['MIDDLE 0.6/tick', 0.6], ['MIDDLE 0.45/tick', 0.45], ['LIGHT 0.3/tick (early / lots of storage)', 0.3]] as const) {
    console.log(`\n ${label}:`)
    console.log(fmt(run('dump', rate), 'dump (old)'))
    console.log(fmt(run('floor', rate), 'floor-only'))
    console.log(fmt(run('smart', rate), 'smart'))
  }
}

console.log('\n(done)')
