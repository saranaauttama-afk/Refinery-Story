import type { ActiveMilestone } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type MilestonesPanelProps = {
  activeMilestones: ActiveMilestone[]
}

function MilestonesPanel({ activeMilestones }: MilestonesPanelProps) {
  return (
    <section className="panel milestones-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.milestones.kicker} />
          </p>
          <h2>
            <BilingualText text={text.milestones.title} />
          </h2>
        </div>
      </div>

      <div className="milestones-list">
        {activeMilestones.map((milestone) => (
          <article
            key={milestone.key}
            className={`milestone-card ${milestone.isCompleted ? 'completed' : ''}`}
          >
            <div className="milestone-copy">
              <strong>
                <BilingualText text={milestone.name} />
              </strong>
              <p>
                <BilingualText text={milestone.requirement} />
              </p>
              <p>
                <BilingualText text={text.milestones.rewardLabel(milestone.reward)} />
              </p>
            </div>
            <span className="status-badge">
              <BilingualText
                text={
                  milestone.isCompleted
                    ? text.milestones.completed
                    : text.milestones.inProgress
                }
              />
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MilestonesPanel
