import { WEAR as W, B, PRODUCTION, SALES, SPEC, YARD } from '../../data/balance'
import { buildingDef } from '../../data/buildings'
import { bases } from '../../data/bases'
import { isMonthStart } from '../time'
import { getModifiers } from './combos'
import { activeRecipes, blendStations } from './blending'
import { arrivalInterval } from './customers'
import { featureOn } from '../../data/features'
import type { Building, GameState } from '../types'

// ── Wear ────────────────────────────────────────────────────────────────────

/** Buildings that wear out: process units and blend stations. */
export const wears = (b: Building) => ['process', 'blend'].includes(buildingDef(b.defId).category)
export const conditionOf = (b: Building) => (wears(b) ? (b.condition ?? 100) : 100)
export const repairing = (s: GameState, b: Building) => (b.repairUntil ?? 0) > s.tick
/** Output multiplier from wear and overhauls. */
export const plantFactor = (s: GameState, b: Building) => {
  if (!wears(b)) return 1
  if (repairing(s, b)) return 0
  const c = conditionOf(b)
  const spec = b.spec === 'volume' ? 1 + SPEC.volumeOutput : 1
  return (c < W.broken ? W.brokenOutput : c < W.worn ? W.wornOutput : 1) * spec
}
/** Lot stat bonuses from plants specialised in quality or eco. */
export const specStats = (s: GameState) =>
  s.yard.buildings.reduce(
    (n, b) => ({
      purity: n.purity + (b.spec === 'quality' ? SPEC.qualityPurity : 0),
      stability: n.stability + (b.spec === 'quality' ? SPEC.qualityStability : 0),
      eco: n.eco + (b.spec === 'eco' ? SPEC.ecoEco : 0),
    }),
    { purity: 0, stability: 0, eco: 0 },
  )
export function specialize(
  s: GameState,
  uid: string,
  spec: NonNullable<Building['spec']>,
): GameState {
  const b = s.yard.buildings.find(b => b.uid === uid)
  if (!featureOn(s, 'spec') || !b || !wears(b) || b.spec || b.level < SPEC.minLevel) return s
  return {
    ...s,
    yard: {
      ...s.yard,
      buildings: s.yard.buildings.map(x => (x.uid === uid ? { ...x, spec } : x)),
    },
  }
}
export const brokenPlants = (s: GameState) =>
  s.yard.buildings.filter(b => wears(b) && conditionOf(b) < W.broken).length
export const overhaulCost = (b: Building) =>
  Math.round(b.cost * W.overhaulShare * (1 + B.upkeepPerLevel * (b.level - 1)))
/** Engineers' monthly repair on a building. */
export const repairRate = (s: GameState, b: Building) =>
  s.staff
    .filter(p => p.assignedTo === b.uid && p.job === 'engineer' && !p.resting)
    .reduce((n, p) => n + p.stats.mech / W.mechDivisor, 0)

export function overhaul(s: GameState, uid: string): GameState {
  const b = s.yard.buildings.find(b => b.uid === uid)
  if (!b || !wears(b) || repairing(s, b) || conditionOf(b) >= 100) return s
  const cost = overhaulCost(b)
  if (s.money < cost) return s
  return {
    ...s,
    money: s.money - cost,
    year: { ...s.year, expenses: s.year.expenses + cost },
    monthProfit: s.monthProfit - cost,
    yard: {
      ...s.yard,
      buildings: s.yard.buildings.map(x =>
        x.uid === uid
          ? { ...x, condition: 100, repairUntil: s.tick + W.overhaulWeeks * B.ticksPerWeek }
          : x,
      ),
    },
  }
}

export function wearSystem(s: GameState): GameState {
  if (!featureOn(s, 'wear') || !s.opened || !isMonthStart(s.tick) || s.tick < 2) return s
  return {
    ...s,
    yard: {
      ...s.yard,
      buildings: s.yard.buildings.map(b =>
        wears(b)
          ? {
              ...b,
              condition: Math.max(
                0,
                Math.min(
                  100,
                  conditionOf(b) -
                    W.perMonth +
                    (b.spec === 'eco' ? SPEC.ecoWearLess : 0) +
                    repairRate(s, b),
                ),
              ),
            }
          : b,
      ),
    },
  }
}

// ── Flow overview ───────────────────────────────────────────────────────────

const levelFactor = (b: Building) => 1 + YARD.outputPerLevel * (b.level - 1)
const perWeek = (unitsPerCycle: number) => (unitsPerCycle * B.ticksPerWeek) / PRODUCTION.cycle
/** Units per week each stage can handle right now; the smallest is the bottleneck. */
export function flowSummary(s: GameState) {
  const of = (id: string) => s.yard.buildings.filter(b => b.defId === id)
  const crude = perWeek(
    PRODUCTION.crudeDelivery *
      of('cdu').reduce((n, b) => n + levelFactor(b) * plantFactor(s, b), 0),
  )
  const prod = 1 + getModifiers(s).production
  const refine = perWeek(
    [...new Set(activeRecipes(s).map(r => r.base))].reduce((n, id) => {
      const unit = bases.find(b => b.id === id)!.unit
      return (
        n +
        PRODUCTION.lotUnits *
          prod *
          of(unit).reduce((m, b) => m + levelFactor(b) * plantFactor(s, b), 0)
      )
    }, 0),
  )
  const blend = perWeek(
    blendStations(s).reduce(
      (n, b) => n + PRODUCTION.lotUnits * levelFactor(b) * plantFactor(s, b),
      0,
    ),
  )
  const sell = (B.ticksPerWeek / arrivalInterval(s)) * SALES.units
  const stages = [
    { id: 'crude', units: crude },
    { id: 'refine', units: refine },
    { id: 'blend', units: blend },
    { id: 'sell', units: sell },
  ] as const
  const bottleneck = [...stages].sort((a, b) => a.units - b.units)[0].id
  return { stages, bottleneck }
}
