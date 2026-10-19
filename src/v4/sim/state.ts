import { B } from '../data/balance'
import type { GameState } from './types'
export function createNewGame(seed = B.defaultSeed): GameState {
  return { version: 4, seed: seed >>> 0, rng: seed >>> 0, tick: 0, speed: 1, nextId: 1,
    money: B.startingMoney, fame: 0, rd: 0, rank: 1,
    yard: { size: 16, ownedParcels: ['0,0','1,0','0,1','1,1'], buildings: [] },
    staff: [], ledger: [], log: [] }
}
