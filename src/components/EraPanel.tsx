import type { EraConfig } from '../types'
import { ERAS } from '../data/eras'
import BilingualText from './BilingualText'
import { text } from '../translations'

type EraPanelProps = {
  currentEra: EraConfig
  nextEra?: EraConfig
  unlockedResearchCount: number
  refineryLevel: number
  gasolineDemandMultiplier: number
  petrochemicalsDemandMultiplier: number
}

function EraPanel({
  currentEra,
  nextEra,
  unlockedResearchCount,
  refineryLevel,
  gasolineDemandMultiplier,
  petrochemicalsDemandMultiplier,
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
          {currentEra.index + 1}/{ERAS.length}
        </span>
      </div>

      <p className="era-tagline">
        <BilingualText text={currentEra.tagline} />
      </p>

      {currentEra.demandShift && (
        <div className="era-demand-shift">
          <p className="era-demand-shift-title">
            <BilingualText text={text.eras.demandShiftTitle} />
          </p>
          <p className="era-demand-shift-description">
            <BilingualText text={text.eras.demandShiftDescription} />
          </p>
          <p className="era-demand-shift-value">
            <BilingualText text={text.eras.gasolineDemand(Math.round(gasolineDemandMultiplier * 100))} />
          </p>
          <p className="era-demand-shift-value">
            <BilingualText
              text={text.eras.petrochemicalsDemand(Math.round(petrochemicalsDemandMultiplier * 100))}
            />
          </p>
        </div>
      )}

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
