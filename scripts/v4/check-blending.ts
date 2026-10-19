import assert from 'node:assert/strict'
import { scoreLot,blending } from '../../src/v4/sim/systems/blending'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { tick } from '../../src/v4/sim/tick'
import { compatibility } from '../../src/v4/data/compatibility'
import { bases } from '../../src/v4/data/bases'
import { additives } from '../../src/v4/data/additives'
const stats={purity:25,yield:25,stability:25,eco:25}
for(const [pair,expected] of Object.entries({S:160.68,A:133.9,B:117.832,C:107.12,D:91.052,F:64.272}))assert.ok(Math.abs(scoreLot(stats,pair as keyof typeof import('../../src/v4/data/balance').PAIR,1,.04)-expected)<1e-6)
for(const b of bases){assert.equal(Object.keys(compatibility[b.id]).length,20);for(const a of additives)assert.ok('SABCDF'.includes(compatibility[b.id][a.id]))}
let s=buildStarter(createNewGame());assert.equal(s.money,0)
for(let i=0;i<360&&!s.tanks.length;i++)s=tick(s)
assert.ok(s.tanks.length>0);assert.ok(s.tick<=360);assert.equal(s.fame,10)
const original=s;for(let i=0;i<100;i++)s=blending({...s,tick:60,tanks:[],baseStock:{...s.baseStock,gasoline:300}})
assert.equal(s.fame,10);assert.equal(s.familiarity.gasoline,10);assert.equal(original.tanks.length,1)
console.log('M3 all compat formula / matrix / first lot / familiarity / first try passed')
