import { RESEARCH as R, B } from '../../data/balance'
import { pairCompat } from '../../data/compatibility'
import { bases, type BaseId } from '../../data/bases'
import { additives, type AdditiveId } from '../../data/additives'
import { baseAvailable } from './investments'
import { random } from '../rng'
import type { Building, GameState } from '../types'

export const recipeKey = (base: string, additive: string | null) => `${base}:${additive ?? 'none'}`
/** No-additive recipes are always known; pairs must be found in the lab. */
export const recipeKnown = (s: GameState, base: string, additive: string | null) =>
  additive === null || s.knownRecipes.includes(recipeKey(base, additive))
export const labs = (s: GameState) => s.yard.buildings.filter(b => b.defId === 'lab')
export const labJob = (s: GameState, lab: string) => s.research.find(j => j.lab === lab)
/** Unlocked additives whose pair with this base is still unknown. */
export const researchCandidates = (s: GameState, base: BaseId): AdditiveId[] =>
  s.unlockedAdditives.filter(a => !recipeKnown(s, base, a))
/** Each pair already found for a base makes the next project on it bigger. */
export const researchTier = (s: GameState, base: BaseId) =>
  1 + s.knownRecipes.filter(k => k.startsWith(`${base}:`)).length
export const researchCost = (s: GameState, base: BaseId) => {
  const tier = researchTier(s, base)
  return { rd: R.rdBase * tier, money: R.moneyBase * tier }
}
export const researchTicks = (lab: Building) =>
  Math.round(R.weeks * B.ticksPerWeek * Math.max(0.5, 1 - R.fasterPerLevel * (lab.level - 1)))
const labChem = (s: GameState, lab: Building) =>
  s.staff.filter(p => p.assignedTo === lab.uid).reduce((n, p) => n + p.stats.chem, 0)
export const researchChance = (s: GameState, lab: Building, base: BaseId) =>
  Math.min(
    R.chanceMax,
    R.chanceBase +
      R.chancePerLevel * lab.level +
      labChem(s, lab) / R.chemDivisor +
      R.clueBonus * (s.clues[base] ?? 0),
  )
/** Odds of finding a bad / B / A / S pair at this lab level. */
export const researchWeights = (level: number) => {
  const f = Math.max(0, Math.min(1, (level - 1) / 4))
  return R.weightsLv1.map((w, i) => w + (R.weightsLv5[i] - w) * f)
}
const bucket = (base: BaseId, additive: AdditiveId) =>
  ({ S: 3, A: 2, B: 1 })[pairCompat(base, additive) as 'S' | 'A' | 'B'] ?? 0

export type ResearchBlock = 'busy' | 'base' | 'none' | 'rd' | 'money' | null
export function researchBlock(s: GameState, labUid: string, base: BaseId): ResearchBlock {
  if (labJob(s, labUid)) return 'busy'
  if (!baseAvailable(s, base)) return 'base'
  if (!researchCandidates(s, base).length) return 'none'
  const cost = researchCost(s, base)
  if (s.rd < cost.rd) return 'rd'
  if (s.money < cost.money) return 'money'
  return null
}
export function startResearch(s: GameState, labUid: string, base: BaseId): GameState {
  const lab = labs(s).find(b => b.uid === labUid)
  if (!lab || researchBlock(s, labUid, base)) return s
  const cost = researchCost(s, base)
  return {
    ...s,
    rd: s.rd - cost.rd,
    money: s.money - cost.money,
    year: { ...s.year, expenses: s.year.expenses + cost.money },
    monthProfit: s.monthProfit - cost.money,
    research: [...s.research, { lab: labUid, base, endTick: s.tick + researchTicks(lab) }],
  }
}

export function researchSystem(s: GameState): GameState {
  const due = s.research.filter(j => j.endTick <= s.tick)
  if (!due.length) return s
  let next: GameState = { ...s, research: s.research.filter(j => j.endTick > s.tick) }
  for (const job of due) {
    const lab = labs(next).find(b => b.uid === job.lab)
    const name = bases.find(b => b.id === job.base)!.name
    const candidates = researchCandidates(next, job.base)
    if (!lab || !candidates.length) continue
    const [roll, rng1] = random(next.rng)
    next = { ...next, rng: rng1 }
    if (roll >= researchChance(next, lab, job.base)) {
      next = {
        ...next,
        clues: { ...next.clues, [job.base]: (next.clues[job.base] ?? 0) + 1 },
        log: [
          ...next.log,
          {
            tick: s.tick,
            en: `Research on ${name.en}: no recipe yet, but a clue (+${Math.round(R.clueBonus * 100)}% next time)`,
            th: `วิจัย${name.th}ยังไม่พบสูตร แต่ได้เบาะแส (รอบหน้า +${Math.round(R.clueBonus * 100)}%)`,
          },
        ].slice(-B.logLimit),
        popups: [
          ...next.popups,
          { uid: `rs${next.nextId}`, tick: s.tick, x: lab.x, y: lab.y, en: 'Clue', th: 'เบาะแส' },
        ],
        nextId: next.nextId + 1,
      }
      continue
    }
    // Pick the quality bucket by lab level, then an additive inside it.
    const weights = researchWeights(lab.level).map((w, i) =>
      candidates.some(a => bucket(job.base, a) === i) ? w : 0,
    )
    const total = weights.reduce((n, w) => n + w, 0)
    const [r2, rng2] = random(next.rng)
    let pickBucket = 0
    for (let acc = 0, i = 0; i < weights.length; i++) {
      acc += weights[i]
      if (r2 * total < acc) {
        pickBucket = i
        break
      }
    }
    const pool = candidates.filter(a => bucket(job.base, a) === pickBucket)
    const [r3, rng3] = random(rng2)
    const found = pool[Math.floor(r3 * pool.length)]
    const additive = additives.find(a => a.id === found)!.name
    const compat = pairCompat(job.base, found)
    next = {
      ...next,
      rng: rng3,
      knownRecipes: [...next.knownRecipes, recipeKey(job.base, found)],
      fame: next.fame + R.fame[pickBucket],
      unlockHistory: [
        ...next.unlockHistory,
        { tick: s.tick, key: `recipe:${recipeKey(job.base, found)}` },
      ],
      clues: { ...next.clues, [job.base]: 0 },
      log: [
        ...next.log,
        {
          tick: s.tick,
          en: `New recipe: ${name.en} + ${additive.en} (${compat})`,
          th: `สูตรใหม่: ${name.th} + ${additive.th} (${compat})`,
        },
      ].slice(-B.logLimit),
      popups: [
        ...next.popups,
        {
          uid: `rs${next.nextId}`,
          tick: s.tick,
          x: lab.x,
          y: lab.y,
          en: `New recipe ${compat}!`,
          th: `สูตรใหม่ ${compat}!`,
        },
      ],
      nextId: next.nextId + 1,
    }
  }
  return next
}
