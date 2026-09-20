import * as Haptics from 'expo-haptics'
import { useSettingsContext } from './SettingsContext'

// expo-haptics is unsupported on web and can throw on devices without a
// haptics engine -- never let feedback calls crash an action.
async function safeImpact(style: Haptics.ImpactFeedbackStyle) {
  try {
    await Haptics.impactAsync(style)
  } catch {
    // no-op: haptics unsupported on this platform
  }
}

async function safeNotification(type: Haptics.NotificationFeedbackType) {
  try {
    await Haptics.notificationAsync(type)
  } catch {
    // no-op: haptics unsupported on this platform
  }
}

// Gated by the "Sound effects" toggle in Settings (labeled "Button taps,
// sales, and notifications" -- haptics fit that description even though
// this build has no audio assets yet).
export function useHaptics() {
  const { settings } = useSettingsContext()
  const enabled = settings.soundEnabled

  return {
    // Light tap: buy/sell, sliders, minor UI taps.
    tap: () => {
      if (enabled) void safeImpact(Haptics.ImpactFeedbackStyle.Light)
    },
    // Medium thunk: building/hiring/upgrading -- something was purchased.
    confirm: () => {
      if (enabled) void safeImpact(Haptics.ImpactFeedbackStyle.Medium)
    },
    // Success notification: milestone completed, achievement unlocked.
    success: () => {
      if (enabled) void safeNotification(Haptics.NotificationFeedbackType.Success)
    },
  }
}
