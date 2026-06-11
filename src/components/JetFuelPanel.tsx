import BilingualText from './BilingualText'
import { JET_FUEL_BALANCE } from '../data/balance'
import { text } from '../translations'

// All jet fuel contract IDs. When every one is in completedContractIds the panel
// collapses its production controls — there is no remaining demand for jet fuel.
const JET_FUEL_CONTRACT_IDS = [19, 20]

type JetFuelPanelProps = {
  refineryLevel: number
  jetFuel: number
  crudeOil: number
  completedContractIds: number[]
  onProduceJetFuel: (amount: number) => void
}

function JetFuelPanel({ refineryLevel, jetFuel, crudeOil, completedContractIds, onProduceJetFuel }: JetFuelPanelProps) {
  const isUnlocked = refineryLevel >= JET_FUEL_BALANCE.unlockLevel
  const { batchSize, largeBatchSize, maxStorage } = JET_FUEL_BALANCE

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

  const allContractsDone = JET_FUEL_CONTRACT_IDS.every((id) =>
    completedContractIds.includes(id),
  )

  if (allContractsDone) {
    return (
      <section className="panel jetfuel-panel jetfuel-panel--done">
        <p className="panel-kicker">
          <BilingualText text={text.jetFuel.kicker} />
        </p>
        <h2>
          <BilingualText text={text.jetFuel.title} />
        </h2>
        <p className="jetfuel-done-message">
          <BilingualText text={text.jetFuel.allContractsDone} />
        </p>
        {jetFuel > 0 && (
          <div className="jetfuel-inventory">
            <BilingualText text={text.jetFuel.inventory(jetFuel, maxStorage)} />
          </div>
        )}
      </section>
    )
  }

  const isFull = jetFuel >= maxStorage
  const spaceRemaining = maxStorage - jetFuel

  const canProduceSmall = crudeOil >= batchSize && !isFull
  const canProduceLarge = crudeOil >= largeBatchSize && spaceRemaining >= largeBatchSize

  return (
    <section className="panel jetfuel-panel">
      <p className="panel-kicker">
        <BilingualText text={text.jetFuel.kicker} />
      </p>
      <h2>
        <BilingualText text={text.jetFuel.title} />
      </h2>

      <p className="jetfuel-hint">
        <BilingualText text={text.jetFuel.hint} />
      </p>

      <div className="jetfuel-inventory">
        <BilingualText text={text.jetFuel.inventory(jetFuel, maxStorage)} />
        <span className="jetfuel-crude-available">
          {'  ·  '}
          <BilingualText text={text.jetFuel.crudeAvailable(crudeOil)} />
        </span>
      </div>

      <div className="jetfuel-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canProduceSmall}
          onClick={() => onProduceJetFuel(batchSize)}
        >
          <BilingualText
            text={
              isFull
                ? text.jetFuel.disabledFull
                : !canProduceSmall
                  ? text.jetFuel.disabledNoCrude(batchSize)
                  : text.jetFuel.produceButton(batchSize)
            }
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canProduceLarge}
          onClick={() => onProduceJetFuel(largeBatchSize)}
        >
          <BilingualText
            text={
              isFull
                ? text.jetFuel.disabledFull
                : !canProduceLarge
                  ? text.jetFuel.disabledNoCrude(largeBatchSize)
                  : text.jetFuel.produceButton(largeBatchSize)
            }
          />
        </button>
      </div>
    </section>
  )
}

export default JetFuelPanel
