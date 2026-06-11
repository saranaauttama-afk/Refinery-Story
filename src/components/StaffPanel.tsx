import type { ActiveWorkerItem, BilingualTextValue, WorkerConfig, WorkerType } from '../types'
import { BONUS_BALANCE, STORAGE_BALANCE } from '../data/balance'
import BilingualText from './BilingualText'
import { text } from '../translations'

type StaffPanelProps = {
  money: number
  refineryLevel: number
  activeWorkers: ActiveWorkerItem[]
  onHireWorker: (worker: WorkerConfig) => void
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
  }
}

function StaffPanel({ money, refineryLevel, activeWorkers, onHireWorker }: StaffPanelProps) {
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
