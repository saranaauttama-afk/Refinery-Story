import BilingualText from './BilingualText'
import { ASPHALT_BALANCE } from '../data/balance'
import { text } from '../translations'

// All asphalt contract IDs. When every one is in completedContractIds the panel
// collapses its production controls — there is no remaining demand for asphalt.
const ASPHALT_CONTRACT_IDS = [17, 18]

type AsphaltPanelProps = {
  refineryLevel: number
  asphalt: number
  crudeOil: number
  completedContractIds: number[]
  onProduceAsphalt: (amount: number) => void
}

function AsphaltPanel({ refineryLevel, asphalt, crudeOil, completedContractIds, onProduceAsphalt }: AsphaltPanelProps) {
  const isUnlocked = refineryLevel >= ASPHALT_BALANCE.unlockLevel
  const { batchSize, largeBatchSize, maxStorage } = ASPHALT_BALANCE

  if (!isUnlocked) {
    return (
      <section className="panel asphalt-panel asphalt-panel--locked">
        <p className="panel-kicker">
          <BilingualText text={text.asphalt.kicker} />
        </p>
        <h2>
          <BilingualText text={text.asphalt.title} />
        </h2>
        <p className="asphalt-locked-hint">
          <BilingualText text={text.asphalt.lockedMessage(ASPHALT_BALANCE.unlockLevel)} />
        </p>
      </section>
    )
  }

  const allContractsDone = ASPHALT_CONTRACT_IDS.every((id) =>
    completedContractIds.includes(id),
  )

  if (allContractsDone) {
    return (
      <section className="panel asphalt-panel asphalt-panel--done">
        <p className="panel-kicker">
          <BilingualText text={text.asphalt.kicker} />
        </p>
        <h2>
          <BilingualText text={text.asphalt.title} />
        </h2>
        <p className="asphalt-done-message">
          <BilingualText text={text.asphalt.allContractsDone} />
        </p>
        {asphalt > 0 && (
          <div className="asphalt-inventory">
            <BilingualText text={text.asphalt.inventory(asphalt, maxStorage)} />
          </div>
        )}
      </section>
    )
  }

  const isFull = asphalt >= maxStorage
  const spaceRemaining = maxStorage - asphalt

  const canProduceSmall = crudeOil >= batchSize && !isFull
  const canProduceLarge = crudeOil >= largeBatchSize && spaceRemaining >= largeBatchSize

  return (
    <section className="panel asphalt-panel">
      <p className="panel-kicker">
        <BilingualText text={text.asphalt.kicker} />
      </p>
      <h2>
        <BilingualText text={text.asphalt.title} />
      </h2>

      <p className="asphalt-hint">
        <BilingualText text={text.asphalt.hint} />
      </p>

      <div className="asphalt-inventory">
        <BilingualText text={text.asphalt.inventory(asphalt, maxStorage)} />
        <span className="asphalt-crude-available">
          {'  ·  '}
          <BilingualText text={text.asphalt.crudeAvailable(crudeOil)} />
        </span>
      </div>

      <div className="asphalt-controls">
        <button
          type="button"
          className="action-button"
          disabled={!canProduceSmall}
          onClick={() => onProduceAsphalt(batchSize)}
        >
          <BilingualText
            text={
              isFull
                ? text.asphalt.disabledFull
                : !canProduceSmall
                  ? text.asphalt.disabledNoCrude(batchSize)
                  : text.asphalt.produceButton(batchSize)
            }
          />
        </button>
        <button
          type="button"
          className="action-button"
          disabled={!canProduceLarge}
          onClick={() => onProduceAsphalt(largeBatchSize)}
        >
          <BilingualText
            text={
              isFull
                ? text.asphalt.disabledFull
                : !canProduceLarge
                  ? text.asphalt.disabledNoCrude(largeBatchSize)
                  : text.asphalt.produceButton(largeBatchSize)
            }
          />
        </button>
      </div>
    </section>
  )
}

export default AsphaltPanel
