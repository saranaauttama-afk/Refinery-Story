import { combos, emptyModifiers, type ComboDef } from '../../data/combos'
import { COMBO, B } from '../../data/balance'
import { buildingDef } from '../../data/buildings'
import type { Building, GameState, ActiveCombo } from '../types'
const matches = (b: Building, id: string) =>
  id === 'process'
    ? buildingDef(b.defId).category === 'process'
    : id === 'tank'
      ? ['tank', 'crudeTank'].includes(b.defId)
      : b.defId === id
export function distance(a: Building, b: Building): number {
  const ad = buildingDef(a.defId),
    bd = buildingDef(b.defId)
  return Math.max(
    0,
    a.x - (b.x + bd.w - 1),
    b.x - (a.x + ad.w - 1),
    a.y - (b.y + bd.h - 1),
    b.y - (a.y + ad.h - 1),
  )
}
function inRow(bs: Building[]): boolean {
  const h = [...bs].sort((a, b) => a.x - b.x),
    v = [...bs].sort((a, b) => a.y - b.y)
  return (
    h.every(
      (b, i) => b.y === h[0].y && (!i || h[i - 1].x + buildingDef(h[i - 1].defId).w === b.x),
    ) ||
    v.every((b, i) => b.x === v[0].x && (!i || v[i - 1].y + buildingDef(v[i - 1].defId).h === b.y))
  )
}
export function detectCombo(list: Building[], def: ComboDef): Building[] | undefined {
  function search(chosen: Building[], i: number): Building[] | undefined {
    if (i === def.members.length)
      return (
        def.kind === 'pair' ? distance(chosen[0], chosen[1]) <= COMBO.distance : inRow(chosen)
      )
        ? chosen
        : undefined
    for (const b of list)
      if (matches(b, def.members[i]) && !chosen.some(v => v.uid === b.uid)) {
        const found = search([...chosen, b], i + 1)
        if (found) return found
      }
    return undefined
  }
  return search([], 0)
}
export function detectCombos(list: Building[]): ActiveCombo[] {
  return combos.flatMap(c => {
    const bs = detectCombo(list, c)
    return bs ? [{ id: c.id, members: bs.map(b => b.uid) }] : []
  })
}
export function refreshCombos(s: GameState): GameState {
  const activeCombos = detectCombos(s.yard.buildings),
    fresh = activeCombos.filter(c => !s.discoveredCombos.includes(c.id))
  if (!fresh.length) return { ...s, activeCombos }
  return {
    ...s,
    activeCombos,
    discoveredCombos: [...s.discoveredCombos, ...fresh.map(c => c.id)],
    fame: s.fame + fresh.length * COMBO.fame,
    log: [
      ...s.log,
      ...fresh.map(c => ({
        tick: s.tick,
        en: `New Combo! ${combos.find(d => d.id === c.id)!.name.en}`,
        th: `พบคอมโบใหม่! ${combos.find(d => d.id === c.id)!.name.th}`,
      })),
    ].slice(-B.logLimit),
  }
}
export function auraWeight(dx: number, dy: number) {
  return Math.abs(dx) > 2 || Math.abs(dy) > 2 ? 0 : COMBO.aura[dy + 2][dx + 2]
}
export function getModifiers(s: GameState) {
  const result = emptyModifiers()
  for (const a of s.activeCombos) {
    const c = combos.find(c => c.id === a.id)!
    for (const [k, v] of Object.entries(c.effect)) result[k as keyof typeof result] += v!
  }
  const targets = s.yard.buildings.filter(b =>
    ['process', 'blend'].includes(buildingDef(b.defId).category),
  )
  for (const emitter of s.yard.buildings.filter(b =>
    ['tree', 'lab', 'control', 'canteen', 'lamp'].includes(b.defId),
  )) {
    const field =
      emitter.defId === 'tree'
        ? 'eco'
        : emitter.defId === 'lab'
          ? 'purity'
          : emitter.defId === 'control'
            ? 'stability'
            : emitter.defId === 'canteen'
              ? 'yield'
              : 'stability'
    let total = 0
    for (const target of targets) {
      const d = buildingDef(target.defId)
      const x = Math.max(target.x, Math.min(emitter.x, target.x + d.w - 1)),
        y = Math.max(target.y, Math.min(emitter.y, target.y + d.h - 1))
      total += auraWeight(x - emitter.x, y - emitter.y) * COMBO.auraPower
    }
    result[field] += targets.length ? total / targets.length : 0
  }
  return result
}
export function buyHint(s: GameState, id: string): GameState {
  const d = combos.find(c => c.id === id)
  if (!d || d.hidden || s.comboHints.includes(id) || s.money < COMBO.hintCost) return s
  return { ...s, money: s.money - COMBO.hintCost, comboHints: [...s.comboHints, id] }
}
// Free placement hints: combos that include this building and whose other members
// are already in the yard, so the player knows what to put it next to.
export function comboLeads(s: GameState, id: string) {
  const isProcess = buildingDef(id).category === 'process'
  const owned = new Set(s.yard.buildings.map(b => b.defId))
  const hasMember = (m: string) =>
    m === 'process'
      ? s.yard.buildings.some(b => buildingDef(b.defId).category === 'process')
      : owned.has(m)
  return combos
    .filter(
      c => !c.hidden && (c.members.includes(id) || (isProcess && c.members.includes('process'))),
    )
    .map(c => {
      const others = [...c.members]
      others.splice(others.indexOf(others.includes(id) ? id : 'process'), 1)
      return {
        combo: c,
        known: s.discoveredCombos.includes(c.id) || s.comboHints.includes(c.id),
        partners: others,
        ready: others.every(hasMember),
      }
    })
    .filter(l => l.partners.some(hasMember))
}
