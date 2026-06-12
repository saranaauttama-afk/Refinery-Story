import type { ActiveWorkerItem, BilingualTextValue, WorkerConfig, WorkerLevels, WorkerType, WorkerXp } from '../types'
import { BONUS_BALANCE, STAFF_LEVEL_BALANCE, STORAGE_BALANCE } from '../data/balance'
import { getTrainingCost, getWorkerLevelMultiplier } from '../utils/gameCalculations'
import BilingualText from './BilingualText'
import { text } from '../translations'

type StaffPanelProps = {
  money: number
  researchPoints: number
  refineryLevel: number
  activeWorkers: ActiveWorkerItem[]
  workerLevels: WorkerLevels
  workerXp: WorkerXp
  onHireWorker: (worker: WorkerConfig) => void
  onTrainWorker: (worker: WorkerConfig) => void
}

const TIER_ORDER = [1, 2, 3] as const
type Tier = (typeof TIER_ORDER)[number]

function getWorkerActiveBonus(key: WorkerType, count: number): BilingualTextValue | null {
  if (count === 0) return null
  switch (key) {
    case 'operator':
      return text.workforce.bonusOperator(
        Math.round(count * BONUS_BALANCE.operatorProductionBonusRate * 100),
      )
    case 'mechanic':
      return text.workforce.bonusMechanic(count * STORAGE_BALANCE.mechanicStorageBonus)
    case 'salesAgent':
      return text.workforce.bonusSalesAgent(count * BONUS_BALANCE.salesAgentSellPriceBonus)
    case 'safetyOfficer':
      return text.workforce.bonusSafetyOfficer(
        Math.round(Math.pow(BONUS_BALANCE.safetyOfficerPenaltyRate, count) * 100),
      )
    case 'chemist':
      return text.workforce.bonusChemist(
        Math.round(count * BONUS_BALANCE.chemistRpBonusRate * 100),
      )
    case 'logisticsCoordinator':
      return text.workforce.bonusLogistics(
        Math.round(count * BONUS_BALANCE.logisticsCoordinatorShipmentBonusRate * 100),
      )
    case 'fuelSpecialist':
      return text.workforce.bonusFuelSpecialist(
        Math.round(count * BONUS_BALANCE.fuelSpecialistSellPriceBonusRate * 100),
      )
    case 'aviationSpecialist':
      return text.workforce.bonusAviationSpecialist(
        Math.round(count * BONUS_BALANCE.aviationSpecialistJetFuelBonusRate * 100),
      )
    case 'chemicalEngineer':
      return text.workforce.bonusChemicalEngineer(
        Math.round(count * BONUS_BALANCE.chemicalEngineerPetrochemicalsBonusRate * 100),
      )
  }
}

function StaffPanel({
  money,
  researchPoints,
  refineryLevel,
  activeWorkers,
  workerLevels,
  workerXp,
  onHireWorker,
  onTrainWorker,
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
                    {!isLocked && worker.count > 0 && (() => {
                      const level = workerLevels[worker.key] ?? 1
                      const xp = workerXp[worker.key] ?? 0
                      const isMax = level >= STAFF_LEVEL_BALANCE.maxLevel
                      const threshold = STAFF_LEVEL_BALANCE.xpToNextLevel[level] ?? 0
                      const pct = isMax
                        ? 100
                        : Math.min(100, Math.round((xp / Math.max(1, threshold)) * 100))
                      const bonusPct = Math.round(
                        (getWorkerLevelMultiplier(level) - 1) * 100,
                      )
                      const trainCost = getTrainingCost(level)
                      const canTrain =
                        !isMax &&
                        money >= trainCost.money &&
                        researchPoints >= trainCost.rp
                      return (
                        <div className="staff-level-block">
                          <div className="staff-level-row">
                            <span className="staff-level-badge">
                              <BilingualText text={text.staffTraining.levelLabel(level)} />
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
                          <div className="staff-xp-track">
                            <div
                              className="staff-xp-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {!isMax && (
                            <button
                              type="button"
                              className="action-button staff-train-button"
                              onClick={() => onTrainWorker(worker)}
                              disabled={!canTrain}
                            >
                              <BilingualText
                                text={text.staffTraining.trainButton(
                                  trainCost.money,
                                  trainCost.rp,
                                )}
                              />
                            </button>
                          )}
                        </div>
                      )
                    })()}
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
