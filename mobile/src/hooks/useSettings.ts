import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'th'

export type Settings = {
  language: Language
  soundEnabled: boolean
  musicEnabled: boolean
  adsRemoved: boolean
}

const SETTINGS_KEY = 'refinery-story-settings'

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  soundEnabled: true,
  musicEnabled: true,
  adsRemoved: false,
}

function sanitize(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS
  const v = value as Partial<Settings>
  return {
    language: v.language === 'th' ? 'th' : 'en',
    soundEnabled: typeof v.soundEnabled === 'boolean' ? v.soundEnabled : true,
    musicEnabled: typeof v.musicEnabled === 'boolean' ? v.musicEnabled : true,
    adsRemoved: typeof v.adsRemoved === 'boolean' ? v.adsRemoved : false,
  }
}

// Separate from game saves on purpose -- settings (language, sound, IAP
// status) shouldn't be wiped by "Reset save" / New Game.
export function useSettingsState() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) setSettings(sanitize(JSON.parse(raw)))
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const persist = useCallback((next: Settings) => {
    setSettings(next)
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {})
  }, [])

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      persist({ ...settings, [key]: value })
    },
    [settings, persist],
  )

  return { settings, loaded, update }
}
