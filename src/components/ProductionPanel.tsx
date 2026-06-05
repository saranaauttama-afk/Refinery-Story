import { CRUDE_COST } from '../utils/gameCalculations'
import type { BilingualTextValue } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ProductionPanelProps = {
  canProcessCrude: boolean
  crudeOil: number
  gasoline: number
  maxCrudeStorage: number
  maxGasolineStorage: number
  money: number
  productionInterval: number
  progressPercent: number
  sellPrice: number
  statusLabel: BilingualTextValue
  upgradeCost: number
  onBuyCrude: () => void
  onSellGasoline: () => void
  onUpgradeRefinery: () => void
}

function ProductionPanel({
  canProcessCrude,
  crudeOil,
  gasoline,
  maxCrudeStorage,
  maxGasolineStorage,
  money,
  productionInterval,
  progressPercent,
  sellPrice,
  statusLabel,
  upgradeCost,
  onBuyCrude,
  onSellGasoline,
  onUpgradeRefinery,
}: ProductionPanelProps) {
  return (
    <article className="panel operation-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.production.kicker} />
          </p>
          <h2>
            <BilingualText text={text.production.title} />
          </h2>
        </div>
        <span className={`status-badge ${canProcessCrude ? 'active' : ''}`}>
          <BilingualText text={statusLabel} />
        </span>
      </div>

      <div className="progress-block" aria-live="polite">
        <div className="progress-meta">
          <span>
            <BilingualText text={text.production.progressLabel} />
          </span>
          <span>
            <BilingualText
              text={
                canProcessCrude
                  ? { en: `${progressPercent.toFixed(0)}%`, th: `${progressPercent.toFixed(0)}%` }
                  : text.production.status.idle
              }
            />
          </span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="helper-text">
          <BilingualText
            text={
              gasoline >= maxGasolineStorage
                ? text.production.helperTankFull
                : crudeOil > 0
                  ? text.production.helperProducing(
                      (productionInterval / 1000).toFixed(2),
                    )
                  : text.production.helperNoCrude
            }
          />
        </p>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="action-button primary"
          onClick={onBuyCrude}
          disabled={money < CRUDE_COST || crudeOil >= maxCrudeStorage}
        >
          <BilingualText text={text.production.buyCrudeButton(CRUDE_COST)} />
        </button>
        <button
          type="button"
          className="action-button"
          onClick={onSellGasoline}
          disabled={gasoline < 1}
        >
          <BilingualText text={text.production.sellGasolineButton(sellPrice)} />
        </button>
        <button
          type="button"
          className="action-button accent"
          onClick={onUpgradeRefinery}
          disabled={money < upgradeCost}
        >
          <BilingualText
            text={text.production.upgradeRefineryButton(upgradeCost)}
          />
        </button>
      </div>
    </article>
  )
}

export default ProductionPanel
