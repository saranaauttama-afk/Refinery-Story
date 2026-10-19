export type Speed = 0 | 1 | 2 | 4
export interface Building { uid: string; defId: string; x: number; y: number; level: number; staff: string[]; cost: number }
export interface Staff { uid:string;name:string;job:import('../data/staff').JobId;jobLevels:Record<import('../data/staff').JobId,number>;stats:{op:number;chem:number;mech:number;safe:number};power:number;maxPower:number;salary:number;trainingCounts:Partial<Record<import('../data/staff').TrainingId,number>>;assignedTo:string|null;resting:boolean }
export interface GameState {
  version: 4; seed: number; rng: number; tick: number; speed: Speed; nextId: number
  money: number; fame: number; rd: number; rank: number
  yard: { size: number; ownedParcels: string[]; buildings: Building[] }
  crude:number; crudeType:'light'|'heavy'|'shale'; cuts:Record<import('../data/bases').CutId,number>
  baseStock:Record<import('../data/bases').BaseId,number>; tanks:Lot[]
  blend:{base:import('../data/bases').BaseId;additive:import('../data/additives').AdditiveId|null}
  familiarity:Record<string,number>; useCounts:Record<string,number>; triedPairs:string[]
  unlockedAdditives:import('../data/additives').AdditiveId[]; popups:Popup[]
  customers:Record<string,{hearts:number;giftGiven:boolean}>; trucks:Truck[]
  contracts:{offers:Contract[];active:Contract[]};blueprints:string[];decos:string[]
  investments:Record<string,number>;market:{phase:'normal'|'boom'|'bust';nextChangeTick:number}
  activeCombos:ActiveCombo[];discoveredCombos:string[];comboHints:string[]
  firedStaff:Staff[];candidates:Staff[];careerManuals:number;merchantUntil:number
  staff: Staff[]
  ledger: { tick: number; amount: number; reason: string }[]
  log: { tick: number; en: string; th: string }[]
}
export type Action = (state: GameState) => GameState
export type Grade='SS'|'S'|'A'|'B'|'C'
export interface Stats { purity:number; yield:number; stability:number; eco:number }
export interface Lot { uid:string; base:import('../data/bases').BaseId; additive:import('../data/additives').AdditiveId|null; stats:Stats; score:number; grade:Grade; units:number }
export interface Popup { uid:string; tick:number; x:number; y:number; en:string; th:string }
export interface Truck { uid:string;customer:string|null;kind:'crude'|'product';path:{x:number;y:number}[];step:number;phase:'in'|'dwell'|'out';nextTick:number }
export interface Contract { uid:string;base:import('../data/bases').BaseId;minGrade:Grade;units:number;delivered:number;deadline:number }
export interface ActiveCombo {id:string;members:string[]}
