import { salePrice } from '../../src/v4/sim/systems/customers'
import { gradeFor } from '../../src/v4/sim/systems/blending'
import { createNewGame } from '../../src/v4/sim/state'
import { tick } from '../../src/v4/sim/tick'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { place, canPlace, upgrade } from '../../src/v4/sim/systems/yard'
import { recruit, hire, assign, train, levelUp } from '../../src/v4/sim/systems/staff'
import { invest, baseAvailable } from '../../src/v4/sim/systems/investments'
import { selectBlend, predictedScore } from '../../src/v4/sim/systems/blending'
import { acceptContract, deliverContract } from '../../src/v4/sim/systems/contracts'
import { bases } from '../../src/v4/data/bases'
import { hiring, trainings } from '../../src/v4/data/staff'
import { investments } from '../../src/v4/data/investments'
import { B, MONTH, YEAR } from '../../src/v4/data/balance'
import type { GameState } from '../../src/v4/sim/types'
import { random } from '../../src/v4/sim/rng'

// Each seed plays with its own style so balance is not tuned to one fixed bot.
export interface Bot {
  rng: number
  pace: number // >1 builds and hires later, <1 earlier
  reserveScale: number // how much cash the bot keeps aside
  staffBias: number // extra or fewer staff than the default plan
  explore: number // chance per week to try a non-optimal recipe
  supportOrder: string[]
  investOrder: string[]
}
export function makeBot(seed: number): Bot {
  let rng = (seed * 2654435761) >>> 0
  const draw = () => {
    const [value, next] = random(rng)
    rng = next
    return value
  }
  const shuffle = <T>(items: T[]) =>
    items
      .map(item => ({ item, key: draw() }))
      .sort((a, b) => a.key - b.key)
      .map(v => v.item)
  return {
    pace: 0.8 + draw() * 0.45,
    reserveScale: 0.6 + draw() * 1.2,
    staffBias: Math.floor(draw() * 3) - 1,
    explore: draw() * 0.3,
    supportOrder: shuffle(['canteen', 'lab']),
    investOrder: shuffle(investments.map(d => d.id)),
    rng,
  }
}
function roll(bot: Bot): number {
  const [value, next] = random(bot.rng)
  bot.rng = next
  return value
}
export function buildFirstFree(s: GameState, id: string): GameState {
  for (let y = 3; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, id, x, y)) return place(s, id, x, y)
  return s
}
export function autoplay(s: GameState, bot: Bot = makeBot(1)): GameState {
  // Decisions use the same guarded actions as the UI. No grants, rank forcing or direct resource edits.
  for (const c of s.contracts.active) s = deliverContract(s, c.uid)
  if (s.tick % B.ticksPerWeek !== 0) return s
  const year = (Math.floor(s.tick / YEAR) + 1) / bot.pace
  const reserve = (15000 + s.staff.reduce((n, p) => n + p.salary, 0)) * bot.reserveScale
  const buildOnce = (id: string, budget: number) => {
    if (!s.yard.buildings.some(b => b.defId === id) && s.money > budget + reserve)
      s = buildFirstFree(s, id)
  }
  for (const id of bot.supportOrder) buildOnce(id, id === 'lab' ? 15000 : 8000)
  if (year >= 3) {
    buildOnce('hydro', 25000)
    buildOnce('pipe', 1000)
    buildOnce('reformer', 120000)
  }
  if (year >= 6) {
    buildOnce('control', 80000)
    buildOnce('cracker', 300000)
  }
  const lines = year >= 7 ? 3 : year >= 4.6 ? 2 : 1
  if (s.money > 500000 + reserve)
    for (const id of ['crudeTank', 'cdu', 'hydro', 'tank', 'blend'])
      if (s.yard.buildings.filter(b => b.defId === id).length < lines) s = buildFirstFree(s, id)
  const desiredStaff = Math.max(
    1,
    (year < 5 ? 1 : year < 7 ? 3 : Math.min(8, s.rank + 2)) + (year < 5 ? 0 : bot.staffBias),
  )
  if (year >= 4 && s.staff.length < desiredStaff && s.money > 100000 + reserve) {
    const method = [...hiring].reverse().find(h => h.rank <= s.rank && h.cost < s.money / 5)!
    s = recruit(s, method.id)
    const p = [...s.candidates].sort(
      (a, b) =>
        Object.values(b.stats).reduce((n, x) => n + x, 0) -
        Object.values(a.stats).reduce((n, x) => n + x, 0),
    )[0]
    if (p) s = hire(s, p.uid)
  }
  const station = s.yard.buildings.find(b => b.defId === 'blend')
  for (const p of s.staff) if (station && !p.assignedTo) s = assign(s, p.uid, station.uid)
  if (s.tick % MONTH === 0) {
    for (const p of s.staff) {
      if (s.money > reserve + 20000) {
        const options = trainings.filter(
          t =>
            t.rank <= s.rank &&
            t.power <= p.power &&
            t.cost < s.money / 12 &&
            (p.trainingCounts[t.id] ?? 0) < 12,
        )
        const training = options[Math.floor(s.tick / MONTH) % Math.max(1, options.length)]
        if (training) s = train(s, p.uid, training.id)
      }
      s = levelUp(s, p.uid)
    }
    for (const d of bot.investOrder.map(id => investments.find(v => v.id === id)!)) {
      const step = d.steps[s.investments[d.id] ?? 0]
      if (step && s.rank >= d.rank && s.money > step.cost * 3 + reserve) s = invest(s, d.id)
    }
  }
  // Upgrade the selected production chain when comfortably affordable.
  if (year >= 5 && s.tick % MONTH === 0)
    for (const b of s.yard.buildings.filter(b => ['cdu', 'blend', 'hydro'].includes(b.defId)))
      if (s.money > 500000 + reserve) s = upgrade(s, b.uid)
  const options = bases.filter(
    b =>
      baseAvailable(s, b.id) &&
      s.yard.buildings.some(v => v.defId === b.unit) &&
      (!['lube'].includes(b.id) || s.investments.port > 0) &&
      (!['jet'].includes(b.id) || s.investments.airport > 0) &&
      (!['wax', 'pellet'].includes(b.id) || s.investments.industrial > 0),
  )
  let best:
    { base: typeof s.blend.base; additive: typeof s.blend.additive; value: number } | undefined
  for (const b of options)
    for (const additive of [null, ...s.unlockedAdditives]) {
      const score = predictedScore(s, b.id, additive)
      const value = salePrice(s, { base: b.id, grade: gradeFor(score) })
      if (!best || value > best.value) best = { base: b.id, additive, value }
    }
  if (best && roll(bot) < bot.explore) {
    // Curious player: try something else this week.
    const pick = options[Math.floor(roll(bot) * options.length)]
    const additives = [null, ...s.unlockedAdditives]
    best = {
      base: pick.id,
      additive: additives[Math.floor(roll(bot) * additives.length)],
      value: 0,
    }
  }
  if (best) s = selectBlend(s, best.base, best.additive)
  for (const c of s.contracts.offers)
    if (c.base === s.blend.base && s.contracts.active.length < 3) s = acceptContract(s, c.uid)
  return s
}
export function simulate(seed: number, years = 16) {
  const bot = makeBot(seed)
  let s = buildStarter(createNewGame(seed)),
    negative = 0,
    maxNegative = 0
  const reached: Record<number, number> = { 1: 1 }
  const annual: { year: number; rank: number; fame: number; money: number; profit: number }[] = []
  for (let i = 0; i < years * YEAR; i++) {
    s = autoplay(tick(s), bot)
    for (let rank = 2; rank <= s.rank; rank++) if (!(rank in reached)) reached[rank] = s.tick / YEAR
    negative = s.money < 0 ? negative + 1 : 0
    maxNegative = Math.max(maxNegative, negative)
    if (s.tick % YEAR === 0)
      annual.push({
        year: s.tick / YEAR,
        rank: s.rank,
        fame: s.fame,
        money: Math.round(s.money),
        profit: Math.round(s.history.profits.slice(-12).reduce((n, p) => n + p.profit, 0) / 12),
      })
  }
  return {
    state: s,
    reached,
    maxNegativeMonths: maxNegative / MONTH,
    unlocksFirst40Weeks: s.unlockHistory.filter(u => u.tick <= 40 * B.ticksPerWeek).length,
    annual,
  }
}
if (process.argv[1]?.endsWith('sim-run.ts')) {
  const n = Number(process.argv[2] ?? 1)
  for (let seed = 1; seed <= n; seed++) {
    const { state, ...report } = simulate(seed)
    console.log(JSON.stringify({ seed, ...report }))
  }
}
