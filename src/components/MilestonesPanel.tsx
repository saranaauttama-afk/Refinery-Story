import type { ActiveMilestone } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type MilestonesPanelProps = {
  activeMilestones: ActiveMilestone[]
}

function MilestonesPanel({ activeMilestones }: MilestonesPanelProps) {
  const completedCount = activeMilestones.filter((m) => m.isCompleted).length
  const total = activeMilestones.length

  // Show incomplete milestones first, completed ones at the bottom
  const sorted = [...activeMilestones].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0
    return a.isCompleted ? 1 : -1
  })

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
        <span className="status-badge">
          <BilingualText text={text.milestones.progressBadge(completedCount, total)} />
        </span>
      </div>

      <div className="milestones-list">
        {sorted.map((milestone) => (
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
            {milestone.isCompleted && (
              <span className="status-badge active">
                <BilingualText text={text.milestones.completed} />
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MilestonesPanel
