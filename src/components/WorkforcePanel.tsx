import type { ActiveWorkerItem, BilingualTextValue, WorkerType } from '../types'
import { BONUS_BALANCE, STORAGE_BALANCE } from '../data/balance'
import BilingualText from './BilingualText'
import { text } from '../translations'

type WorkforcePanelProps = {
  activeWorkers: ActiveWorkerItem[]
}

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
            .map((worker) => {
              const bonus = getWorkerActiveBonus(worker.key, worker.count)
              return (
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
                  {bonus && (
                    <p className="worker-active-bonus">
                      <BilingualText text={bonus} />
                    </p>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </section>
  )
}

export default WorkforcePanel
