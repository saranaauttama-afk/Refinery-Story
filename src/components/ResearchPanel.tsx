import type { ActiveResearchItem, ResearchItem } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ResearchPanelProps = {
  researchPoints: number
  activeResearchItems: ActiveResearchItem[]
  onUnlockResearch: (research: ResearchItem) => void
}

function ResearchPanel({
  researchPoints,
  activeResearchItems,
  onUnlockResearch,
}: ResearchPanelProps) {
  return (
    <section className="panel research-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.research.kicker} />
          </p>
          <h2>
            <BilingualText text={text.research.title} />
          </h2>
        </div>
        <span className="status-badge">
          <BilingualText text={text.research.points(researchPoints)} />
        </span>
      </div>

      <div className="research-list">
        {activeResearchItems.map((item) => {
          const canUnlock = !item.isUnlocked && researchPoints >= item.cost
          const localizedStateLabel = item.isUnlocked
            ? text.research.status.unlocked
            : canUnlock
              ? text.research.status.ready
              : text.research.status.locked

          return (
            <article
              key={item.key}
              className={`research-card ${item.isUnlocked ? 'completed' : ''}`}
            >
              <div className="research-copy">
                <strong>
                  <BilingualText text={item.name} />
                </strong>
                <p>
                  <BilingualText text={text.research.cost(item.cost)} />
                </p>
                {item.prerequisiteName ? (
                <p>
                    <BilingualText text={text.research.requires(item.prerequisiteName)} />
                  </p>
                ) : null}
                <p>
                  <BilingualText text={item.description} />
                </p>
                <p>
                  <BilingualText text={text.research.statusLine(localizedStateLabel)} />
                </p>
              </div>
              <button
                type="button"
                className="action-button"
                onClick={() => onUnlockResearch(item)}
                disabled={!canUnlock}
              >
                <BilingualText
                  text={
                    item.isUnlocked
                      ? text.research.status.unlocked
                      : text.research.unlockButton
                  }
                />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ResearchPanel
