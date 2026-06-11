import BilingualText from './BilingualText'
import { JET_FUEL_BALANCE, JET_FUEL_PLANT_BALANCE } from '../data/balance'
import { text } from '../translations'

type JetFuelPanelProps = {
  refineryLevel: number
  jetFuel: number
  jetFuelSellPrice: number
  jetFuelPlantCount: number
  onSellJetFuel: (amount: number) => void
}

function JetFuelPanel({
  refineryLevel,
  jetFuel,
  jetFuelSellPrice,
  jetFuelPlantCount,
  onSellJetFuel,
}: JetFuelPanelProps) {
  const isUnlocked = refineryLevel >= JET_FUEL_BALANCE.unlockLevel

  if (!isUnlocked) {
    return (
      <section className="panel jetfuel-panel jetfuel-panel--locked">
        <p className="panel-kicker">
          <BilingualText text={text.jetFuel.kicker} />
        </p>
        <h2>
          <BilingualText text={text.jetFuel.title} />
        </h2>
        <p className="jetfuel-locked-hint">
          <BilingualText text={text.jetFuel.lockedMessage(JET_FUEL_BALANCE.unlockLevel)} />
        </p>
      </section>
    )
  }

  const canSellAny = jetFuel >= 1
  const plantUnlocked = refineryLevel >= JET_FUEL_PLANT_BALANCE.unlockLevel

  return (
    <section className="panel jetfuel-panel">
      <p className="panel-kicker">
        <BilingualText text={text.jetFuel.kicker} />
      </p>
      <h2>
        <BilingualText text={text.jetFuel.title} />
      </h2>

      <div className="jetfuel-inventory">
        <BilingualText text={text.jetFuel.inventory(jetFuel)} />
      </div>

      {plantUnlocked && jetFuelPlantCount === 0 && (
        <p className="jetfuel-no-plants">
          <BilingualText text={text.jetFuel.noPlants} />
        </p>
      )}

      <div className="jetfuel-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellJetFuel(1)}
        >
          <BilingualText
            text={canSellAny ? text.jetFuel.sell1Button : text.jetFuel.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellJetFuel(10)}
        >
          <BilingualText
            text={canSellAny ? text.jetFuel.sell10Button : text.jetFuel.sellDisabledEmpty}
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canSellAny}
          onClick={() => onSellJetFuel(jetFuel)}
        >
          <BilingualText
            text={
              canSellAny
                ? text.jetFuel.sellAllButton(jetFuel)
                : text.jetFuel.sellDisabledEmpty
            }
          />
        </button>
      </div>

      <p className="jetfuel-price-note helper-text">
        <BilingualText text={text.jetFuel.priceLabel(jetFuelSellPrice)} />
      </p>
    </section>
  )
}

export default JetFuelPanel
