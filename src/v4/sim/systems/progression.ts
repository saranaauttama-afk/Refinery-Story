import { FEATURE_RANK, featureIntro, type FeatureId } from '../../data/features'
import { unlockName } from '../../i18nLabels'
import { ranks } from '../../data/ranks'
import { buildings } from '../../data/buildings'
import { B, PROGRESSION as P } from '../../data/balance'
import { createNewGame } from '../state'
import { dateAt } from '../time'
import type { GameState } from '../types'
export function progression(s: GameState): GameState {
  const rank = ranks.filter(r => s.fame >= r.fame).at(-1)!.rank
  if (rank <= s.rank) return s
  // New systems switching on at these ranks get a one-line intro in the notice.
  const intros = (Object.keys(FEATURE_RANK) as FeatureId[])
    .filter(id => FEATURE_RANK[id] > s.rank && FEATURE_RANK[id] <= rank)
    .map(id => featureIntro[id])
  const unlocked = ranks.filter(r => r.rank > s.rank && r.rank <= rank).flatMap(r => r.unlocks),
    notice = {
      uid: `rank${rank}`,
      kind: 'rank' as const,
      en: `Rank ${rank}! ${unlocked.map(id => unlockName(id).en).join(', ')}${intros.map(i => `\n• ${i.en}`).join('')}`,
      th: `แรงก์ ${rank}! ปลดล็อก ${unlocked.map(id => unlockName(id).th).join(', ')}${intros.map(i => `\n• ${i.th}`).join('')}`,
    }
  return {
    ...s,
    rank,
    candidates:
      rank === 10
        ? [
            ...s.candidates,
            {
              uid: 'mascot',
              name: 'น้องโรงกลั่น',
              job: 'director',
              jobLevels: {
                operator: 5,
                chemist: 5,
                engineer: 5,
                safety: 5,
                manager: 5,
                director: 1,
              },
              stats: { op: 80, chem: 80, mech: 80, safe: 80 },
              salary: 8000,
              power: 30,
              maxPower: 30,
              trainingCounts: {},
              assignedTo: null,
              resting: false,
            },
          ]
        : s.candidates,
    unlockHistory: [...s.unlockHistory, ...unlocked.map(key => ({ tick: s.tick, key }))],
    notices: [...s.notices, notice],
    log: [
      ...s.log,
      { tick: s.tick, en: notice.en.split('\n')[0], th: notice.th.split('\n')[0] },
    ].slice(-B.logLimit),
  }
}
export function newGamePlus(s: GameState): GameState {
  if (dateAt(s.tick).year < P.finalYear || s.evaluation === null) return s
  const next = createNewGame(s.seed + 1)
  return {
    ...next,
    carriedBuildings: Object.fromEntries(
      buildings
        .filter(b => b.rank <= s.rank || s.blueprints.includes(b.id) || s.decos.includes(b.id))
        .map(b => [b.id, 1]),
    ),
  }
}
export const dismissNotice = (s: GameState, uid: string): GameState => ({
  ...s,
  notices: s.notices.filter(n => n.uid !== uid),
})
