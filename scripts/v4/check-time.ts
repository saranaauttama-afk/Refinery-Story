import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { tick } from '../../src/v4/sim/tick'
import { dateAt } from '../../src/v4/sim/time'
import { serialize, deserialize } from '../../src/v4/sim/save'
import { sampleStaff } from './fixtures'
import { random } from '../../src/v4/sim/rng'
let s = createNewGame(7)
s = {...s, yard:{...s.yard,buildings:[{uid:'test',defId:'tank',x:0,y:0,level:1,staff:[],cost:10000}]}, staff:[{...sampleStaff(),salary:1000}]}
const initial = serialize(s)
for(let i=0;i<720;i++) s=tick(s)
assert.equal(s.ledger.length,3); assert.equal(s.money,46100)
assert.deepEqual(dateAt(s.tick),{year:1,month:4,week:1})
assert.deepEqual(deserialize(serialize(s)),s)
let repeat=deserialize(initial);for(let i=0;i<720;i++) repeat=tick(repeat)
assert.deepEqual(repeat,s);assert.equal(deserialize(initial).tick,0)
assert.deepEqual(random(77),random(77));assert.notEqual(random(77)[0],random(random(77)[1])[0])
assert.throws(()=>deserialize('{"version":3}'))
console.log('M1 time / upkeep / save / determinism passed')
