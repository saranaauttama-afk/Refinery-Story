import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads'
import { REWARD_ADS } from '../data/balance'

/**
 * Rewarded ads (AdMob), opt-in only: no banners, no forced ads (docs/v4/ADS.md).
 * Ad unit comes from EXPO_PUBLIC_ADMOB_REWARDED_ID at build time; without it Google's test ad is
 * used. The real ID is set only in the eas.json `production` profile, so CI/preview/closedtest
 * builds never show real ads (clicking your own real ad counts as invalid traffic).
 * `rewarded.web.ts` is the twin used by the web build that checks the UI.
 */
export const REWARDED_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED
export const ADS_ARE_TEST = REWARDED_UNIT_ID === TestIds.REWARDED

let initialized: Promise<unknown> | null = null

/** rewarded: watched to the end. closed: closed early, no reward. failed: no ad could be shown. */
export type RewardResult = 'rewarded' | 'closed' | 'failed'

export async function showRewardedAd(
  timeoutMs = REWARD_ADS.adLoadTimeoutMs,
): Promise<RewardResult> {
  try {
    initialized ??= mobileAds().initialize()
    await initialized
  } catch {
    initialized = null
    return 'failed'
  }
  return new Promise<RewardResult>(resolve => {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    })
    let earned = false
    let done = false
    const subs: Array<() => void> = []
    const finish = (r: RewardResult) => {
      if (done) return
      done = true
      clearTimeout(timer)
      subs.forEach(u => u())
      resolve(r)
    }
    const timer = setTimeout(() => finish('failed'), timeoutMs)
    subs.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer)
        ad.show().catch(() => finish('failed'))
      }),
    )
    subs.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true)))
    subs.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? 'rewarded' : 'closed')),
    )
    subs.push(ad.addAdEventListener(AdEventType.ERROR, () => finish('failed')))
    ad.load()
  })
}
