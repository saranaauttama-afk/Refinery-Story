import assert from 'node:assert/strict'
import { buildings } from '../../src/v4/data/buildings'
import { sprites } from '../../src/v4/render/buildings'
import { workerSprite, truckSprite } from '../../src/v4/render/life'
for (const b of buildings) {
  const draw = sprites[b.id]
  assert.ok(draw, `${b.id}: missing sprite`)
  const l1 = draw(1, b.accent, 0),
    l3 = draw(3, b.accent, 0),
    l5 = draw(5, b.accent, 0)
  assert.ok(l1.length >= 2 || b.id === 'road')
  if (b.id !== 'road') {
    assert.notDeepEqual(l1, l3, `${b.id}: L3`)
    assert.notDeepEqual(l3, l5, `${b.id}: L5`)
  }
  for (const c of [...l1, ...l3, ...l5]) {
    if (c.kind === 'polygon') assert.ok(c.points.every(p => p.every(Number.isFinite)))
    else if (c.kind === 'circle') assert.ok(c.r > 0)
    else assert.ok(c.w > 0 && c.h > 0)
    assert.match(c.color, /^#[0-9A-Fa-f]{6}$/)
  }
}
assert.notDeepEqual(truckSprite('crude', '#E2483D', 0), truckSprite('product', '#E2483D', 0))
assert.notDeepEqual(workerSprite('chemist', 0), workerSprite('safety', 0))
assert.notDeepEqual(sprites.flare(1, '#F08A24', 0), sprites.flare(1, '#F08A24', 1))
console.log(
  `M2b ${buildings.length} sprites / L1 L3 L5 / geometry / truck types / worker jobs passed`,
)
