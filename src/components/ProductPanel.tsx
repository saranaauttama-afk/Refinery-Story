import type { SellableProductConfig } from '../data/products'
import BilingualText from './BilingualText'

type ProductPanelProps = {
  config: SellableProductConfig
  refineryLevel: number
  inventory: number
  sellPrice: number
  plantCount: number
  onSell: (amount: number) => void
}

// Config-driven panel for the three plant-produced, directly-sold products.
// Replaces the near-identical JetFuelPanel / LubricantsPanel / PetrochemicalsPanel.
function ProductPanel({
  config,
  refineryLevel,
  inventory,
  sellPrice,
  plantCount,
  onSell,
}: ProductPanelProps) {
  const { copy, className, unlockLevel, plantUnlockLevel } = config

  if (refineryLevel < unlockLevel) {
    return (
      <section className={`panel ${className} ${className}--locked`}>
        <p className="panel-kicker">
          <BilingualText text={copy.kicker} />
        </p>
        <h2>
          <BilingualText text={copy.title} />
        </h2>
        <p className="product-locked-hint">
          <BilingualText text={copy.lockedMessage(unlockLevel)} />
        </p>
      </section>
    )
  }

  const canSellAny = inventory >= 1
  const plantUnlocked = refineryLevel >= plantUnlockLevel

  return (
    <section className={`panel ${className}`}>
      <p className="panel-kicker">
        <BilingualText text={copy.kicker} />
      </p>
      <h2>
        <BilingualText text={copy.title} />
      </h2>

      <div className="product-inventory">
        <BilingualText text={copy.inventory(inventory)} />
      </div>

      {plantUnlocked && plantCount === 0 && (
        <p className="product-no-plants">
          <BilingualText text={copy.noPlants} />
        </p>
      )}

      <div className="product-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSell(1)}
        >
          <BilingualText text={canSellAny ? copy.sell1Button : copy.sellDisabledEmpty} />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSell(10)}
        >
          <BilingualText text={canSellAny ? copy.sell10Button : copy.sellDisabledEmpty} />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSell(inventory)}
        >
          <BilingualText
            text={canSellAny ? copy.sellAllButton(inventory) : copy.sellDisabledEmpty}
          />
        </button>
      </div>

      <p className="product-price-note helper-text">
        <BilingualText text={copy.priceLabel(sellPrice)} />
      </p>
    </section>
  )
}

export default ProductPanel
