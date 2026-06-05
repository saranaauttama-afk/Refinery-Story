import BilingualText from './BilingualText'
import { text } from '../translations'

type StatsPanelProps = {
  refineryLevel: number
  productionRate: number
  sellPrice: number
  maxCrudeStorage: number
  maxGasolineStorage: number
  availableSpace: number
}

function StatsPanel({
  refineryLevel,
  productionRate,
  sellPrice,
  maxCrudeStorage,
  maxGasolineStorage,
  availableSpace,
}: StatsPanelProps) {
  return (
    <article className="panel upgrade-panel">
      <p className="panel-kicker">
        <BilingualText text={text.stats.kicker} />
      </p>
      <h2>
        <BilingualText text={text.stats.title(refineryLevel)} />
      </h2>
      <p className="upgrade-value">{productionRate.toFixed(2)}/s</p>
      <p className="helper-text">
        <BilingualText text={text.stats.helper} />
      </p>

      <dl className="stats-list">
        <div>
          <dt>
            <BilingualText text={text.stats.productionRate} />
          </dt>
          <dd>
            <BilingualText
              text={text.stats.productionRateValue(productionRate.toFixed(2))}
            />
          </dd>
        </div>
        <div>
          <dt>
            <BilingualText text={text.stats.sellPrice} />
          </dt>
          <dd>${sellPrice}</dd>
        </div>
        <div>
          <dt>
            <BilingualText text={text.stats.maxCrude} />
          </dt>
          <dd>{maxCrudeStorage}</dd>
        </div>
        <div>
          <dt>
            <BilingualText text={text.stats.maxGasoline} />
          </dt>
          <dd>{maxGasolineStorage}</dd>
        </div>
        <div>
          <dt>
            <BilingualText text={text.stats.openCells} />
          </dt>
          <dd>{availableSpace}</dd>
        </div>
      </dl>
    </article>
  )
}

export default StatsPanel
