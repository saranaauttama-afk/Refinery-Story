export type Speed = 0 | 1 | 2 | 4
export interface Building { uid: string; defId: string; x: number; y: number; level: number; staff: string[]; cost: number }
export interface Staff { uid: string; salary: number }
export interface GameState {
  version: 4; seed: number; rng: number; tick: number; speed: Speed; nextId: number
  money: number; fame: number; rd: number; rank: number
  yard: { size: number; ownedParcels: string[]; buildings: Building[] }
  staff: Staff[]
  ledger: { tick: number; amount: number; reason: string }[]
  log: { tick: number; en: string; th: string }[]
}
export type Action = (state: GameState) => GameState
