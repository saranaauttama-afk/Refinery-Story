import { salePrice } from '../../src/v4/sim/systems/customers'
import { gradeFor } from '../../src/v4/sim/systems/blending'
import { createNewGame } from '../../src/v4/sim/state'
import { tick } from '../../src/v4/sim/tick'
import { buildStarter } from '../../src/v4/sim/systems/starter'
import { place,canPlace,upgrade } from '../../src/v4/sim/systems/yard'
import { recruit,hire,assign,train,levelUp } from '../../src/v4/sim/systems/staff'
import { invest,baseAvailable } from '../../src/v4/sim/systems/investments'
import { selectBlend,predictedScore } from '../../src/v4/sim/systems/blending'
import { acceptContract,deliverContract } from '../../src/v4/sim/systems/contracts'
import { bases } from '../../src/v4/data/bases'
import { hiring,trainings } from '../../src/v4/data/staff'
import { investments } from '../../src/v4/data/investments'
import { B,MONTH,YEAR } from '../../src/v4/data/balance'
import type { GameState } from '../../src/v4/sim/types'
export function buildFirstFree(s:GameState,id:string):GameState {for(let y=3;y<s.yard.size;y++)for(let x=0;x<s.yard.size;x++)if(canPlace(s,id,x,y))return place(s,id,x,y);return s}
export function autoplay(s:GameState):GameState {
 // Decisions use the same guarded actions as the UI. No grants, rank forcing or direct resource edits.
 for(const c of s.contracts.active)s=deliverContract(s,c.uid)
 if(s.tick%B.ticksPerWeek!==0)return s
 const year=Math.floor(s.tick/YEAR)+1
 const reserve=15000+s.staff.reduce((n,p)=>n+p.salary,0)
 const buildOnce=(id:string,budget:number)=>{if(!s.yard.buildings.some(b=>b.defId===id)&&s.money>budget+reserve)s=buildFirstFree(s,id)}
 buildOnce('canteen',8000);buildOnce('lab',15000)
 if(year>=3){buildOnce('hydro',25000);buildOnce('pipe',1000);buildOnce('reformer',120000)}
 if(year>=6){buildOnce('control',80000);buildOnce('cracker',300000)}
 const lines=s.tick/YEAR>=7?3:s.tick/YEAR>=4.6?2:1
 if(s.money>500000+reserve)for(const id of ['crudeTank','cdu','hydro','tank','blend'])if(s.yard.buildings.filter(b=>b.defId===id).length<lines)s=buildFirstFree(s,id)
 const desiredStaff=year<5?1:year<7?3:Math.min(8,s.rank+2)
 if(year>=4&&s.staff.length<desiredStaff&&s.money>100000+reserve){const method=[...hiring].reverse().find(h=>h.rank<=s.rank&&h.cost<s.money/5)!;s=recruit(s,method.id);const p=[...s.candidates].sort((a,b)=>Object.values(b.stats).reduce((n,x)=>n+x,0)-Object.values(a.stats).reduce((n,x)=>n+x,0))[0];if(p)s=hire(s,p.uid)}
 const station=s.yard.buildings.find(b=>b.defId==='blend');for(const p of s.staff)if(station&&!p.assignedTo)s=assign(s,p.uid,station.uid)
 if(s.tick%MONTH===0){for(const p of s.staff){if(s.money>reserve+20000){const options=trainings.filter(t=>t.rank<=s.rank&&t.power<=p.power&&t.cost<s.money/12&&((p.trainingCounts[t.id]??0)<12));const training=options[Math.floor(s.tick/MONTH)%Math.max(1,options.length)];if(training)s=train(s,p.uid,training.id)}s=levelUp(s,p.uid)}
  for(const d of investments){const step=d.steps[s.investments[d.id]??0];if(step&&s.rank>=d.rank&&s.money>step.cost*3+reserve)s=invest(s,d.id)}
 }
 // Upgrade the selected production chain when comfortably affordable.
 if(year>=5&&s.tick%MONTH===0)for(const b of s.yard.buildings.filter(b=>['cdu','blend','hydro'].includes(b.defId)))if(s.money>500000+reserve)s=upgrade(s,b.uid)
 const options=bases.filter(b=>baseAvailable(s,b.id)&&s.yard.buildings.some(v=>v.defId===b.unit)&&(!['lube'].includes(b.id)||s.investments.port>0)&&(!['jet'].includes(b.id)||s.investments.airport>0)&&(!['wax','pellet'].includes(b.id)||s.investments.industrial>0))
 let best:{base:typeof s.blend.base;additive:typeof s.blend.additive;value:number}|undefined
 for(const b of options)for(const additive of [null,...s.unlockedAdditives]){const score=predictedScore(s,b.id,additive);const value=salePrice(s,{base:b.id,grade:gradeFor(score)});if(!best||value>best.value)best={base:b.id,additive,value}}
 if(best)s=selectBlend(s,best.base,best.additive)
 for(const c of s.contracts.offers)if(c.base===s.blend.base&&s.contracts.active.length<3)s=acceptContract(s,c.uid)
 return s
}
export function simulate(seed:number,years=16){let s=buildStarter(createNewGame(seed)),negative=0,maxNegative=0;const reached:Record<number,number>={1:1};const annual:{year:number;rank:number;fame:number;money:number;profit:number}[]=[]
 for(let i=0;i<years*YEAR;i++){s=autoplay(tick(s));for(let rank=2;rank<=s.rank;rank++)if(!(rank in reached))reached[rank]=s.tick/YEAR;negative=s.money<0?negative+1:0;maxNegative=Math.max(maxNegative,negative);if(s.tick%YEAR===0)annual.push({year:s.tick/YEAR,rank:s.rank,fame:s.fame,money:Math.round(s.money),profit:Math.round(s.history.profits.slice(-12).reduce((n,p)=>n+p.profit,0)/12)})}
 return {state:s,reached,maxNegativeMonths:maxNegative/MONTH,unlocksFirst40Weeks:s.unlockHistory.filter(u=>u.tick<=40*B.ticksPerWeek).length,annual}
}
if(process.argv[1]?.endsWith('sim-run.ts')){const n=Number(process.argv[2]??1);for(let seed=1;seed<=n;seed++){const {state,...report}=simulate(seed);console.log(JSON.stringify({seed,...report}))}}
