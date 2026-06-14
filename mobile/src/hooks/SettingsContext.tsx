import { createContext, useContext, type ReactNode } from 'react'
import type { BilingualTextValue } from '../game/types'
import { useSettingsState, type Settings } from './useSettings'

type SettingsValue = ReturnType<typeof useSettingsState>

const SettingsContext = createContext<SettingsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettingsState()
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettingsContext(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext() must be used within <SettingsProvider>')
  return ctx
}

// Convenience: pick the right side of a {en, th} pair for the current
// language setting. Currently used by the menu/settings/store screens --
// the 4 main game tabs still read .en directly (see README "What's NOT
// done").
export function useLang(): { lang: Settings['language']; t: (value: BilingualTextValue) => string } {
  const { settings } = useSettingsContext()
  return {
    lang: settings.language,
    t: (value: BilingualTextValue) => (settings.language === 'th' ? value.th : value.en),
  }
}
