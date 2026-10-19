import assert from 'node:assert/strict'
import { trainingGain,train,levelUp,recruit,hire,assign,fire,rehire,changeJob,canDirect } from '../../src/v4/sim/systems/staff'
import { createNewGame } from '../../src/v4/sim/state'
import { sampleStaff } from './fixtures'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { predictedScore } from '../../src/v4/sim/systems/blending'
import { random } from '../../src/v4/sim/rng'
assert.equal(trainingGain(6,6,false),3);assert.equal(trainingGain(6,12,false),0);assert.equal(trainingGain(6,99,true),18)
let hits=0,rng=7;for(let i=0;i<10000;i++){const [r,next]=random(rng);rng=next;if(r<.05)hits++}assert.ok(hits>430&&hits<570,`${hits}`)
let s={...buildStarter(createNewGame()),rank:8,money:1e7,rd:10000,staff:[sampleStaff()],careerManuals:10}
s=train(s,'p','lab');assert.ok(s.unlockedAdditives.includes('octane'));const salary=s.staff[0].salary
s=levelUp(s,'p');s=levelUp(s,'p');assert.ok(Math.abs(s.staff[0].salary-salary*1.2**2)<1e-6)
const before=predictedScore(s);s=assign(s,'p',s.yard.buildings.find(b=>b.defId==='blend')!.uid);assert.ok(predictedScore(s)>before)
const saved=s.staff[0].stats;s=fire(s,'p');assert.equal(s.staff.length,0);s=rehire(s,'p');assert.deepEqual(s.staff[0].stats,saved)
s=recruit(s,'word');assert.equal(s.candidates.length,3);s=hire(s,s.candidates[0].uid);assert.equal(s.candidates.length,0)
assert.equal(changeJob(s,'p','director'),s);s={...s,staff:s.staff.map(p=>p.uid==='p'?{...p,jobLevels:{...p.jobLevels,manager:5,chemist:5}}:p)};assert.ok(canDirect(s.staff[0]));assert.equal(changeJob(s,'p','director').staff[0].job,'director')
console.log(`M6 diminishing / Super Up ${hits}/10000 / salary / unlock / assignment quality / rehire / director passed`)
