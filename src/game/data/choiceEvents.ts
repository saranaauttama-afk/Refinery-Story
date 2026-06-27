import type { ChoiceEvent, ChoiceEventKey } from '../types'
import { text } from '../translations'

export const CHOICE_EVENTS: Record<ChoiceEventKey, ChoiceEvent> = {
  supplierNegotiation: {
    key: 'supplierNegotiation',
    title: text.choiceEvents.events.supplierNegotiation.title,
    description: text.choiceEvents.events.supplierNegotiation.description,
    optionA: text.choiceEvents.events.supplierNegotiation.optionA,
    optionB: text.choiceEvents.events.supplierNegotiation.optionB,
  },
  researchGrant: {
    key: 'researchGrant',
    title: text.choiceEvents.events.researchGrant.title,
    description: text.choiceEvents.events.researchGrant.description,
    optionA: text.choiceEvents.events.researchGrant.optionA,
    optionB: text.choiceEvents.events.researchGrant.optionB,
  },
  workerRecruitment: {
    key: 'workerRecruitment',
    title: text.choiceEvents.events.workerRecruitment.title,
    description: text.choiceEvents.events.workerRecruitment.description,
    optionA: text.choiceEvents.events.workerRecruitment.optionA,
    optionB: text.choiceEvents.events.workerRecruitment.optionB,
  },
  equipmentEmergency: {
    key: 'equipmentEmergency',
    title: text.choiceEvents.events.equipmentEmergency.title,
    description: text.choiceEvents.events.equipmentEmergency.description,
    optionA: text.choiceEvents.events.equipmentEmergency.optionA,
    optionB: text.choiceEvents.events.equipmentEmergency.optionB,
  },
  governmentIncentive: {
    key: 'governmentIncentive',
    title: text.choiceEvents.events.governmentIncentive.title,
    description: text.choiceEvents.events.governmentIncentive.description,
    optionA: text.choiceEvents.events.governmentIncentive.optionA,
    optionB: text.choiceEvents.events.governmentIncentive.optionB,
  },
  qualityAlert: {
    key: 'qualityAlert',
    title: text.choiceEvents.events.qualityAlert.title,
    description: text.choiceEvents.events.qualityAlert.description,
    optionA: text.choiceEvents.events.qualityAlert.optionA,
    optionB: text.choiceEvents.events.qualityAlert.optionB,
  },
  supplyChainDelay: {
    key: 'supplyChainDelay',
    title: text.choiceEvents.events.supplyChainDelay.title,
    description: text.choiceEvents.events.supplyChainDelay.description,
    optionA: text.choiceEvents.events.supplyChainDelay.optionA,
    optionB: text.choiceEvents.events.supplyChainDelay.optionB,
  },
  investorVisit: {
    key: 'investorVisit',
    title: text.choiceEvents.events.investorVisit.title,
    description: text.choiceEvents.events.investorVisit.description,
    optionA: text.choiceEvents.events.investorVisit.optionA,
    optionB: text.choiceEvents.events.investorVisit.optionB,
  },
  oldEquipmentSale: {
    key: 'oldEquipmentSale',
    title: text.choiceEvents.events.oldEquipmentSale.title,
    description: text.choiceEvents.events.oldEquipmentSale.description,
    optionA: text.choiceEvents.events.oldEquipmentSale.optionA,
    optionB: text.choiceEvents.events.oldEquipmentSale.optionB,
  },
  trainingRequest: {
    key: 'trainingRequest',
    title: text.choiceEvents.events.trainingRequest.title,
    description: text.choiceEvents.events.trainingRequest.description,
    optionA: text.choiceEvents.events.trainingRequest.optionA,
    optionB: text.choiceEvents.events.trainingRequest.optionB,
  },
  communityComplaint: {
    key: 'communityComplaint',
    title: text.choiceEvents.events.communityComplaint.title,
    description: text.choiceEvents.events.communityComplaint.description,
    optionA: text.choiceEvents.events.communityComplaint.optionA,
    optionB: text.choiceEvents.events.communityComplaint.optionB,
  },
  rushOrder: {
    key: 'rushOrder',
    title: text.choiceEvents.events.rushOrder.title,
    description: text.choiceEvents.events.rushOrder.description,
    optionA: text.choiceEvents.events.rushOrder.optionA,
    optionB: text.choiceEvents.events.rushOrder.optionB,
  },
  standoutHire: {
    key: 'standoutHire',
    title: text.choiceEvents.events.standoutHire.title,
    description: text.choiceEvents.events.standoutHire.description,
    optionA: text.choiceEvents.events.standoutHire.optionA,
    optionB: text.choiceEvents.events.standoutHire.optionB,
  },
  teamFeud: {
    key: 'teamFeud',
    title: text.choiceEvents.events.teamFeud.title,
    description: text.choiceEvents.events.teamFeud.description,
    optionA: text.choiceEvents.events.teamFeud.optionA,
    optionB: text.choiceEvents.events.teamFeud.optionB,
  },
  raiseRequest: {
    key: 'raiseRequest',
    title: text.choiceEvents.events.raiseRequest.title,
    description: text.choiceEvents.events.raiseRequest.description,
    optionA: text.choiceEvents.events.raiseRequest.optionA,
    optionB: text.choiceEvents.events.raiseRequest.optionB,
  },
  teamOuting: {
    key: 'teamOuting',
    title: text.choiceEvents.events.teamOuting.title,
    description: text.choiceEvents.events.teamOuting.description,
    optionA: text.choiceEvents.events.teamOuting.optionA,
    optionB: text.choiceEvents.events.teamOuting.optionB,
  },
}

export const CHOICE_EVENT_KEYS: ChoiceEventKey[] = Object.keys(
  CHOICE_EVENTS,
) as ChoiceEventKey[]

const STAFF_EVENT_KEYS: ChoiceEventKey[] = ['standoutHire', 'teamFeud', 'raiseRequest', 'teamOuting']

export function getRandomChoiceEvent(): ChoiceEvent {
  const key = CHOICE_EVENT_KEYS[Math.floor(Math.random() * CHOICE_EVENT_KEYS.length)]
  return CHOICE_EVENTS[key]
}

export function getRandomStaffEvent(): ChoiceEvent {
  const key = STAFF_EVENT_KEYS[Math.floor(Math.random() * STAFF_EVENT_KEYS.length)]
  return CHOICE_EVENTS[key]
}
