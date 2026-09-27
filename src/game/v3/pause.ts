export type V3SimulationSpeed = 0 | 1 | 2 | 3

export type V3PauseState = {
  selectedSpeed: V3SimulationSpeed
  modalOwners: string[]
  backgrounded: boolean
}

export const V3_INITIAL_PAUSE_STATE: V3PauseState = {
  selectedSpeed: 1,
  modalOwners: [],
  backgrounded: false,
}

export function getV3EffectiveSpeed(state: V3PauseState): V3SimulationSpeed {
  return state.backgrounded || state.modalOwners.length > 0 ? 0 : state.selectedSpeed
}

export function setV3SelectedSpeed(state: V3PauseState, selectedSpeed: V3SimulationSpeed): V3PauseState {
  return { ...state, selectedSpeed }
}

export function acquireV3Pause(state: V3PauseState, owner: string): V3PauseState {
  return state.modalOwners.includes(owner) ? state : { ...state, modalOwners: [...state.modalOwners, owner] }
}

export function releaseV3Pause(state: V3PauseState, owner: string): V3PauseState {
  return { ...state, modalOwners: state.modalOwners.filter((entry) => entry !== owner) }
}

export function setV3Backgrounded(state: V3PauseState, backgrounded: boolean): V3PauseState {
  return { ...state, backgrounded }
}
