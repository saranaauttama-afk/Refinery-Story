import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { B, MONTH } from '../data/balance'
import { createNewGame } from '../sim/state'
import { tick } from '../sim/tick'
import { serialize, deserialize } from '../sim/save'
import type { Action, GameState } from '../sim/types'

const Context = createContext<{ state: GameState; ready: boolean; hasSave: boolean; dispatch: (action: Action) => void; newGame: () => void } | null>(null)
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(createNewGame)
  const [ready, setReady] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  const [active, setActive] = useState(AppState.currentState === 'active')
  const latest = useRef(state)
  const writes = useRef(Promise.resolve())
  latest.current = state
  const persist = useCallback((s: GameState) => {
    const raw = serialize(s)
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(B.saveKey, raw)).then(() => setHasSave(true))
  }, [])
  useEffect(() => {
    AsyncStorage.getItem(B.saveKey).then(raw => { if (raw) { setState(deserialize(raw)); setHasSave(true) } }).catch(() => {}).finally(() => setReady(true))
    const sub = AppState.addEventListener('change', status => { setActive(status === 'active'); if (status !== 'active') persist(latest.current) })
    return () => sub.remove()
  }, [persist])
  useEffect(() => {
    if (!ready || !active || state.speed === 0) return
    const timer = setInterval(() => setState(tick), B.tickMs / state.speed)
    return () => clearInterval(timer)
  }, [ready, active, state.speed])
  useEffect(() => { if (ready && state.tick > 0 && state.tick % MONTH === 0) persist(state) }, [state.tick, ready, persist, state])
  const dispatch = useCallback((action: Action) => setState(action), [])
  const newGame = () => { const s = createNewGame(); setState(s); persist(s) }
  return <Context.Provider value={{ state, ready, hasSave, dispatch, newGame }}>{children}</Context.Provider>
}
export function useGame() { const value = useContext(Context); if (!value) throw new Error('Missing GameProvider'); return value }
