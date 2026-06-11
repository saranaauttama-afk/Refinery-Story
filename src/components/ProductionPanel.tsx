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
  onBuyCrudeAmount: (amount: number) => void
  onSellGasolineAmount: (amount: number) => void
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
  onBuyCrudeAmount,
  onSellGasolineAmount,
  onUpgradeRefinery,
}: ProductionPanelProps) {
  const canAfford = Math.floor(money / CRUDE_COST)
  const space = maxCrudeStorage - crudeOil
  const fillAmount = Math.max(0, Math.min(canAfford, space))
  const canBuyAny = fillAmount > 0
  const buyDisabledLabel =
    space <= 0
      ? text.production.buyDisabledTankFull
      : text.production.buyDisabledNoFunds

  const canSellAny = gasoline >= 1

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
          onClick={() => onBuyCrudeAmount(10)}
          disabled={!canBuyAny}
        >
          <BilingualText text={canBuyAny ? text.production.buyCrude10Button : buyDisabledLabel} />
        </button>
        <button
          type="button"
          className="action-button primary"
          onClick={() => onBuyCrudeAmount(50)}
          disabled={!canBuyAny}
        >
          <BilingualText text={canBuyAny ? text.production.buyCrude50Button : buyDisabledLabel} />
        </button>
        <button
          type="button"
          className="action-button primary"
          onClick={() => onBuyCrudeAmount(fillAmount)}
          disabled={!canBuyAny}
        >
          <BilingualText
            text={canBuyAny ? text.production.fillTankButton(fillAmount) : buyDisabledLabel}
          />
        </button>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="action-button"
          onClick={() => onSellGasolineAmount(10)}
          disabled={!canSellAny}
        >
          <BilingualText
            text={canSellAny ? text.production.sellGasoline10Button : text.production.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          onClick={() => onSellGasolineAmount(50)}
          disabled={!canSellAny}
        >
          <BilingualText
            text={canSellAny ? text.production.sellGasoline50Button : text.production.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          onClick={() => onSellGasolineAmount(gasoline)}
          disabled={!canSellAny}
        >
          <BilingualText
            text={canSellAny ? text.production.sellGasolineAllButton(gasoline) : text.production.sellDisabledEmpty}
          />
        </button>
      </div>

      <div className="sell-upgrade-row">
        <p className="helper-text" style={{ margin: 0, alignSelf: 'center' }}>
          <BilingualText
            text={{ en: `$${sellPrice} per gasoline`, th: `$${sellPrice} ต่อหน่วย` }}
          />
        </p>
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
