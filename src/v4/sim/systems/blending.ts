import { staffStats } from './staff'
import { getModifiers } from './combos'
import { PRODUCTION as P,PAIR,GRADES } from '../../data/balance'
import { pairCompat, type Compat } from '../../data/compatibility'
import type { BaseId } from '../../data/bases'
import type { AdditiveId } from '../../data/additives'
import type { GameState, Stats, Grade } from '../types'
export const scoreLot=(stats:Stats,pair:Compat,familiarity:number,comboBonus=0)=>Object.values(stats).reduce((a,b)=>a+b,0)*PAIR[pair]*(1+P.familiarityBonus*familiarity)*(1+comboBonus)
export const gradeFor=(score:number):Grade=>GRADES.find(g=>score>=g.min)?.id??'C'
export function lotStats(s:GameState):Stats {const n=P.baseStat*P.crudeQuality[s.crudeType];const m=getModifiers(s),p=staffStats(s);return {purity:n+m.purity+p.purity,yield:(n+m.yield+p.yield)*(1+m.yieldPct),stability:n+m.stability+p.stability,eco:n+m.eco+p.eco}}
export function predictedScore(s:GameState,base=s.blend.base,additive=s.blend.additive){const familiarity=additive?((s.familiarity[base]??1)+(s.familiarity[additive]??1))/2:s.familiarity[base]??1;const m=getModifiers(s);return scoreLot(lotStats(s),pairCompat(base,additive),familiarity,m.quality)+m.score+(base==='gasoline'?m.gasolineScore:0)}
export function selectBlend(s:GameState,base:BaseId,additive:AdditiveId|null):GameState {
 if(additive&&!s.unlockedAdditives.includes(additive))return s
 return {...s,blend:{base,additive}}
}
export function blending(s:GameState):GameState {
 if(s.tick%P.cycle!==0)return s
 const stations=s.yard.buildings.filter(b=>b.defId==='blend');if(!stations.length)return s
 const capacity=s.yard.buildings.filter(b=>b.defId==='tank').length*P.tankCapacity*(1+getModifiers(s).capacity)
 let next=s
 for(const station of stations){
  const {base,additive}=next.blend
  if(next.baseStock[base]<P.lotUnits||next.tanks.reduce((n,l)=>n+l.units,0)+P.lotUnits>capacity)continue
  const stats=lotStats(next),score=predictedScore(next),grade=gradeFor(score),key=`${base}:${additive??'none'}`,first=!next.triedPairs.includes(key)
  const familiarity={...next.familiarity},useCounts={...next.useCounts}
  for(const id of [base,additive])if(id){useCounts[id]=(useCounts[id]??0)+1;familiarity[id]=Math.min(P.familiarityMax,1+Math.floor(useCounts[id]/P.familiarityLots))}
  next={...next,nextId:next.nextId+1,baseStock:{...next.baseStock,[base]:next.baseStock[base]-P.lotUnits},tanks:[...next.tanks,{uid:`l${next.nextId}`,base,additive,stats,score,grade,units:P.lotUnits}],fame:next.fame+(first?P.firstTryFame:0),triedPairs:first?[...next.triedPairs,key]:next.triedPairs,familiarity,useCounts,popups:[...next.popups,{uid:`p${next.nextId}`,tick:next.tick,x:station.x,y:station.y,en:`${grade}!`,th:`${grade}!`}]}
 }
 return next
}
