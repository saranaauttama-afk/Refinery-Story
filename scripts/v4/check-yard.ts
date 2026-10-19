import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { place,move,demolish,buyLand } from '../../src/v4/sim/systems/yard'
import { toScreen,toTile } from '../../src/v4/render/iso'
let s={...createNewGame(),money:100000,rank:2};s=place(s,'cdu',0,0)
assert.equal(s.yard.buildings.length,1);assert.equal(place(s,'tank',1,1),s);assert.equal(place(s,'cdu',15,15),s)
const uid=s.yard.buildings[0].uid, before=s.money;s=move(s,uid,4,4)
assert.equal(s.yard.buildings[0].uid,uid);assert.equal(s.money,before-2000)
s=buyLand(s,2,0);assert.equal(s.yard.size,24);assert.notEqual(place(s,'tank',20,2),s);assert.equal(place(s,'tank',20,10),s)
const money=s.money;s=demolish(s,uid);assert.equal(s.money,money+10000)
assert.equal(buyLand(s,4,4),s);assert.equal(buyLand(s,-1,0),s)
for(let x=0;x<16;x++)for(let y=0;y<16;y++){const p=toScreen(x+.5,y+.5);assert.deepEqual(toTile(p.x,p.y),{x,y})}
console.log('M2 yard occupancy / move / refund / parcels / projection passed')
