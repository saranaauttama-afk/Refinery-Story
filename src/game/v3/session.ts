/**
 * Single-writer coordination for the V3 save. The game screen owns the only
 * in-memory state and the only save writer; other screens (Settings) request a
 * full reset through this channel instead of writing storage themselves, so a
 * stale in-memory game can never overwrite a reset.
 */
type Listener = () => void
const listeners = new Set<Listener>()

export function onV3ResetRequested(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Returns false when no game screen is mounted to perform the reset. */
export function requestV3Reset(): boolean {
  if (!listeners.size) return false
  for (const listener of [...listeners]) listener()
  return true
}
