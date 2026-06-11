import BilingualText from './BilingualText'
import { LUBRICANT_PLANT_BALANCE } from '../data/balance'
import { text } from '../translations'

type LubricantsPanelProps = {
  refineryLevel: number
  lubricants: number
  lubricantSellPrice: number
  lubricantPlantCount: number
  onSellLubricants: (amount: number) => void
}

function LubricantsPanel({
  refineryLevel,
  lubricants,
  lubricantSellPrice,
  lubricantPlantCount,
  onSellLubricants,
}: LubricantsPanelProps) {
  const isUnlocked = refineryLevel >= LUBRICANT_PLANT_BALANCE.unlockLevel

  if (!isUnlocked) {
    return (
      <section className="panel lubricants-panel lubricants-panel--locked">
        <p className="panel-kicker">
          <BilingualText text={text.lubricants.kicker} />
        </p>
        <h2>
          <BilingualText text={text.lubricants.title} />
        </h2>
        <p className="lubricants-locked-hint">
          <BilingualText text={text.lubricants.lockedMessage(LUBRICANT_PLANT_BALANCE.unlockLevel)} />
        </p>
      </section>
    )
  }

  const canSellAny = lubricants >= 1

  return (
    <section className="panel lubricants-panel">
      <p className="panel-kicker">
        <BilingualText text={text.lubricants.kicker} />
      </p>
      <h2>
        <BilingualText text={text.lubricants.title} />
      </h2>

      <div className="lubricants-inventory">
        <BilingualText text={text.lubricants.inventory(lubricants)} />
      </div>

      {lubricantPlantCount === 0 && (
        <p className="lubricants-no-plants">
          <BilingualText text={text.lubricants.noPlants} />
        </p>
      )}

      <div className="lubricants-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellLubricants(1)}
        >
          <BilingualText
            text={canSellAny ? text.lubricants.sell1Button : text.lubricants.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellLubricants(10)}
        >
          <BilingualText
            text={canSellAny ? text.lubricants.sell10Button : text.lubricants.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellLubricants(lubricants)}
        >
          <BilingualText
            text={
              canSellAny
                ? text.lubricants.sellAllButton(lubricants)
                : text.lubricants.sellDisabledEmpty
            }
          />
        </button>
      </div>

      <p className="lubricants-price-note helper-text">
        <BilingualText text={text.lubricants.priceLabel(lubricantSellPrice)} />
      </p>
    </section>
  )
}

export default LubricantsPanel
