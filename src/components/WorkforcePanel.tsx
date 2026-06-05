import type { ActiveWorkerItem } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type WorkforcePanelProps = {
  activeWorkers: ActiveWorkerItem[]
}

function WorkforcePanel({ activeWorkers }: WorkforcePanelProps) {
  const totalStaff = activeWorkers.reduce((sum, w) => sum + w.count, 0)

  return (
    <section className="panel workforce-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.workforce.kicker} />
          </p>
          <h2>
            <BilingualText text={text.workforce.title} />
          </h2>
        </div>
        <span className="status-badge">
          <BilingualText text={text.workforce.totalStaff(totalStaff)} />
        </span>
      </div>

      {totalStaff === 0 ? (
        <p className="helper-text">
          <BilingualText text={text.workforce.noStaff} />
        </p>
      ) : (
        <div className="workforce-list">
          {activeWorkers
            .filter((w) => w.count > 0)
            .map((worker) => (
              <div key={worker.key} className="workforce-row">
                <div className="workforce-identity">
                  <strong>
                    <BilingualText text={worker.name} />
                  </strong>
                  <span className="workforce-count-badge">×{worker.count}</span>
                </div>
                <p className="workforce-bonus">
                  <BilingualText text={worker.description} />
                </p>
              </div>
            ))}
        </div>
      )}
    </section>
  )
}

export default WorkforcePanel
