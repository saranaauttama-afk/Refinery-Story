import { bilingual } from '../translations'
import type { BilingualTextValue } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'
import { PRODUCTION_BALANCE } from '../data/balance'

type RoadmapStep = {
  level: number
  unlock: BilingualTextValue
}

const ROADMAP: RoadmapStep[] = [
  { level: 1, unlock: bilingual('Refinery online', 'โรงกลั่นพร้อมใช้งาน') },
  { level: 2, unlock: bilingual('Workers available', 'สามารถจ้างพนักงานได้') },
  { level: 3, unlock: bilingual('Tier 2 Contracts', 'สัญญาระดับ 2') },
  { level: 4, unlock: bilingual('Laboratory', 'ห้องปฏิบัติการ') },
  { level: 5, unlock: bilingual('Tier 3 Contracts', 'สัญญาระดับ 3') },
  { level: 6, unlock: bilingual('Maintenance Workshop', 'โรงซ่อมบำรุง') },
  { level: 7, unlock: bilingual('Sales Office', 'สำนักงานขาย') },
  { level: 8, unlock: bilingual('Reputation Bonus', 'โบนัสชื่อเสียง') },
  { level: 10, unlock: bilingual('Future Expansion', 'การขยายในอนาคต') },
]

type RefineryProgressionPanelProps = {
  refineryLevel: number
}

function RefineryProgressionPanel({ refineryLevel }: RefineryProgressionPanelProps) {
  const speedBonusMs =
    (refineryLevel - 1) * PRODUCTION_BALANCE.refineryUpgradeSpeedStepMs

  // Last roadmap entry whose level is <= current level
  const currentStep =
    [...ROADMAP].reverse().find((s) => s.level <= refineryLevel) ?? ROADMAP[0]

  // First roadmap entry whose level is > current level
  const nextStep = ROADMAP.find((s) => s.level > refineryLevel)

  return (
    <article className="panel refinery-progression-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.refineryProgression.kicker} />
          </p>
          <h2>
            <BilingualText text={text.refineryProgression.title} />
          </h2>
        </div>
        <span className="status-badge">
          <BilingualText text={text.stats.title(refineryLevel)} />
        </span>
      </div>

      {speedBonusMs > 0 && (
        <p className="helper-text">
          <BilingualText text={text.refineryProgression.speedBonus(speedBonusMs)} />
        </p>
      )}

      <p className="refinery-chain-note">
        <BilingualText text={text.refineryProgression.chainExplainer} />
      </p>

      <div className="progression-highlights">
        <div className="progression-highlight-card">
          <span className="progression-highlight-label">
            <BilingualText text={text.refineryProgression.currentLabel} />
          </span>
          <strong>
            <BilingualText text={currentStep.unlock} />
          </strong>
        </div>

        {nextStep ? (
          <div className="progression-highlight-card progression-highlight-next">
            <span className="progression-highlight-label">
              <BilingualText
                text={text.refineryProgression.nextLabel(nextStep.level)}
              />
            </span>
            <strong>
              <BilingualText text={nextStep.unlock} />
            </strong>
          </div>
        ) : (
          <div className="progression-highlight-card">
            <strong>
              <BilingualText text={text.refineryProgression.maxReached} />
            </strong>
          </div>
        )}
      </div>

      <ul className="roadmap-list" aria-label="Refinery level roadmap">
        {ROADMAP.map((step) => {
          const isUnlocked = step.level <= refineryLevel
          const isNext = step === nextStep
          const entryClass = isUnlocked
            ? 'roadmap-entry unlocked'
            : isNext
              ? 'roadmap-entry next'
              : 'roadmap-entry future'

          return (
            <li key={step.level} className={entryClass}>
              <span className="roadmap-marker" aria-hidden="true">
                {isUnlocked ? '✓' : isNext ? '→' : '○'}
              </span>
              <span className="roadmap-level-tag">
                Lv{step.level}
              </span>
              <span className="roadmap-unlock-label">
                <BilingualText text={step.unlock} />
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

export default RefineryProgressionPanel
