import type { BilingualTextValue } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

const REFINERY_LEVEL_TARGET = 10
const REPUTATION_TARGET = 250

type GoalPanelProps = {
  refineryLevel: number
  reputation: number
  petrochemicalDone: boolean
  gridExpansionLevel: number
  isComplete: boolean
}

type GoalItemProps = {
  label: BilingualTextValue
  isDone: boolean
}

function GoalItem({ label, isDone }: GoalItemProps) {
  return (
    <div className={`goal-item ${isDone ? 'done' : ''}`}>
      <span className="goal-item-check" aria-hidden="true">
        {isDone ? '✓' : '○'}
      </span>
      <span className="goal-item-label">
        <BilingualText text={label} />
      </span>
      <span className={`goal-item-status ${isDone ? 'done' : ''}`}>
        <BilingualText text={isDone ? text.goal.done : text.goal.notDone} />
      </span>
    </div>
  )
}

function GoalPanel({
  refineryLevel,
  reputation,
  petrochemicalDone,
  gridExpansionLevel,
  isComplete,
}: GoalPanelProps) {
  const levelDone = refineryLevel >= REFINERY_LEVEL_TARGET
  const reputationDone = reputation >= REPUTATION_TARGET
  const expansionDone = gridExpansionLevel >= 2

  return (
    <article className={`panel goal-panel ${isComplete ? 'complete' : ''}`}>
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.goal.kicker} />
          </p>
          <h2>
            <BilingualText text={text.goal.title} />
          </h2>
        </div>
        {isComplete && (
          <span className="status-badge active">
            <BilingualText text={text.goal.done} />
          </span>
        )}
      </div>

      <div className="goal-list">
        <GoalItem
          label={text.goal.refineryLevelItem(
            Math.min(refineryLevel, REFINERY_LEVEL_TARGET),
            REFINERY_LEVEL_TARGET,
          )}
          isDone={levelDone}
        />
        <GoalItem
          label={text.goal.reputationItem(
            Math.min(reputation, REPUTATION_TARGET),
            REPUTATION_TARGET,
          )}
          isDone={reputationDone}
        />
        <GoalItem label={text.goal.contractItem} isDone={petrochemicalDone} />
        <GoalItem label={text.goal.expansionItem} isDone={expansionDone} />
      </div>

      {isComplete && (
        <p className="goal-complete-message">
          <BilingualText text={text.goal.allDone} />
        </p>
      )}
    </article>
  )
}

export default GoalPanel
