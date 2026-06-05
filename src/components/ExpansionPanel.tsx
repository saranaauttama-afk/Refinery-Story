import { EXPANSION_BALANCE } from '../data/balance'
import type { PaidExpansionEntry } from '../data/balance'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ExpansionPanelProps = {
  gridExpansionLevel: number
  refineryLevel: number
  money: number
  onExpandGrid: () => void
}

function ExpansionPanel({
  gridExpansionLevel,
  refineryLevel,
  money,
  onExpandGrid,
}: ExpansionPanelProps) {
  const currentEntry = EXPANSION_BALANCE[gridExpansionLevel]
  const isMaxExpansion = gridExpansionLevel >= EXPANSION_BALANCE.length - 1

  if (isMaxExpansion) {
    return (
      <article className="panel expansion-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">
              <BilingualText text={text.expansion.kicker} />
            </p>
            <h2>
              <BilingualText text={text.expansion.title} />
            </h2>
          </div>
        </div>
        <p className="helper-text">
          <BilingualText text={text.expansion.currentSize(currentEntry.size)} />
        </p>
        <p className="helper-text">
          <BilingualText text={text.expansion.maxReached} />
        </p>
      </article>
    )
  }

  const nextEntry = EXPANSION_BALANCE[gridExpansionLevel + 1] as PaidExpansionEntry
  const meetsLevelReq = refineryLevel >= nextEntry.requiresRefineryLevel
  const canAfford = money >= nextEntry.cost
  const canExpand = meetsLevelReq && canAfford

  return (
    <article className="panel expansion-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.expansion.kicker} />
          </p>
          <h2>
            <BilingualText text={text.expansion.title} />
          </h2>
        </div>
        {!meetsLevelReq && (
          <span className="status-badge">
            <BilingualText text={text.expansion.locked} />
          </span>
        )}
      </div>

      <div className="expansion-info">
        <p className="helper-text">
          <BilingualText text={text.expansion.currentSize(currentEntry.size)} />
        </p>
        <p className="helper-text">
          <BilingualText text={text.expansion.nextSize(nextEntry.size)} />
        </p>
        {!meetsLevelReq && (
          <p className="helper-text expansion-locked-reason">
            <BilingualText text={text.expansion.requiresLevel(nextEntry.requiresRefineryLevel)} />
          </p>
        )}
      </div>

      <button
        type="button"
        className="action-button accent"
        onClick={onExpandGrid}
        disabled={!canExpand}
      >
        <BilingualText text={text.expansion.expandButton(nextEntry.cost)} />
      </button>
    </article>
  )
}

export default ExpansionPanel
