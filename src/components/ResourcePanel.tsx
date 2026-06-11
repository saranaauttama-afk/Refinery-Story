import BilingualText from './BilingualText'
import { text, toAriaLabel } from '../translations'

type ResourcePanelProps = {
  money: number
  researchPoints: number
  reputation: number
  crudeOil: number
  maxCrudeStorage: number
  gasoline: number
  maxGasolineStorage: number
  lubricants: number
  jetFuel: number
  petrochemicals: number
}

function ResourcePanel({
  money,
  researchPoints,
  reputation,
  crudeOil,
  maxCrudeStorage,
  gasoline,
  maxGasolineStorage,
  lubricants,
  jetFuel,
  petrochemicals,
}: ResourcePanelProps) {
  return (
    <section
      className="resource-grid"
      aria-label={toAriaLabel(text.resources.section)}
    >
      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.money} />
        </span>
        <strong>${money.toLocaleString()}</strong>
        <p>
          <BilingualText text={text.resources.moneyDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.research} />
        </span>
        <strong>{researchPoints} RP</strong>
        <p>
          <BilingualText text={text.resources.researchDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.reputation} />
        </span>
        <strong>{reputation}</strong>
        <p>
          <BilingualText text={text.resources.reputationDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.crudeOil} />
        </span>
        <strong>
          {crudeOil}/{maxCrudeStorage}
        </strong>
        <p>
          <BilingualText text={text.resources.crudeDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.gasoline} />
        </span>
        <strong>
          {gasoline}/{maxGasolineStorage}
        </strong>
        <p>
          <BilingualText text={text.resources.gasolineDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.lubricants} />
        </span>
        <strong>{lubricants}</strong>
        <p>
          <BilingualText text={text.resources.lubricantsDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.jetFuel} />
        </span>
        <strong>{jetFuel}</strong>
        <p>
          <BilingualText text={text.resources.jetFuelDescription} />
        </p>
      </article>

      <article className="resource-card">
        <span className="resource-label">
          <BilingualText text={text.resources.petrochemicals} />
        </span>
        <strong>{petrochemicals}</strong>
        <p>
          <BilingualText text={text.resources.petrochemicalsDescription} />
        </p>
      </article>
    </section>
  )
}

export default ResourcePanel
