// Labs: a Catalyst Lab researches graded catalyst stock; a Formula Lab mixes a base or a
// known formula with catalysts into a permanent formula. Rules live in ./formulaLab.
import { FORMULA_LAB as F, B } from '../../data/balance'
import { bases, type BaseId } from '../../data/bases'
import { additives } from '../../data/additives'
import { secretFormulas, synergies, synergyKey } from '../../data/formulaLab'
import { baseAvailable } from './investments'
import { labBonus } from './projects'
import { dateAt } from '../time'
import {
  rollCatalyst,
  mixBlock,
  mixFormula,
  gradeIndex,
  type LabSlice,
  type MixPick,
  type MixBlock,
} from './formulaLab'
import type { Building, GameState } from '../types'

/** Formula Labs (building `lab`): research graded catalysts. */
export const labs = (s: GameState) => s.yard.buildings.filter(b => b.defId === 'lab')
/** Product Labs: develop product cards from a base and catalysts. */
export const productLabs = (s: GameState) => s.yard.buildings.filter(b => b.defId === 'productLab')
export const anyLab = (s: GameState, uid: string) =>
  s.yard.buildings.find(b => b.uid === uid && (b.defId === 'lab' || b.defId === 'productLab'))
export const labJob = (s: GameState, lab: string) => s.research.find(j => j.lab === lab)
export const gameYear = (s: GameState) => dateAt(s.tick).year
/** Lab level for research, including the Research Center project. */
export const labLevel = (s: GameState, lab: Building) => lab.level + labBonus(s)
export const labChem = (s: GameState, lab: Building) =>
  s.staff.filter(p => p.assignedTo === lab.uid).reduce((n, p) => n + p.stats.chem, 0)
const jobTicks = (s: GameState, lab: Building, weeks: number) =>
  Math.round(weeks * B.ticksPerWeek * Math.max(0.5, 1 - F.fasterPerLevel * (labLevel(s, lab) - 1)))
export const catalystTicks = (s: GameState, lab: Building) => jobTicks(s, lab, F.catalyst.weeks)
export const mixTicks = (s: GameState, lab: Building) => jobTicks(s, lab, F.mix.weeks)

const slice = (s: GameState): LabSlice => ({ ...s.formulaLab, rng: s.rng })
const unslice = (s: GameState, { rng, ...formulaLab }: LabSlice): GameState => ({
  ...s,
  rng,
  formulaLab,
})
const pay = (s: GameState, money: number, rd = 0): GameState => ({
  ...s,
  rd: s.rd - rd,
  money: s.money - money,
  year: { ...s.year, expenses: s.year.expenses + money },
  monthProfit: s.monthProfit - money,
})

export const catalystRd = (s: GameState) => F.catalyst.rd + F.catalyst.rdPerYear * (gameYear(s) - 1)
export type CatalystBlock = 'busy' | 'none' | 'rd' | 'money' | null
export function catalystBlock(s: GameState, labUid: string): CatalystBlock {
  const lab = labs(s).find(b => b.uid === labUid)
  if (!lab || labJob(s, labUid)) return 'busy'
  if (!s.unlockedAdditives.length) return 'none'
  if (s.rd < catalystRd(s)) return 'rd'
  if (s.money < F.catalyst.money) return 'money'
  return null
}
export function startCatalyst(s: GameState, labUid: string): GameState {
  const lab = labs(s).find(b => b.uid === labUid)
  if (!lab || catalystBlock(s, labUid)) return s
  const next = pay(s, F.catalyst.money, catalystRd(s))
  return {
    ...next,
    research: [
      ...next.research,
      { lab: labUid, kind: 'catalyst', endTick: s.tick + catalystTicks(s, lab) },
    ],
  }
}

export interface MixRequest {
  base: BaseId
  /** Product card of this base to upgrade; omit for a new product from the plain base. */
  from?: string
  picks: MixPick[]
}
export const mixInput = (s: GameState, lab: Building, m: MixRequest) => ({
  ...m,
  year: gameYear(s),
  level: labLevel(s, lab),
})
export type LabMixBlock = MixBlock | 'busy' | 'base' | 'money'
export function labMixBlock(s: GameState, labUid: string, m: MixRequest): LabMixBlock {
  const lab = productLabs(s).find(b => b.uid === labUid)
  if (!lab || labJob(s, labUid)) return 'busy'
  if (!baseAvailable(s, m.base)) return 'base'
  const block = mixBlock(slice(s), mixInput(s, lab, m))
  if (block) return block
  if (s.money < F.mix.money) return 'money'
  return null
}
/** Catalysts are spent and the grade is rolled now; the result shows when the job ends. */
export function startMix(s: GameState, labUid: string, m: MixRequest): GameState {
  const lab = productLabs(s).find(b => b.uid === labUid)
  if (!lab || labMixBlock(s, labUid, m)) return s
  const r = mixFormula(slice(s), mixInput(s, lab, m))
  if (!r.formula || !r.rolled) return s
  // Keep the formula list as it was until the job finishes.
  const next = unslice(pay(s, F.mix.money), { ...r.state, formulas: s.formulaLab.formulas })
  return {
    ...next,
    research: [
      ...next.research,
      {
        lab: labUid,
        kind: 'mix',
        endTick: s.tick + mixTicks(s, lab),
        formula: r.formula,
        rolled: r.rolled,
      },
    ],
  }
}

const baseName = (id: BaseId) => bases.find(b => b.id === id)!.name
const additiveName = (id: string) => additives.find(a => a.id === id)!.name
export const NAME_MAX = 20
/** Name a product card; an empty name goes back to the automatic one. */
export function renameFormula(s: GameState, key: string, name: string): GameState {
  if (!s.formulaLab.formulas.some(f => f.key === key)) return s
  const clean = name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) || null
  return {
    ...s,
    formulaLab: {
      ...s.formulaLab,
      formulas: s.formulaLab.formulas.map(f => (f.key === key ? { ...f, name: clean } : f)),
    },
  }
}
export const formulaName = (f: {
  base: BaseId
  catalysts: string[]
  secret: string | null
  name?: string | null
}) => {
  if (f.name) return { en: f.name, th: f.name }
  const secret = f.secret && secretFormulas.find(x => x.id === f.secret)
  if (secret) return secret.name
  const b = baseName(f.base)
  const parts = f.catalysts.map(additiveName)
  return {
    en: [b.en, ...parts.map(p => p.en)].join(' + '),
    th: [b.th, ...parts.map(p => p.th)].join(' + '),
  }
}
export function hintText(hint: string) {
  if (hint.startsWith('syn:')) {
    const pair = synergies.find(x => synergyKey(x.a, x.b) === hint.slice(4))!
    const a = additiveName(pair.a),
      b = additiveName(pair.b)
    return {
      en: `${a.en} and ${b.en} seem to work well together…`,
      th: `${a.th} กับ ${b.th} ดูจะเข้ากันดีนะ…`,
    }
  }
  return secretFormulas.find(x => `secret:${x.id}` === hint)!.hint
}

export function researchSystem(s: GameState): GameState {
  const due = s.research.filter(j => j.endTick <= s.tick)
  if (!due.length) return s
  let next: GameState = { ...s, research: s.research.filter(j => j.endTick > s.tick) }
  const say = (lab: Building, en: string, th: string, popEn: string, popTh: string) => {
    next = {
      ...next,
      log: [...next.log, { tick: s.tick, en, th }].slice(-B.logLimit),
      popups: [
        ...next.popups,
        { uid: `rs${next.nextId}`, tick: s.tick, x: lab.x, y: lab.y, en: popEn, th: popTh },
      ],
      nextId: next.nextId + 1,
    }
  }
  for (const job of due) {
    const lab = anyLab(next, job.lab)
    if (!lab) continue
    if (job.kind === 'catalyst') {
      const r = rollCatalyst(slice(next), {
        pool: next.unlockedAdditives,
        level: labLevel(next, lab),
        chem: labChem(next, lab),
        year: gameYear(next),
      })
      next = unslice(next, r.state)
      if (!r.lot) continue
      next = { ...next, fame: next.fame + F.catalyst.fame[r.lot.grade] }
      const n = additiveName(r.lot.additive)
      say(
        lab,
        `Catalyst: ${n.en} ${r.lot.grade} ×${r.lot.units}`,
        `ได้สารเร่ง: ${n.th} เกรด ${r.lot.grade} ×${r.lot.units}`,
        `${r.lot.grade} ${n.en}`,
        `${r.lot.grade} ${n.th}`,
      )
      if (r.hint) {
        const h = hintText(r.hint)
        say(lab, `Lab note: ${h.en}`, `บันทึกแล็บ: ${h.th}`, 'Hint!', 'เบาะแส!')
      }
      continue
    }
    // Mix: the card upgrades in place only if this roll beats its grade now; its name is kept.
    const old = next.formulaLab.formulas.find(f => f.key === job.formula.key)
    const improved = !old || gradeIndex(job.rolled) > gradeIndex(old.grade)
    const formula = improved ? { ...job.formula, grade: job.rolled, name: old?.name ?? null } : old!
    const name = formulaName(formula)
    const newSecret = improved && !!formula.secret && old?.secret !== formula.secret
    next = {
      ...next,
      formulaLab: {
        ...next.formulaLab,
        formulas: old
          ? next.formulaLab.formulas.map(f => (f.key === formula.key ? formula : f))
          : [...next.formulaLab.formulas, formula],
      },
      fame:
        next.fame + (improved ? F.formulaFame[formula.grade] : 0) + (newSecret ? F.secretFame : 0),
      unlockHistory: improved
        ? [...next.unlockHistory, { tick: s.tick, key: `formula:${formula.key}:${formula.grade}` }]
        : next.unlockHistory,
      // A card reveal for new and upgraded products.
      notices: improved
        ? [
            ...next.notices,
            {
              uid: `pn${next.nextId}`,
              kind: 'product' as const,
              product: { key: formula.key, grade: formula.grade, before: old?.grade ?? null },
              en: newSecret ? 'Secret product!' : old ? 'Product upgraded!' : 'New product!',
              th: newSecret ? 'สินค้าสูตรลับ!' : old ? 'อัปเกรดสินค้า!' : 'สินค้าใหม่!',
            },
          ]
        : next.notices,
      nextId: next.nextId + 1,
    }
    if (newSecret)
      say(
        lab,
        `Secret product found: ${name.en} (${formula.grade})!`,
        `ค้นพบสินค้าสูตรลับ: ${name.th} (${formula.grade})!`,
        `Secret ${formula.grade}!`,
        `สูตรลับ ${formula.grade}!`,
      )
    else if (improved)
      say(
        lab,
        `${old ? 'Product upgraded' : 'New product'}: ${name.en} → ${formula.grade}`,
        `${old ? 'อัปเกรดสินค้า' : 'สินค้าใหม่'}: ${name.th} → ${formula.grade}`,
        `${old ? 'Up' : 'New'} ${formula.grade}!`,
        `${old ? 'อัปเกรด' : 'ใหม่'} ${formula.grade}!`,
      )
    else
      say(
        lab,
        `Development came out ${job.rolled}; ${name.en} stays ${formula.grade}`,
        `พัฒนาได้ ${job.rolled} ${name.th} ยังเป็น ${formula.grade} เหมือนเดิม`,
        `${job.rolled}…`,
        `${job.rolled}…`,
      )
  }
  return next
}
