import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'th'

export type Settings = {
  language: Language
  soundEnabled: boolean
  musicEnabled: boolean
  adsRemoved: boolean
  /** Keep the crude tank topped up automatically (trucks deliver it); on by default. */
  autoCrude: boolean
}

const SETTINGS_KEY = 'refinery-story-settings'

/** First launch follows the phone's language (Thai phone → Thai UI); the player can still switch. */
function deviceLanguage(): Language {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('th') ? 'th' : 'en'
  } catch {
    return 'en'
  }
}

const DEFAULT_SETTINGS: Settings = {
  language: deviceLanguage(),
  soundEnabled: true,
  musicEnabled: true,
  adsRemoved: false,
  autoCrude: true,
}

function sanitize(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS
  const v = value as Partial<Settings>
  return {
    language: v.language === 'th' || v.language === 'en' ? v.language : DEFAULT_SETTINGS.language,
    soundEnabled: typeof v.soundEnabled === 'boolean' ? v.soundEnabled : true,
    musicEnabled: typeof v.musicEnabled === 'boolean' ? v.musicEnabled : true,
    adsRemoved: typeof v.adsRemoved === 'boolean' ? v.adsRemoved : false,
    autoCrude: typeof v.autoCrude === 'boolean' ? v.autoCrude : true,
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
