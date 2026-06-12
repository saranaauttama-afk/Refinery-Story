import { BONUS_BALANCE, STORAGE_BALANCE } from '../data/balance'
import { text } from '../translations'
import type { BilingualTextValue, WorkerType } from '../types'

// Single source of truth for the "active bonus" summary text shown per worker
// type. Previously copy-pasted in StaffPanel and WorkforcePanel.
//
// Note: this describes the BASE per-headcount bonus and intentionally does not
// fold in crew-level multipliers — StaffPanel shows the crew level / effective
// bonus separately so the two readouts stay legible.
export function getWorkerActiveBonus(
  key: WorkerType,
  count: number,
): BilingualTextValue | null {
  if (count === 0) return null
  switch (key) {
    case 'operator':
      return text.workforce.bonusOperator(
        Math.round(count * BONUS_BALANCE.operatorProductionBonusRate * 100),
      )
    case 'mechanic':
      return text.workforce.bonusMechanic(count * STORAGE_BALANCE.mechanicStorageBonus)
    case 'salesAgent':
      return text.workforce.bonusSalesAgent(
        Math.round(count * BONUS_BALANCE.salesAgentSellPriceBonusRate * 100),
      )
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
