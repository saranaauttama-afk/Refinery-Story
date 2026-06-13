import { useEffect } from 'react'
import type { HiddenComboConfig } from '../data/hiddenCombos'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ComboDiscoveryToastProps = {
  combo: HiddenComboConfig
  // True when an era banner toast is also visible, so this one drops below it.
  offset?: boolean
  onClose: () => void
}

// Lightweight, auto-dismissing celebration banner for a hidden-combo
// discovery — same pattern as EraBannerToast, distinct styling.
function ComboDiscoveryToast({ combo, offset, onClose }: ComboDiscoveryToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`combo-discovery-toast${offset ? ' combo-discovery-toast--offset' : ''}`}
      role="status"
    >
      <button type="button" className="era-banner-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
      <p className="era-banner-title">
        <BilingualText text={text.logs.comboToastTitle(combo.name)} />
      </p>
      <p className="era-banner-tagline">
        <BilingualText text={combo.message} />
      </p>
      <p className="combo-discovery-reward">
        <BilingualText text={text.logs.comboToastReward(combo.cashReward, combo.rpReward)} />
      </p>
    </div>
  )
}

export default ComboDiscoveryToast
