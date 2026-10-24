# Ads and supporter pack — decided 24 Oct 2026

## Agreed with the owner

- Free game. Money comes from **opt-in rewarded ads** (AdMob) and, later, a **one-time supporter
  pack**. No energy timers, no gacha, no banners, no forced ads.
- Phase 1 (done in code, test ad IDs only): the five rewarded placements below.
- Phase 2 (not started): supporter pack. Needs a Play merchant account and a billing library.
- Real AdMob IDs come from the owner. Until then every build uses Google's test ads.

## Placements and limits

All limits run on **game time** and are saved in `GameState.rewards`, so changing the phone clock
cannot be used to cheat. The sim only checks limits (`src/v4/sim/systems/rewards.ts`); the UI plays
the ad first (`src/v4/ui/AdButton.tsx`). Numbers: `REWARD_ADS` in `src/v4/data/balance.ts`.

| Placement                | Where                       | Reward                                             | Limit             |
| ------------------------ | --------------------------- | -------------------------------------------------- | ----------------- |
| Finish catalyst research | Lab → Research, lab is busy | Research finishes now                              | 3 per game year   |
| Double the catalyst      | Lab → Research, lab is busy | That research gives ×2 units                       | once per research |
| Lab hint                 | Lab → Research              | One synergy / secret-formula hint not yet found    | 1 per game year   |
| Clear the storm          | Yard, banner while stormy   | Storm ends now                                     | once per storm    |
| Next truck pays ×2       | Customers, top of the panel | The next sale pays ×2 (contracts are not affected) | 1 per game month  |

## Rules

- If the ad cannot be shown (offline, no fill, timeout 15 s) the reward is still given, with the
  note "ไม่มีโฆษณาตอนนี้ — รับฟรี". Not the player's fault, and the sim limits still apply.
- Closing the ad early gives nothing.
- Ads are requested non-personalized.
- Balance gate: `check-balance` runs a bot that watches every allowed ad on 8 seeds; rank 5 must not
  come before year 2.5, rank 10 not before year 11, and the first A / S / SS medians stay inside
  the FUN windows. `check-rewards` tests each reward, its limit, saves and determinism.

## Setup (copied from PhiKinHua, adapted)

- Package `react-native-google-mobile-ads` **17.3.1** (this repo is RN 0.86; PhiKinHua is pinned to
  16.0.3 because it is on RN 0.81 with Kotlin 2.1 — do not copy that pin).
- `app.json` plugin uses Google's **test app IDs** now. Replace `androidAppId` with the real AdMob
  app ID when the owner creates the app for `com.refinerystory.u2`.
- Ad unit: `EXPO_PUBLIC_ADMOB_REWARDED_ID`. Set it **only** in the `production` profile in
  `eas.json`. CI APKs, `preview` and `closedtest` keep test ads, so you never click your own real ad.
  One unit for all placements for now; split per placement later if the owner wants separate stats.
- `src/v4/ads/rewarded.web.ts` grants the reward at once so the web build can check the UI.
- EEA / UK: not offered in the first release (set in Play Console), same as PhiKinHua, until a
  consent screen (UMP) exists.

## Store and privacy to-do (owner, Play Console)

- Privacy page already has the AdMob section (TH + EN): `docs/privacy/index.html`.
- Play Console → App content: Ads = **Yes**; Advertising ID = used (ads); Data safety = Device or
  other IDs collected by AdMob (advertising, fraud prevention); target audience 13+; countries
  without EEA and UK.
- AdMob: create the app, one rewarded unit, link it to the Play listing, add `app-ads.txt` later.
- Closed testing: use a `closedtest` build (test ads) so testers can tap ads safely.

## Supporter pack (phase 2 idea, price ฿99–149, one time)

- Ad buttons become free buttons; the same limits stay, so balance does not change.
- 2–3 exclusive decorations (gold tank skin, company flag, truck colour) and a "ผู้สนับสนุน"
  badge on the Company page.
