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
}

export const CHOICE_EVENT_KEYS: ChoiceEventKey[] = Object.keys(
  CHOICE_EVENTS,
) as ChoiceEventKey[]

export function getRandomChoiceEvent(): ChoiceEvent {
  const key = CHOICE_EVENT_KEYS[Math.floor(Math.random() * CHOICE_EVENT_KEYS.length)]
  return CHOICE_EVENTS[key]
}
