import { hints } from './onboarding'
// The guided first layout, in placement order. Used by the bot and the headless checks.
export const starterLayout: [string, number, number][] = hints.flatMap(step =>
  step.place.map(p => [p.id, p.x, p.y] as [string, number, number]),
)
