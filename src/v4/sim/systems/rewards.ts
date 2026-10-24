// Rewarded-ad rewards (docs/v4/ADS.md). The UI shows the ad, then dispatches one of these;
// the sim only checks the limits, which run on game time so the phone clock cannot be used.
import { REWARD_ADS as R, MONTH, B } from '../../data/balance'
import { secretFormulas, synergies, synergyKey } from '../../data/formulaLab'
import { dateAt } from '../time'
import type { GameState, RewardAds } from '../types'

export const emptyRewards = (): RewardAds => ({
  finishYear: 0,
  finishCount: 0,
  hintYear: 0,
  hintCount: 0,
  boostMonth: -1,
  boostArmed: false,
})

const year = (s: GameState) => dateAt(s.tick).year
/** Absolute game month, counted from 0. */
const monthIndex = (s: GameState) => Math.floor(s.tick / MONTH)
const rewards = (s: GameState): RewardAds => s.rewards ?? emptyRewards()

export type AdKind = 'finish' | 'double' | 'storm' | 'boost' | 'hint'

export function finishLeft(s: GameState) {
  const r = rewards(s)
  return R.finishPerYear - (r.finishYear === year(s) ? r.finishCount : 0)
}
export function hintLeft(s: GameState) {
  const r = rewards(s)
  return R.hintPerYear - (r.hintYear === year(s) ? r.hintCount : 0)
}
export const boostReady = (s: GameState) =>
  rewards(s).boostMonth !== monthIndex(s) && !rewards(s).boostArmed
const stormOn = (s: GameState) => s.tick < s.stormUntil

/** A hint nobody has found yet, picked in a fixed order so the sim stays deterministic. */
function openHint(s: GameState): string | null {
  const fl = s.formulaLab
  const open = [
    ...synergies
      .filter(x => x.kind === 'good')
      .map(x => `syn:${synergyKey(x.a, x.b)}`)
      .filter(k => !fl.hints.includes(k) && !fl.knownSynergies.includes(k.slice(4))),
    ...secretFormulas
      .map(x => `secret:${x.id}`)
      .filter(k => !fl.hints.includes(k) && !fl.formulas.some(f => `secret:${f.secret}` === k)),
  ]
  return open.length ? open[(s.tick + s.nextId) % open.length] : null
}

export function adAvailable(s: GameState, kind: AdKind, labUid?: string): boolean {
  const job = labUid ? s.research.find(j => j.lab === labUid) : undefined
  switch (kind) {
    case 'finish':
      return job?.kind === 'catalyst' && job.endTick > s.tick && finishLeft(s) > 0
    case 'double':
      return job?.kind === 'catalyst' && !job.double
    case 'storm':
      return stormOn(s)
    case 'boost':
      return boostReady(s)
    case 'hint':
      return hintLeft(s) > 0 && openHint(s) !== null
  }
}

/** The running catalyst research finishes now. */
export function adFinishResearch(s: GameState, labUid: string): GameState {
  if (!adAvailable(s, 'finish', labUid)) return s
  const r = rewards(s)
  return {
    ...s,
    research: s.research.map(j => (j.lab === labUid ? { ...j, endTick: s.tick } : j)),
    rewards: {
      ...r,
      finishYear: year(s),
      finishCount: (r.finishYear === year(s) ? r.finishCount : 0) + 1,
    },
  }
}
/** The running catalyst research will give double units. */
export function adDoubleResearch(s: GameState, labUid: string): GameState {
  if (!adAvailable(s, 'double', labUid)) return s
  return {
    ...s,
    research: s.research.map(j =>
      j.lab === labUid && j.kind === 'catalyst' ? { ...j, double: true } : j,
    ),
  }
}
export function adSkipStorm(s: GameState): GameState {
  if (!adAvailable(s, 'storm')) return s
  return {
    ...s,
    stormUntil: s.tick,
    log: [...s.log, { tick: s.tick, en: 'Storm cleared early', th: 'พายุผ่านไปเร็วขึ้น' }].slice(
      -B.logLimit,
    ),
  }
}
export function adSellBoost(s: GameState): GameState {
  if (!adAvailable(s, 'boost')) return s
  return { ...s, rewards: { ...rewards(s), boostMonth: monthIndex(s), boostArmed: true } }
}
export function adHint(s: GameState): GameState {
  if (!adAvailable(s, 'hint')) return s
  const hint = openHint(s)!
  const r = rewards(s)
  return {
    ...s,
    formulaLab: { ...s.formulaLab, hints: [...s.formulaLab.hints, hint] },
    rewards: {
      ...r,
      hintYear: year(s),
      hintCount: (r.hintYear === year(s) ? r.hintCount : 0) + 1,
    },
  }
}
