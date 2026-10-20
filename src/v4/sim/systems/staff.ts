import { STAFF as C, B, PRODUCTION } from '../../data/balance'
import { jobs, hiring, trainings, names, type JobId, type TrainingId } from '../../data/staff'
import { additives } from '../../data/additives'
import { random } from '../rng'
import { getModifiers } from './combos'
import type { GameState, Staff } from '../types'
export const staffCap = (s: GameState) => Math.min(C.capMax, C.capStart + s.rank - 1)
export const trainingGain = (base: number, n: number, superUp: boolean) =>
  base * (superUp ? C.superGain : Math.max(0, 1 - n / C.diminish))
export function recruit(s: GameState, method: string): GameState {
  const d = hiring.find(d => d.id === method)
  if (!d || s.money < d.cost || s.rank < d.rank || s.staff.length >= staffCap(s)) return s
  let rng = s.rng
  const draw = () => {
    const [v, r] = random(rng)
    rng = r
    return v
  }
  const candidates: Staff[] = Array.from({ length: C.candidates }, (_, i) => {
    const job = jobs[Math.floor(draw() * (jobs.length - 1))].id
    const stat = () => Math.round((C.statMin + draw() * C.statSpread) * d.quality)
    const maxPower = Math.floor(C.powerMin + draw() * (C.powerMax - C.powerMin + 1))
    return {
      uid: `s${s.nextId + i}`,
      name: names[Math.floor(draw() * names.length)],
      job,
      jobLevels: {
        operator: 0,
        chemist: 0,
        engineer: 0,
        safety: 0,
        manager: 0,
        director: 0,
        [job]: 1,
      },
      stats: { op: stat(), chem: stat(), mech: stat(), safe: stat() },
      power: maxPower,
      maxPower,
      salary: Math.round(C.salaryMin + draw() * C.salaryRange),
      trainingCounts: {},
      assignedTo: null,
      resting: false,
    }
  })
  return { ...s, money: s.money - d.cost, candidates, rng, nextId: s.nextId + C.candidates }
}
export function hire(s: GameState, uid: string): GameState {
  const p = s.candidates.find(p => p.uid === uid)
  if (!p || s.staff.length >= staffCap(s)) return s
  return { ...s, staff: [...s.staff, p], candidates: [] }
}
export function assign(s: GameState, uid: string, building: string | null): GameState {
  if (
    !s.staff.some(p => p.uid === uid) ||
    (building && !s.yard.buildings.some(b => b.uid === building))
  )
    return s
  return {
    ...s,
    staff: s.staff.map(p => (p.uid === uid ? { ...p, assignedTo: building } : p)),
    yard: {
      ...s.yard,
      buildings: s.yard.buildings.map(b => ({
        ...b,
        staff: [...b.staff.filter(id => id !== uid), ...(b.uid === building ? [uid] : [])],
      })),
    },
  }
}
export function fire(s: GameState, uid: string): GameState {
  const p = s.staff.find(p => p.uid === uid)
  if (!p) return s
  const next = assign(s, uid, null)
  return {
    ...next,
    staff: next.staff.filter(p => p.uid !== uid),
    firedStaff: [...next.firedStaff, { ...p, assignedTo: null }],
  }
}
export function rehire(s: GameState, uid: string): GameState {
  const p = s.firedStaff.find(p => p.uid === uid)
  if (!p || s.money < hiring[0].cost || s.staff.length >= staffCap(s)) return s
  return {
    ...s,
    money: s.money - hiring[0].cost,
    staff: [...s.staff, p],
    firedStaff: s.firedStaff.filter(p => p.uid !== uid),
  }
}
export function train(s: GameState, uid: string, training: TrainingId): GameState {
  const p = s.staff.find(p => p.uid === uid),
    d = trainings.find(t => t.id === training)
  if (!p || !d || s.rank < d.rank || p.power < d.power || s.money < d.cost) return s
  const [r, rng] = random(s.rng),
    superUp = r < C.superChance,
    n = p.trainingCounts[training] ?? 0
  const stats = { ...p.stats }
  for (const key of ['op', 'chem', 'mech', 'safe'] as const)
    stats[key] = Math.max(0, stats[key] + trainingGain(d[key], n, superUp))
  const trained = {
    ...p,
    stats,
    power: p.power - d.power,
    trainingCounts: { ...p.trainingCounts, [training]: n + 1 },
  }
  const unlocked = additives
    .filter(a => a.job === p.job && p.jobLevels[p.job] >= a.level && a.training === training)
    .map(a => a.id)
  return {
    ...s,
    money: s.money - d.cost,
    rng,
    staff: s.staff.map(v => (v.uid === uid ? trained : v)),
    unlockedAdditives: [...new Set([...s.unlockedAdditives, ...unlocked])],
    log: [
      ...s.log,
      {
        tick: s.tick,
        en: superUp ? 'Super Up!' : 'Training complete',
        th: superUp ? 'Super Up!' : 'ฝึกอบรมสำเร็จ',
      },
    ].slice(-B.logLimit),
  }
}
export function levelUp(s: GameState, uid: string): GameState {
  const p = s.staff.find(p => p.uid === uid)
  if (!p) return s
  const target = p.jobLevels[p.job] + 1,
    cost = C.levelRDCost[target - 1] ?? C.levelRD * target
  if (target > C.levelMax || s.rd < cost) return s
  return {
    ...s,
    rd: s.rd - cost,
    staff: s.staff.map(v =>
      v.uid === uid
        ? {
            ...v,
            jobLevels: { ...v.jobLevels, [v.job]: target },
            salary: v.salary * C.salaryGrowth,
          }
        : v,
    ),
  }
}
export const canDirect = (p: Staff) =>
  p.jobLevels.manager >= C.levelMax && p.jobLevels.chemist >= C.levelMax
export function buyManual(s: GameState): GameState {
  if (s.merchantUntil <= s.tick || s.money < C.manualCost) return s
  return { ...s, money: s.money - C.manualCost, careerManuals: s.careerManuals + 1 }
}
export function changeJob(s: GameState, uid: string, job: JobId): GameState {
  const p = s.staff.find(p => p.uid === uid)
  if (
    !p ||
    p.job === job ||
    s.careerManuals < 1 ||
    (job === 'director' && (!canDirect(p) || s.rank < 8))
  )
    return s
  return {
    ...s,
    careerManuals: s.careerManuals - 1,
    staff: s.staff.map(v =>
      v.uid === uid
        ? { ...v, job, jobLevels: { ...v.jobLevels, [job]: Math.max(1, v.jobLevels[job]) } }
        : v,
    ),
  }
}
export function staffSystem(s: GameState): GameState {
  if (s.tick % PRODUCTION.cycle !== 0) return s
  const regen =
    (s.yard.buildings.some(b => b.defId === 'canteen') ? C.restGain : C.restWithoutCanteen) *
    (1 + getModifiers(s).regen)
  return {
    ...s,
    staff: s.staff.map(p => {
      if (!p.assignedTo || p.resting) {
        const power = Math.min(p.maxPower, p.power + regen)
        return { ...p, power, resting: power < p.maxPower }
      }
      const power = Math.max(0, p.power - C.workDrain)
      return { ...p, power, resting: power === 0 }
    }),
  }
}
export function staffStats(s: GameState) {
  return s.staff
    .filter(
      p =>
        p.assignedTo &&
        !p.resting &&
        p.power > 0 &&
        s.yard.buildings.some(
          b =>
            b.uid === p.assignedTo &&
            ['cdu', 'hydro', 'reformer', 'cracker', 'blend', 'tower'].includes(b.defId),
        ),
    )
    .reduce(
      (n, p) => ({
        purity: n.purity + p.stats.chem,
        yield: n.yield + p.stats.op,
        stability: n.stability + p.stats.mech,
        eco: n.eco + p.stats.safe,
      }),
      { purity: 0, yield: 0, stability: 0, eco: 0 },
    )
}
