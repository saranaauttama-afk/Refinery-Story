import { investments } from '../../data/investments'
import { baseDef,type BaseId } from '../../data/bases'
import type { GameState } from '../types'
export function invest(s:GameState,id:string):GameState {const d=investments.find(d=>d.id===id);if(!d||s.rank<d.rank)return s;const level=s.investments[id]??0,step=d.steps[level];if(!step||s.money<step.cost)return s;return {...s,money:s.money-step.cost,investments:{...s.investments,[id]:level+1},unlockHistory:[...s.unlockHistory,{tick:s.tick,key:`${id}:${level+1}`}]}}
export const hasStimulus=(s:GameState)=>Object.values(s.investments).some(v=>v>=2)
export const hasShelter=(s:GameState)=>Object.values(s.investments).some(v=>v>=3)
export const baseAvailable=(s:GameState,id:BaseId)=>s.rank>=baseDef(id).rank&&(!['wax','pellet'].includes(id)||s.investments.industrial>0)
