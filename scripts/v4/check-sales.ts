import assert from 'node:assert/strict'
import { createNewGame } from '../../src/v4/sim/state'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { eligibleLot,sellTo,roadPath } from '../../src/v4/sim/systems/customers'
import { contractSystem,acceptContract,deliverContract } from '../../src/v4/sim/systems/contracts'
import { tick } from '../../src/v4/sim/tick'
import type { Lot } from '../../src/v4/sim/types'
const lot=(uid:string,grade:Lot['grade']):Lot=>({uid,grade,base:'gasoline',additive:null,score:150,stats:{purity:30,yield:30,stability:30,eco:30},units:300})
let s={...buildStarter(createNewGame()),fame:100,tanks:[lot('b','B'),lot('s','S'),lot('a','A')]}
assert.equal(eligibleLot(s,'gasoline','B')!.uid,'s');assert.equal(eligibleLot(s,'diesel','B'),undefined);assert.ok(roadPath(s).length>0)
const sold=sellTo(s,'gas0');assert.equal(sold.money,21600);assert.equal(sold.customers.gas0.hearts,1);assert.ok(!sold.tanks.some(l=>l.uid==='s'))
for(let i=0;i<11;i++)s=sellTo({...s,tanks:[lot('x','B')]},'gas0')
assert.equal(s.customers.gas0.hearts,11);assert.equal(s.log.length,1);assert.ok(s.unlockedAdditives.includes('dye'))
s={...s,tick:1};s=contractSystem(s);const offer=s.contracts.offers[0];s=acceptContract(s,offer.uid);s={...s,fame:100,tick:offer.deadline+1};s=contractSystem(s);assert.equal(s.fame,90);assert.equal(contractSystem(s).fame,90)
let early=buildStarter(createNewGame());early=tick(early);const gas=early.contracts.offers.find(c=>c.base==='gasoline')!;early=acceptContract(early,gas.uid)
for(let i=0;i<120;i++){early=tick(early);early=deliverContract(early,gas.uid)}assert.equal(early.contracts.active.length,0);assert.ok(early.fame>=25)
console.log('M4 best eligible lot / prices / hearts / one gift / deadlines / year-one contract passed')
