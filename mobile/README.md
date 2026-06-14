# Refinery Story — Mobile (Expo)

Expo / React Native port of Refinery Story, restructured as a mobile game
(bottom-tab navigation, one screen at a time) instead of the web version's
long stacked-panel layout.

## Run it

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code
with Expo Go on your phone.

> Built/typechecked in a sandbox without a simulator (`tsc --noEmit` is
> clean across 36 files, `npm install` resolves all deps, and the full
> production/event/award loop was simulated for 2000 ticks with no NaN/
> negative-value issues), but `npx expo start` itself hasn't been run
> end-to-end here -- please flag anything that breaks on first run.

## What's playable

- **Splash screen**: brief animated logo/title (~1.2s) on launch.
- **Main Menu** (`/`): title screen with Continue (or New Game if no save
  exists), New Game (overwrite, with confirm), Settings, and Remove Ads /
  Store. Shows a save summary card (refinery name, level, money) when a save
  exists.
- **Settings** (`/settings`): language toggle (EN/TH, persisted -- currently
  affects the menu/settings/store screens only, see gaps below), sound/music
  toggles (persisted but no audio assets yet, so silent demo toggles), link
  to Store, Reset save, About.
- **Store** (`/store`): mock IAP screen --
  - "Remove Ads" ($2.99, persists `adsRemoved` -- a flag for when real ads
    are wired up later).
  - "Rewarded Ads" section: 2 placeholders ("Watch Ad for Cash" -> +$500,
    "Watch Ad for 2x Boost" -> 2x rewards for 10 min) marked **Soon** --
    not yet functional, just previews the planned watch-to-earn flow.
  - A few illustrative consumable "boosts" (cash/RP packs) with a fake
    purchase confirmation flow. No real payment or ad SDK -- this is all
    local/demo.
- **🏭 Refinery / 👥 Staff / 📋 Business / 📊 Stats** (`/game/...`, bottom
  tabs): the full game --
  - **Refinery**: resource bar (money / crude / feedstock / gasoline / ESG /
    season), the building grid, buy crude / sell gasoline, sell downstream
    products. Tap an empty tile to **build**, tap a crude tank / distillation
    unit / product tank to **upgrade**, tap the title to **upgrade the
    refinery level**. A **🔄 Auto-trade** card lets you toggle automatic
    crude top-ups / gasoline sell-offs with adjustable thresholds (±5%
    steppers) -- see below.
  - **Staff**: hire all 9 worker types. "Your team" shows each employee
    (name, level, XP, ⭐ veteran trait), with a **Train** button (costs $ +
    RP, max level 5) and an **Assign** toggle for specialist roles
    (aviationSpecialist -> Jet Fuel Plant, chemicalEngineer -> Petrochemical
    Plant) that boosts that plant's output.
  - **Business**: Contracts, Research, Perks (3 branches x 3 tiers), plus
    **Crude shipments** (order bulk crude with a real-time delay, see
    pending arrivals countdown) and **Standing orders** (recurring
    high-value sales with a cooldown).
  - **Stats**: era progress, ESG score/tier, season, reputation, milestones,
    **Asphalt** production (once unlocked at Lv5), an **Activity log** (last
    8 entries), grid expansion, rename refinery, manual/auto save, reset, and
    links to Settings/Store. Also a **☰ Main Menu** link back to `/`.
- **Global overlays**: Choice Event modal, year-end Award modal, Era-advance
  banner.
- **Full production tick** (200ms): crude -> feedstock (distillation) ->
  lubricants/jetFuel/petrochemicals (downstream plants, specialist-boosted),
  crude -> gasoline (incl. Efficiency-perk yield carry), ESG drift, Energy
  Transition demand shift, staff XP/level-ups, era-advance detection,
  year-end award rollover, random events, real-time crude shipments.
  Autosaves every 5s via AsyncStorage. Settings (language/audio/ads) are
  stored separately so "Reset save" / New Game doesn't wipe them.

## Auto-trade

QoL feature added to address the #1 reported annoyance: repeatedly tapping
"Buy 10 Crude" / "Sell 10 Gas". When the **🔄 Auto-trade** toggle on the
Refinery screen is on, every tick (200ms):

1. If `crudeOil` is below `buyThreshold`% of `maxCrudeStorage`, buy enough to
   bring it back up to `buyThreshold`% (capped by cash on hand and storage
   space).
2. If `gasoline` is above `sellThreshold`% of `maxGasolineStorage`, sell the
   excess down to `sellThreshold`%.

Both thresholds (0-100%, default 20% / 80%) are adjustable via ±5% stepper
buttons and apply to two *different* resources (crude vs. gasoline), so they
don't interact with each other. The implementation (`applyAutoTrade` in
`src/hooks/useGameLoop.ts`, exported for testing) is a pure function run
after the main `tick()`.

Persisted separately from the game save (`refinery-story-autotrade` in
AsyncStorage, like Settings) -- survives "Reset save" / New Game.



All game state/intervals live in **one** `useGameLoop()` instance, shared via
`GameProvider`/`useGame()` (`src/hooks/GameContext.tsx`) and mounted once in
`app/_layout.tsx`. Screens call `useGame()`, not `useGameLoop()` directly --
calling the hook in multiple screens would spin up duplicate tick/save/event
intervals. Similarly, app preferences (language/sound/ads) live in
`SettingsProvider`/`useSettingsContext()` (`src/hooks/SettingsContext.tsx`),
backed by a separate AsyncStorage key so they survive "Reset save".

The game itself lives under `/game` (a `(tabs)` group), so the root `/`
route can be the menu/splash without an expo-router naming conflict.

## What's NOT done / known gaps

- **Icons are placeholders** -- colored boxes with 2-letter codes (CT, DU,
  PT...) on the grid, per `src/buildingColors.ts`. The 30 isometric SVGs
  generated earlier are in `assets/icons/` but not wired in (by request).
- **App icon / splash image**: not configured in `app.json` (Expo needs a
  1024x1024 PNG) -- the in-app splash screen (`app/index.tsx`) is a custom
  component, separate from the native splash Expo shows before JS loads.
- Win-goal screen / "you won" state (`applyWinGoal` is called so the
  underlying flag gets set, but there's no dedicated UI for it yet).
- Starter guide / onboarding tooltips from the web version aren't ported.
- **Language toggle (EN/TH)** is functional and persisted, but only applied
  to the menu/settings/store screens via `useLang()`. The 4 game tabs still
  hardcode `.en` from the bilingual data (a full sweep would touch every
  screen -- straightforward but large; `useLang()`/`text.*.th` are ready for
  it).
- **Sound/music toggles** and the **Store's consumable boosts** are
  intentionally inert placeholders (no audio assets, no real IAP/payment
  SDK) -- "Remove Ads" persists `adsRemoved` for later use, and the
  "Rewarded Ads" entries are marked **Soon** with no watch-ad flow yet.
- **Single save slot**: "Continue" / "New Game (overwrite)" on the main menu
  cover the realistic single-slot case; there's no multi-slot save picker.

## Folder structure

```
app/
  _layout.tsx          root layout -- Settings/GameProvider + global modals/banner
  index.tsx             Main menu + splash
  settings.tsx          Settings screen
  store.tsx             Remove Ads / mock store
  game/
    (tabs)/
      _layout.tsx         bottom tab bar (Refinery/Staff/Business/Stats)
      index.tsx           Refinery: grid, build/upgrade modals, buy/sell
      staff.tsx           hire workers, train/assign employees
      business.tsx        contracts / research / perks / shipments / standing orders
      stats.tsx           era/ESG/season/progress/asphalt/log, rename, save, reset
src/
  game/                 ported pure logic (types, data, calculations, storage)
  components/           BuildingTile, BuildingGrid, ResourceBar, Sheet, ListRow,
                         ChoiceEventModal, AwardModal, EraBanner
  hooks/
    useGameLoop.ts       load/save/tick + all game actions (exports `tick` too)
    GameContext.tsx      shared provider/hook (useGame)
    useSettings.ts        AsyncStorage-backed preferences (language/audio/ads)
    SettingsContext.tsx   shared provider/hook (useSettingsContext, useLang)
  theme.ts              shared color palette
  buildingColors.ts     placeholder per-building tile colors
assets/icons/           30 isometric SVGs (generated, not wired in yet)
```
