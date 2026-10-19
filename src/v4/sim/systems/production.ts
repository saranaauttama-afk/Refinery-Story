import { getModifiers } from './combos'
import { roadPath } from './customers'
import { SALES } from '../../data/balance'
import { PRODUCTION as P, YARD } from '../../data/balance'
import { bases, type CutId } from '../../data/bases'
import type { GameState } from '../types'
export function production(s:GameState):GameState {
 if(s.tick%P.cycle!==0)return s
 const has=(id:string)=>s.yard.buildings.some(b=>b.defId===id)
 let {crude,money,nextId}=s;let trucks=s.trucks;const cuts={...s.cuts},baseStock={...s.baseStock}
 const capacity=s.yard.buildings.filter(b=>b.defId==='crudeTank').length*P.crudeCapacity
 if(has('gate')&&crude+P.crudeDelivery<=capacity&&money-P.crudeDelivery*P.crudeUnitPrice>=-P.creditLimit&&s.tick%P.crudeInterval===0){crude+=P.crudeDelivery;money-=P.crudeDelivery*P.crudeUnitPrice;const path=roadPath(s);if(path.length&&trucks.length<SALES.maxTrucks){trucks=[...trucks,{uid:`raw${nextId}`,kind:'crude',customer:null,path,step:0,phase:'in',nextTick:s.tick+SALES.roadTicks}];nextId++}}
 for(const b of s.yard.buildings.filter(b=>b.defId==='cdu')){
  const qty=Math.min(crude,P.crudeDelivery*(1+YARD.outputPerLevel*(b.level-1))*(1+getModifiers(s).production))
  if(qty>0&&crude>=qty&&Object.values(cuts).every(n=>n+qty/4<=P.cutCapacity)){crude-=qty;for(const k of Object.keys(cuts) as CutId[])cuts[k]+=qty/4}
 }
 const base=bases.find(b=>b.id===s.blend.base)!
 const units=P.lotUnits
 if(s.rank>=base.rank&&has(base.unit)&&cuts[base.cut]>=units&&baseStock[base.id]+units<=P.cutCapacity){cuts[base.cut]-=units;baseStock[base.id]+=units}
 return {...s,money,crude,cuts,baseStock,trucks,nextId}
}
