import { useMemo } from 'react'

import { playSfx } from '../audio/soundManager'
import type { SoundKey } from '../audio/sounds'
import { useSettingsContext } from './SettingsContext'

// SFX playback gated on the "Sound effects" setting (the same toggle that
// gates haptics). Mirrors useHaptics() so call sites can fire both side by
// side. Safe to call from any action handler -- a disabled setting or a
// missing native module just makes play() a no-op.
export function useSound() {
  const { settings } = useSettingsContext()
  const enabled = settings.soundEnabled

  return useMemo(
    () => ({
      play: (key: SoundKey) => {
        if (enabled) playSfx(key)
      },
    }),
    [enabled],
  )
}
