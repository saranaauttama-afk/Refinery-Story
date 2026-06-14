import { createContext, useContext, type ReactNode } from 'react'
import { useGameLoop } from './useGameLoop'

type GameLoopValue = ReturnType<typeof useGameLoop>

const GameContext = createContext<GameLoopValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useGameLoop()
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// All screens use this instead of calling useGameLoop() directly --
// otherwise each screen would run its own independent set of tick/save/
// event intervals.
export function useGame(): GameLoopValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame() must be used within <GameProvider>')
  return ctx
}
