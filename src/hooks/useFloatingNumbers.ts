import { useCallback, useRef, useState } from 'react'

export type FloatingNumberEntry = {
  id: number
  text: string
  kind: 'income' | 'expense'
}

const LIFETIME_MS = 900

// Manages a small queue of "+$180" / "-$100" toasts that rise and fade.
// Each spawned entry auto-removes itself after LIFETIME_MS.
export function useFloatingNumbers() {
  const [items, setItems] = useState<FloatingNumberEntry[]>([])
  const nextId = useRef(0)

  const spawn = useCallback((text: string, kind: FloatingNumberEntry['kind']) => {
    const id = nextId.current++
    setItems((current) => [...current, { id, text, kind }])
    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, LIFETIME_MS)
  }, [])

  return { items, spawn, lifetimeMs: LIFETIME_MS }
}
