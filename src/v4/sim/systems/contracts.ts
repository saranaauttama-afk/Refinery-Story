import { SALES as C,B } from '../../data/balance'
import { bases } from '../../data/bases'
import { isMonthStart } from '../time'
import type { GameState } from '../types'
import { eligibleLot,salePrice } from './customers'
export function contractSystem(s:GameState):GameState {
 const expired=s.contracts.active.filter(c=>s.tick>c.deadline)
 let next={...s,fame:Math.max(0,s.fame-expired.length*C.failedFame),contracts:{...s.contracts,active:s.contracts.active.filter(c=>s.tick<=c.deadline)}}
 if(isMonthStart(s.tick)){const pool=bases.filter(b=>b.rank<=s.rank);const offers=Array.from({length:C.offers},(_,i)=>({uid:`c${s.nextId+i}`,base:pool[(Math.floor(s.tick/(B.ticksPerWeek*B.weeksPerMonth))+i)%pool.length].id,minGrade:'B' as const,units:C.units,delivered:0,deadline:s.tick+C.deadlineWeeks*B.ticksPerWeek}));next={...next,nextId:s.nextId+C.offers,contracts:{...next.contracts,offers}}}
 return next
}
export function acceptContract(s:GameState,uid:string):GameState {const c=s.contracts.offers.find(c=>c.uid===uid);if(!c||s.contracts.active.length>=C.maxContracts||s.tick>c.deadline)return s;return {...s,contracts:{offers:s.contracts.offers.filter(c=>c.uid!==uid),active:[...s.contracts.active,c]}}}
export function deliverContract(s:GameState,uid:string):GameState {
 const c=s.contracts.active.find(c=>c.uid===uid);if(!c||s.tick>c.deadline)return s
 let next=s,remaining=c.units-c.delivered,paid=0
 while(remaining>0){const l=eligibleLot(next,c.base,c.minGrade);if(!l)break;const qty=Math.min(l.units,remaining);paid+=qty*salePrice(next,l)*C.reward;remaining-=qty;next={...next,tanks:next.tanks.map(t=>t.uid===l.uid?{...t,units:t.units-qty}:t).filter(t=>t.units>0)}}
 if(next===s)return s
 return {...next,money:next.money+paid,fame:next.fame+(remaining===0?C.contractFame:0),rd:next.rd+Math.floor((c.units-c.delivered-remaining)/C.rdUnits),contracts:{...next.contracts,active:remaining===0?next.contracts.active.filter(v=>v.uid!==uid):next.contracts.active.map(v=>v.uid===uid?{...v,delivered:c.units-remaining}:v)}}
}
