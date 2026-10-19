import type { BaseId } from './bases'
import type { AdditiveId } from './additives'
import { additives } from './additives'
export type Compat='S'|'A'|'B'|'C'|'D'|'F'
// Explicit rows, ordered as additives.ts. No random compatibility or legacy data.
const rows:Record<BaseId,string>={
 gasoline:'S B A A B F D A B B A B D A D F B S S A',
 diesel:'D B A A B F S A S B A B A S D D B A A B',
 jet:'D S B D B F B S B A S A S A F F D A A B',
 lpg:'D D B A C F D A D A B B D S F F B A S A',
 lube:'F B A D B B B S S S A S A D A B B A A S',
 asphalt:'F F D B B D D B B A B B D D S S S A A B',
 wax:'D D B B A A D S A S B B D D S A B S A A',
 pellet:'F D D A S B D A B S B A D B S A S A S S',
}
export const compatibility=Object.fromEntries(Object.entries(rows).map(([base,row])=>[base,Object.fromEntries(row.split(' ').map((grade,i)=>[additives[i].id,grade]))])) as Record<BaseId,Record<AdditiveId,Compat>>
export const pairCompat=(base:BaseId,additive:AdditiveId|null):Compat=>additive?compatibility[base][additive]:'C'
