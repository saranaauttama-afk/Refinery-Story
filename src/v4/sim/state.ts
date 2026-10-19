import { B } from '../data/balance'
import type { GameState } from './types'
export function createNewGame(seed = B.defaultSeed): GameState {
  return { version: 4, seed: seed >>> 0, rng: seed >>> 0, tick: 0, speed: 1, nextId: 1,
    money: B.startingMoney, fame: 0, rd: 0, rank: 1,
    yard: { size: 16, ownedParcels: ['0,0','1,0','0,1','1,1'], buildings: [] },
    crude:0, crudeType:'light', cuts:{naphtha:0,kerosene:0,gasoil:0,residue:0}, baseStock:{lpg:0,gasoline:0,jet:0,diesel:0,lube:0,asphalt:0,wax:0,pellet:0}, tanks:[], blend:{base:'gasoline',additive:null}, familiarity:{},useCounts:{},triedPairs:[],unlockedAdditives:[],popups:[],
    customers:{}, trucks:[], contracts:{offers:[],active:[]},blueprints:[],decos:[],investments:{highway:0,port:0,industrial:0,airport:0},market:{phase:'normal',nextChangeTick:0},
    activeCombos:[],discoveredCombos:[],comboHints:[],
    staff: [], ledger: [], log: [] }
}
