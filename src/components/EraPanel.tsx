import type { EraConfig } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type EraPanelProps = {
  currentEra: EraConfig
  nextEra?: EraConfig
  unlockedResearchCount: number
  refineryLevel: number
}

function EraPanel({
  currentEra,
  nextEra,
  unlockedResearchCount,
  refineryLevel,
}: EraPanelProps) {
  return (
    <section className="panel era-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.eras.kicker} />
          </p>
          <h2>
            <BilingualText text={currentEra.name} />
          </h2>
        </div>
        <span className={`era-badge era-badge--${currentEra.key}`}>
          {currentEra.index + 1}/3
        </span>
      </div>

      <p className="era-tagline">
        <BilingualText text={currentEra.tagline} />
      </p>

      {nextEra ? (
        <div className="era-next">
          <p className="era-next-label">
            <BilingualText text={text.eras.nextLabel} />: <BilingualText text={nextEra.name} />
          </p>
          <p className="era-next-req">
            <BilingualText
              text={text.eras.requirement(nextEra.requiredResearch, nextEra.requiredLevel)}
            />
          </p>
          <div className="era-progress-rows">
            <EraProgressRow
              label="Research"
              current={unlockedResearchCount}
              target={nextEra.requiredResearch}
            />
            <EraProgressRow
              label="Level"
              current={refineryLevel}
              target={nextEra.requiredLevel}
            />
          </div>
        </div>
      ) : (
        <p className="era-max">
          <BilingualText text={text.eras.maxReached} />
        </p>
      )}
    </section>
  )
}

function EraProgressRow({
  label,
  current,
  target,
}: {
  label: string
  current: number
  target: number
}) {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100))
  const met = current >= target
  return (
    <div className="era-progress-row">
      <span className="era-progress-label">{label}</span>
      <div className="era-progress-track">
        <div
          className={`era-progress-fill ${met ? 'met' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="era-progress-count">
        {current}/{target}
      </span>
    </div>
  )
}

export default EraPanel
