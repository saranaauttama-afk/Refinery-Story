import { useEffect } from 'react'
import type { EraConfig } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type EraBannerToastProps = {
  era: EraConfig
  onClose: () => void
}

// Lightweight, auto-dismissing celebration banner for entering a new Tech Era.
// Lighter touch than the Awards ceremony modal — doesn't block input, just
// announces the moment and fades away.
function EraBannerToast({ era, onClose }: EraBannerToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`era-banner-toast era-banner-toast--${era.key}`} role="status">
      <button type="button" className="era-banner-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
      <p className="era-banner-title">
        <BilingualText text={text.eras.bannerTitle(era.name)} />
      </p>
      <p className="era-banner-tagline">
        <BilingualText text={era.tagline} />
      </p>
    </div>
  )
}

export default EraBannerToast
