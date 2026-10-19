import { YARD } from '../../data/balance'
import { buildingDef } from '../../data/buildings'
import type { GameState, Building } from '../types'
export function buildingAt(s:GameState,x:number,y:number) { return s.yard.buildings.find(b=>{const d=buildingDef(b.defId);return x>=b.x&&y>=b.y&&x<b.x+d.w&&y<b.y+d.h}) }
export function canPlace(s:GameState,id:string,x:number,y:number,ignore?:string):boolean {
 const d=buildingDef(id)
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+d.w>YARD.maxSize||y+d.h>YARD.maxSize)return false
 for(let tx=x;tx<x+d.w;tx++)for(let ty=y;ty<y+d.h;ty++) {
  if(!s.yard.ownedParcels.includes(`${Math.floor(tx/YARD.parcel)},${Math.floor(ty/YARD.parcel)}`))return false
  if(s.yard.buildings.some(b=>b.uid!==ignore&&tx>=b.x&&ty>=b.y&&tx<b.x+buildingDef(b.defId).w&&ty<b.y+buildingDef(b.defId).h))return false
 }
 return true
}
export function place(s:GameState,id:string,x:number,y:number):GameState {
 const d=buildingDef(id);if(s.rank<d.rank||s.money<d.cost||!canPlace(s,id,x,y))return s
 const b:Building={uid:`b${s.nextId}`,defId:id,x,y,level:1,staff:[],cost:d.cost}
 return {...s,nextId:s.nextId+1,money:s.money-d.cost,yard:{...s.yard,buildings:[...s.yard.buildings,b]}}
}
export function move(s:GameState,uid:string,x:number,y:number):GameState {
 const b=s.yard.buildings.find(b=>b.uid===uid);if(!b||s.money<YARD.moveCost||!canPlace(s,b.defId,x,y,uid)||(b.x===x&&b.y===y))return s
 return {...s,money:s.money-YARD.moveCost,yard:{...s.yard,buildings:s.yard.buildings.map(b=>b.uid===uid?{...b,x,y}:b)}}
}
export function demolish(s:GameState,uid:string):GameState {
 const b=s.yard.buildings.find(b=>b.uid===uid);if(!b)return s
 return {...s,money:s.money+b.cost*YARD.refund,yard:{...s.yard,buildings:s.yard.buildings.filter(b=>b.uid!==uid)}}
}
export const upgradeCost=(b:Building)=>buildingDef(b.defId).cost*YARD.upgradeBase*YARD.upgradeGrowth**(b.level-1)
export function upgrade(s:GameState,uid:string):GameState {
 const b=s.yard.buildings.find(b=>b.uid===uid);if(!b||b.level>=YARD.maxLevel||s.money<upgradeCost(b))return s
 return {...s,money:s.money-upgradeCost(b),yard:{...s.yard,buildings:s.yard.buildings.map(p=>p.uid===uid?{...p,level:p.level+1}:p)}}
}
export function buyLand(s:GameState,px:number,py:number):GameState {
 const key=`${px},${py}`;const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>s.yard.ownedParcels.includes(`${px+dx},${py+dy}`))
 if(!Number.isInteger(px)||!Number.isInteger(py)||px<0||py<0||px>=YARD.maxSize/YARD.parcel||py>=YARD.maxSize/YARD.parcel||s.yard.ownedParcels.includes(key)||!adjacent||s.money<YARD.landCost||s.rank<2)return s
 return {...s,money:s.money-YARD.landCost,yard:{...s.yard,size:Math.max(s.yard.size,(px+1)*YARD.parcel,(py+1)*YARD.parcel),ownedParcels:[...s.yard.ownedParcels,key]}}
}
