import assert from 'node:assert/strict'
import { combos } from '../../src/v4/data/combos'
import { buildingDef } from '../../src/v4/data/buildings'
import {
  detectCombos,
  refreshCombos,
  auraWeight,
  getModifiers,
} from '../../src/v4/sim/systems/combos'
import { createNewGame } from '../../src/v4/sim/state'
import { COMBO } from '../../src/v4/data/balance'
import type { Building } from '../../src/v4/sim/types'
assert.equal(combos.length, 30)
assert.equal(combos.filter(c => c.hidden).length, 8)
for (const combo of combos) {
  let x = 0
  const bs: Building[] = combo.members.map((id, i) => {
    const defId = id === 'process' ? 'cdu' : id
    const b = { uid: `b${i}`, defId, x, y: 0, level: 1, staff: [], cost: 0 }
    x += buildingDef(defId).w
    return b
  })
  assert.ok(
    detectCombos(bs).some(c => c.id === combo.id),
    combo.id,
  )
  const vertical = bs.map(b => ({ ...b, x: 0, y: b.x }))
  if (combo.kind === 'set') {
    let y = 0
    for (const b of vertical) {
      b.y = y
      y += buildingDef(b.defId).h
    }
    assert.ok(
      detectCombos(vertical).some(c => c.id === combo.id),
      `${combo.id} vertical`,
    )
  }
}
for (let dy = -2; dy <= 2; dy++)
  for (let dx = -2; dx <= 2; dx++) assert.equal(auraWeight(dx, dy), COMBO.aura[dy + 2][dx + 2])
assert.equal(auraWeight(3, 0), 0)
let s = createNewGame()
s = refreshCombos({
  ...s,
  yard: {
    ...s.yard,
    buildings: [
      { uid: 'a', defId: 'flare', x: 0, y: 0, level: 1, staff: [], cost: 0 },
      { uid: 'b', defId: 'canteen', x: 1, y: 0, level: 1, staff: [], cost: 0 },
    ],
  },
})
assert.equal(getModifiers(s).regen, -0.3)
assert.equal(refreshCombos(s).fame, s.fame)
const distant = s.yard.buildings.map((b, i) => ({ ...b, x: i * 10 }))
assert.ok(!detectCombos(distant).some(c => c.id === 'smoke'))
console.log(
  'M5 all 30 combos reachable / hidden count / exact auras / negative pair / discovery once passed',
)
