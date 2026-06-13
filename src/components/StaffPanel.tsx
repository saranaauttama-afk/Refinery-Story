import type { ActiveWorkerItem, Employee, WorkerConfig } from '../types'
import { STAFF_LEVEL_BALANCE } from '../data/balance'
import {
  getEmployeesByType,
  getTrainingCost,
  getWorkerLevelMultiplier,
} from '../utils/gameCalculations'
import { getWorkerActiveBonus } from '../utils/workerBonusText'
import BilingualText from './BilingualText'
import { text } from '../translations'

type StaffPanelProps = {
  money: number
  researchPoints: number
  refineryLevel: number
  activeWorkers: ActiveWorkerItem[]
  employees: Employee[]
  onHireWorker: (worker: WorkerConfig) => void
  onTrainEmployee: (employeeId: string) => void
}

const TIER_ORDER = [1, 2, 3] as const
type Tier = (typeof TIER_ORDER)[number]

function StaffPanel({
  money,
  researchPoints,
  refineryLevel,
  activeWorkers,
  employees,
  onHireWorker,
  onTrainEmployee,
}: StaffPanelProps) {
  const grouped = new Map<Tier, ActiveWorkerItem[]>()
  for (const worker of activeWorkers) {
    const tier = (worker.tier ?? 1) as Tier
    if (!grouped.has(tier)) grouped.set(tier, [])
    grouped.get(tier)!.push(worker)
  }

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

      {TIER_ORDER.filter((tier) => grouped.has(tier)).map((tier) => (
        <div key={tier} className="staff-tier-group">
          <p className="staff-tier-heading">
            <BilingualText text={text.staff.tiers[tier]} />
          </p>
          <div className="staff-list">
            {grouped.get(tier)!.map((worker) => {
              const isLocked = !!(worker.unlockLevel && refineryLevel < worker.unlockLevel)
              const teamMembers = getEmployeesByType(employees, worker.key)
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
                    <p className="staff-meta">
                      <BilingualText text={text.staff.countAndCost(worker.count, worker.cost)} />
                    </p>
                    <p>
                      <BilingualText text={worker.description} />
                    </p>
                    {!isLocked && (() => {
                      const bonus = getWorkerActiveBonus(worker.key, worker.count)
                      return bonus ? (
                        <p className="worker-active-bonus">
                          <BilingualText text={bonus} />
                        </p>
                      ) : null
                    })()}
                    {!isLocked && teamMembers.length > 0 && (
                      <div className="staff-roster-list">
                        {teamMembers.map((employee) => {
                          const isMax = employee.level >= STAFF_LEVEL_BALANCE.maxLevel
                          const threshold = STAFF_LEVEL_BALANCE.xpToNextLevel[employee.level] ?? 0
                          const pct = isMax
                            ? 100
                            : Math.min(100, Math.round((employee.xp / Math.max(1, threshold)) * 100))
                          const bonusPct = Math.round(
                            (getWorkerLevelMultiplier(employee.level) - 1) * 100,
                          )
                          const trainCost = getTrainingCost(employee.level)
                          const canTrain =
                            !isMax &&
                            money >= trainCost.money &&
                            researchPoints >= trainCost.rp
                          return (
                            <div key={employee.id} className="staff-employee-row">
                              <div className="staff-level-row">
                                <span className="staff-employee-name">{employee.name}</span>
                                <span className="staff-level-badge">
                                  <BilingualText text={text.staffTraining.levelLabel(employee.level)} />
                                </span>
                                {bonusPct > 0 && (
                                  <span className="staff-level-bonus">
                                    <BilingualText text={text.staffTraining.bonusLabel(bonusPct)} />
                                  </span>
                                )}
                                {isMax && (
                                  <span className="staff-level-max">
                                    <BilingualText text={text.staffTraining.maxLevel} />
                                  </span>
                                )}
                              </div>
                              {!isMax && (
                                <>
                                  <div className="staff-xp-track">
                                    <div className="staff-xp-fill" style={{ width: `${pct}%` }} />
                                  </div>
                                  <button
                                    type="button"
                                    className="action-button staff-train-button"
                                    onClick={() => onTrainEmployee(employee.id)}
                                    disabled={!canTrain}
                                  >
                                    <BilingualText
                                      text={text.staffTraining.trainButton(
                                        trainCost.money,
                                        trainCost.rp,
                                      )}
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
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
                    <BilingualText
                      text={
                        isLocked
                          ? text.staff.locked
                          : money < worker.cost
                            ? text.staff.cantAfford
                            : text.staff.hireButton
                      }
                    />
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

export default StaffPanel
