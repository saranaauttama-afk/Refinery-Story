/** Web build (UI review only) has no AdMob: the reward is granted so the flow can be checked. */
export const REWARDED_UNIT_ID = 'web-review'
export const ADS_ARE_TEST = true
export type RewardResult = 'rewarded' | 'closed' | 'failed'
export async function showRewardedAd(): Promise<RewardResult> {
  return 'rewarded'
}
