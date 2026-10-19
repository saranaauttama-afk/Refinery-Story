import { baseAvailable } from './investments'
import { getModifiers } from './combos'
import { truckRoute } from './customers'
import { SALES } from '../../data/balance'
import { PRODUCTION as P, YARD } from '../../data/balance'
import { bases, type CutId } from '../../data/bases'
import type { GameState } from '../types'
export function production(s: GameState): GameState {
  if (s.tick % P.cycle !== 0 || s.tick < s.stormUntil) return s
  const level = (id: string) =>
    Math.max(1, ...s.yard.buildings.filter(b => b.defId === id).map(b => b.level))
  const has = (id: string) => s.yard.buildings.some(b => b.defId === id)
  let { crude, money, nextId } = s
  let trucks = s.trucks
  const cuts = { ...s.cuts },
    baseStock = { ...s.baseStock }
  const delivery =
    P.crudeDelivery *
    s.yard.buildings
      .filter(b => b.defId === 'cdu')
      .reduce((n, b) => n + 1 + YARD.outputPerLevel * (b.level - 1), 0)
  const capacity = s.yard.buildings
    .filter(b => b.defId === 'crudeTank')
    .reduce((n, b) => n + P.crudeCapacity * (1 + YARD.outputPerLevel * (b.level - 1)), 0)
  if (
    has('gate') &&
    crude + delivery <= capacity &&
    money - delivery * P.crudeUnitPrice >= -P.creditLimit &&
    s.tick % P.crudeInterval === 0
  ) {
    crude += delivery
    money -= delivery * P.crudeUnitPrice
    const path = truckRoute(s)
    if (path.length && trucks.length < SALES.maxTrucks) {
      trucks = [
        ...trucks,
        {
          uid: `raw${nextId}`,
          kind: 'crude',
          customer: null,
          path,
          step: 0,
          phase: 'in',
          nextTick: s.tick + SALES.roadTicks,
        },
      ]
      nextId++
    }
  }
  for (const b of s.yard.buildings.filter(b => b.defId === 'cdu')) {
    const qty = Math.min(
      crude,
      P.crudeDelivery *
        (1 + YARD.outputPerLevel * (b.level - 1)) *
        (1 + getModifiers(s).production),
    )
    if (qty > 0 && crude >= qty) {
      crude -= qty
      for (const k of Object.keys(cuts) as CutId[])
        cuts[k] = Math.min(P.cutCapacity, cuts[k] + qty / 4)
    }
  }
  const base = bases.find(b => b.id === s.blend.base)!
  const units =
    P.lotUnits *
    s.yard.buildings
      .filter(b => b.defId === base.unit)
      .reduce((n, b) => n + 1 + YARD.outputPerLevel * (b.level - 1), 0) *
    (1 + getModifiers(s).production)
  if (
    baseAvailable(s, base.id) &&
    has(base.unit) &&
    cuts[base.cut] >= units &&
    baseStock[base.id] + units <= P.cutCapacity
  ) {
    cuts[base.cut] -= units
    baseStock[base.id] += units
  }
  return {
    ...s,
    money,
    crude,
    cuts,
    baseStock,
    trucks,
    nextId,
    year: { ...s.year, expenses: s.year.expenses + s.money - money },
    monthProfit: s.monthProfit - (s.money - money),
  }
}
