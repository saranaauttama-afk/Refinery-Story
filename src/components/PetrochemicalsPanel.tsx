import BilingualText from './BilingualText'
import { PETROCHEMICAL_PLANT_BALANCE } from '../data/balance'
import { text } from '../translations'

type PetrochemicalsPanelProps = {
  refineryLevel: number
  petrochemicals: number
  petrochemicalsSellPrice: number
  petrochemicalPlantCount: number
  onSellPetrochemicals: (amount: number) => void
}

function PetrochemicalsPanel({
  refineryLevel,
  petrochemicals,
  petrochemicalsSellPrice,
  petrochemicalPlantCount,
  onSellPetrochemicals,
}: PetrochemicalsPanelProps) {
  const isUnlocked = refineryLevel >= PETROCHEMICAL_PLANT_BALANCE.unlockLevel

  if (!isUnlocked) {
    return (
      <section className="panel petrochemicals-panel petrochemicals-panel--locked">
        <p className="panel-kicker">
          <BilingualText text={text.petrochemicals.kicker} />
        </p>
        <h2>
          <BilingualText text={text.petrochemicals.title} />
        </h2>
        <p className="petrochemicals-locked-hint">
          <BilingualText text={text.petrochemicals.lockedMessage(PETROCHEMICAL_PLANT_BALANCE.unlockLevel)} />
        </p>
      </section>
    )
  }

  const canSellAny = petrochemicals >= 1

  return (
    <section className="panel petrochemicals-panel">
      <p className="panel-kicker">
        <BilingualText text={text.petrochemicals.kicker} />
      </p>
      <h2>
        <BilingualText text={text.petrochemicals.title} />
      </h2>

      <div className="petrochemicals-inventory">
        <BilingualText text={text.petrochemicals.inventory(petrochemicals)} />
      </div>

      {petrochemicalPlantCount === 0 && (
        <p className="petrochemicals-no-plants">
          <BilingualText text={text.petrochemicals.noPlants} />
        </p>
      )}

      <div className="petrochemicals-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellPetrochemicals(1)}
        >
          <BilingualText
            text={canSellAny ? text.petrochemicals.sell1Button : text.petrochemicals.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellPetrochemicals(10)}
        >
          <BilingualText
            text={canSellAny ? text.petrochemicals.sell10Button : text.petrochemicals.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellPetrochemicals(petrochemicals)}
        >
          <BilingualText
            text={
              canSellAny
                ? text.petrochemicals.sellAllButton(petrochemicals)
                : text.petrochemicals.sellDisabledEmpty
            }
          />
        </button>
      </div>

      <p className="petrochemicals-price-note helper-text">
        <BilingualText text={text.petrochemicals.priceLabel(petrochemicalsSellPrice)} />
      </p>
    </section>
  )
}

export default PetrochemicalsPanel
