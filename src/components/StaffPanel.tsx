import type { ActiveWorkerItem, WorkerConfig } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type StaffPanelProps = {
  money: number
  refineryLevel: number
  activeWorkers: ActiveWorkerItem[]
  onHireWorker: (worker: WorkerConfig) => void
}

function StaffPanel({ money, refineryLevel, activeWorkers, onHireWorker }: StaffPanelProps) {
  return (
    <section className="panel staff-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.staff.kicker} />
          </p>
          <h2>
            <BilingualText text={text.staff.title} />
          </h2>
        </div>
      </div>

      <div className="staff-list">
        {activeWorkers.map((worker) => {
          const isLocked = !!(worker.unlockLevel && refineryLevel < worker.unlockLevel)
          return (
            <article key={worker.key} className={`staff-card${isLocked ? ' locked' : ''}`}>
              <div className="staff-copy">
                <strong>
                  <BilingualText text={worker.name} />{' '}
                  {isLocked && (
                    <span className="staff-lock-badge">
                      <BilingualText text={text.staff.locked} />
                    </span>
                  )}
                </strong>
                <p>
                  <BilingualText text={text.staff.count(worker.count)} />
                </p>
                <p>
                  <BilingualText text={text.staff.cost(worker.cost)} />
                </p>
                <p>
                  <BilingualText text={worker.description} />
                </p>
                {isLocked && (
                  <p className="staff-unlock-note">
                    <BilingualText text={text.staff.unlockAtLevel(worker.unlockLevel!)} />
                  </p>
                )}
              </div>
              <button
                type="button"
                className="action-button"
                onClick={() => onHireWorker(worker)}
                disabled={isLocked || money < worker.cost}
              >
                <BilingualText text={text.staff.hireButton} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default StaffPanel
