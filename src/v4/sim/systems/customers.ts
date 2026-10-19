import { PROGRESSION as P } from '../../data/balance'
import { hasStimulus } from './investments'
import { getModifiers } from './combos'
import { GRADES, SALES as C, CUSTOMER_BALANCE, B } from '../../data/balance'
import { baseDef } from '../../data/bases'
import { customers, type CustomerDef } from '../../data/customers'
import type { GameState, Grade, Lot, Truck } from '../types'
import { buildingDef } from '../../data/buildings'
import { random } from '../rng'
export const gradeRank=(g:Grade)=>GRADES.findIndex(v=>v.id===g)
export const eligibleLot=(s:GameState,base:string,min:Grade):Lot|undefined=>s.tanks.filter(l=>l.base===base&&l.units>0&&gradeRank(l.grade)<=gradeRank(min)).sort((a,b)=>gradeRank(a.grade)-gradeRank(b.grade)||b.score-a.score)[0]
export const marketMultiplier=(s:GameState)=>s.market.phase==='boom'?1+P.marketBonus:s.market.phase==='bust'?1-P.marketBonus*(hasStimulus(s)?P.stimulus:1):1
export const salePrice=(s:GameState,l:Pick<Lot,'base'|'grade'>)=>baseDef(l.base).price*GRADES.find(g=>g.id===l.grade)!.price*marketMultiplier(s)*(1+getModifiers(s).price)*(s.investments.port>=4?P.exportBonus:1)*(l.base==='jet'&&['S','SS'].includes(l.grade)&&s.investments.airport>=4?P.airportBonus:1)
export const customerUnlocked=(s:GameState,c:CustomerDef)=>c.group==='gas'?(Number(c.id.slice(3))<CUSTOMER_BALANCE.starterBuyers||s.investments.highway>0):c.group==='air'?s.investments.airport>0:c.group==='shipping'?s.investments.port>0:c.group==='industrial'?s.investments.industrial>0:s.rank>=CUSTOMER_BALANCE.governmentRank
export function roadPath(s:GameState):{x:number;y:number}[] {
 const gate=s.yard.buildings.find(b=>b.defId==='gate'),bay=s.yard.buildings.find(b=>b.defId==='loading');if(!gate||!bay)return []
 const allowed=new Set<string>()
 for(const b of s.yard.buildings.filter(b=>['gate','loading','road'].includes(b.defId))){const d=buildingDef(b.defId);for(let x=b.x;x<b.x+d.w;x++)for(let y=b.y;y<b.y+d.h;y++)allowed.add(`${x},${y}`)}
 const start=`${gate.x},${gate.y}`,end=`${bay.x},${bay.y}`,queue=[start],previous=new Map<string,string|null>([[start,null]])
 for(let i=0;i<queue.length;i++){const k=queue[i];if(k===end)break;const [x,y]=k.split(',').map(Number);for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const n=`${x+dx},${y+dy}`;if(allowed.has(n)&&!previous.has(n)){previous.set(n,k);queue.push(n)}}}
 if(!previous.has(end))return []
 const path=[];let k:string|null=end;while(k!==null){const [x,y]=k.split(',').map(Number);path.unshift({x,y});k=previous.get(k)??null}return path
}
export function sellTo(s:GameState,customerId:string):GameState {
 const c=customers.find(c=>c.id===customerId);if(!c||!customerUnlocked(s,c))return s
 const lot=eligibleLot(s,c.base,c.minGrade);if(!lot)return s
 const units=Math.min(lot.units,C.units),income=salePrice(s,lot)*units,prev=s.customers[c.id]??{hearts:0,giftGiven:false},hearts=prev.hearts+1,gift=!prev.giftGiven&&hearts>=C.giftHearts
 const p=s.yard.buildings.find(b=>b.defId==='loading')
 let next:GameState={...s,money:s.money+income,year:{...s.year,income:s.year.income+income,sold:s.year.sold+units},monthProfit:s.monthProfit+income,fame:s.fame+GRADES.find(g=>g.id===lot.grade)!.fame,rd:s.rd+Math.floor(units/C.rdUnits),tanks:s.tanks.map(l=>l.uid===lot.uid?{...l,units:l.units-units}:l).filter(l=>l.units>0),customers:{...s.customers,[c.id]:{hearts,giftGiven:prev.giftGiven||gift}},log:gift?[...s.log,{tick:s.tick,en:`Gift from ${c.name.en}`,th:`ได้รับของขวัญจาก${c.name.th}`}].slice(-B.logLimit):s.log,popups:[...s.popups,{uid:`sale${s.nextId}`,tick:s.tick,x:p?.x??0,y:p?.y??0,en:`+$${Math.round(income)}`,th:`+$${Math.round(income)}`}],nextId:s.nextId+1}
 if(gift){next={...next,unlockHistory:[...next.unlockHistory,{tick:s.tick,key:`gift:${c.gift.kind}:${c.gift.id}`}]};if(c.gift.kind==='additive')next={...next,unlockedAdditives:[...new Set([...next.unlockedAdditives,c.gift.id as import('../../data/additives').AdditiveId])]};else if(c.gift.kind==='blueprint')next={...next,blueprints:[...new Set([...next.blueprints,c.gift.id])]};else next={...next,decos:[...new Set([...next.decos,c.gift.id])]}}
 return next
}
export function customerSystem(s:GameState):GameState {
 let next=s;const trucks:Truck[]=[]
 for(const truck of s.trucks){let t={...truck};if(s.tick>=t.nextTick){if(t.phase==='dwell'){if(t.customer)next=sellTo(next,t.customer);t={...t,phase:'out',path:[...t.path].reverse(),step:0,nextTick:s.tick+C.roadTicks}}
 else if(t.step<t.path.length-1)t={...t,step:t.step+1,nextTick:s.tick+C.roadTicks};else if(t.phase==='in')t={...t,phase:'dwell',nextTick:s.tick+Math.max(1,Math.round(C.dwellTicks*(1+getModifiers(s).dwell)))};else continue}trucks.push(t)}
 if(s.tick%Math.max(C.roadTicks,Math.floor(C.arrivalTicks/(1+C.highwayBays*(s.investments.highway??0))))===0&&trucks.length<C.maxTrucks){const path=roadPath(next),pool=customers.filter(c=>customerUnlocked(next,c));if(path.length&&pool.length){const [r,rng]=random(next.rng);const ready=pool.filter(c=>eligibleLot(next,c.base,c.minGrade));const demand=ready.length?ready:pool;const c=demand[Math.floor(r*demand.length)];trucks.push({uid:`t${next.nextId}`,kind:'product',customer:c.id,path,step:0,phase:'in',nextTick:s.tick+C.roadTicks});next={...next,rng,nextId:next.nextId+1}}}
 return {...next,trucks}
}
