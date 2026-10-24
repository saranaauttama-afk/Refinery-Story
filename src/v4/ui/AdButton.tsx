import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { showRewardedAd } from '../ads/rewarded'
import { SmallButton } from './cards'
import { type, ui } from './theme'
import { text } from '../i18n'

/**
 * A button that plays one rewarded ad, then runs `onReward`. Opt-in only.
 * Closing the ad early gives nothing; if no ad can be shown (offline, no fill) the reward is still
 * given with a note, because that is not the player's fault (docs/v4/ADS.md). Limits live in the
 * sim, so `onReward` can never hand out more than the rules allow.
 */
export function AdButton({
  label,
  onReward,
  disabled = false,
}: {
  label: { en: string; th: string }
  onReward: () => void
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const alive = useRef(true)
  useEffect(
    () => () => {
      alive.current = false
    },
    [],
  )
  const watch = async () => {
    if (busy) return
    setBusy(true)
    setNote(null)
    const r = await showRewardedAd()
    if (!alive.current) {
      if (r !== 'closed') onReward()
      return
    }
    setBusy(false)
    if (r === 'closed') return
    onReward()
    if (r === 'failed') {
      setNote(text({ en: 'No ad right now — here it is free', th: 'ไม่มีโฆษณาตอนนี้ — รับฟรี' }))
      setTimeout(() => alive.current && setNote(null), 4000)
    }
  }
  return (
    <View style={{ gap: 2 }}>
      <SmallButton
        label={`▶ ${busy ? text({ en: 'Loading…', th: 'กำลังโหลด…' }) : text(label)}`}
        color="#8ED9C1"
        disabled={disabled || busy}
        onPress={watch}
      />
      {note && <Text style={[type.small, { color: ui.muted, textAlign: 'center' }]}>{note}</Text>}
    </View>
  )
}
