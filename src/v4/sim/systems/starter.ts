import { place } from './yard'
import type { GameState } from '../types'
export function buildStarter(s:GameState):GameState {
 if(s.yard.buildings.length)return s
 const layout:[string,number,number][]=[['gate',0,0],['loading',2,0],['crudeTank',0,3],['cdu',3,3],['blend',6,3],['tank',9,3]]
 return layout.reduce((s,[id,x,y])=>place(s,id,x,y),s)
}
