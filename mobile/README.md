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

- **🏭 Refinery** (home): resource bar (money / crude / feedstock / gasoline
  / ESG / season), the building grid, buy crude / sell gasoline, sell
  downstream products. Tap an empty tile to **build**, tap a crude tank /
  distillation unit / product tank to **upgrade**, tap the title to
  **upgrade the refinery level**.
- **👥 Staff**: hire all 9 worker types. "Your team" shows each employee
  (name, level, XP, ⭐ veteran trait), with a **Train** button (costs $ + RP,
  max level 5) and an **Assign** toggle for specialist roles
  (aviationSpecialist -> Jet Fuel Plant, chemicalEngineer -> Petrochemical
  Plant) that boosts that plant's output.
- **📋 Business**: Contracts, Research, Perks (3 branches x 3 tiers), plus
  **Crude shipments** (order bulk crude with a real-time delay, see pending
  arrivals countdown) and **Standing orders** (recurring high-value sales
  with a cooldown).
- **📊 Stats**: era progress, ESG score/tier, season, reputation,
  milestones, **Asphalt** production (once unlocked at Lv5), an **Activity
  log** (last 8 events), grid expansion, rename refinery, manual/auto save,
  reset.
- **Global overlays**: a **Choice Event modal** pops up periodically (pick
  option A or B), an **Era Banner** toasts when you advance to a new era, and
  a **Year-End Award modal** shows your grade/score/rivals ranking when a
  business year closes.
- **Full production tick** (200ms): crude -> feedstock (distillation) ->
  lubricants/jetFuel/petrochemicals (downstream plants, specialist-boosted),
  crude -> gasoline (incl. Efficiency-perk yield carry), ESG drift, Energy
  Transition demand shift, staff XP/level-ups, era-advance detection,
  year-end award rollover. Random events fire periodically; crude shipments
  arrive on a real-time delay. Autosaves every 5s via AsyncStorage.

## Architecture note

All game state/intervals live in **one** `useGameLoop()` instance, shared via
`GameProvider`/`useGame()` (`src/hooks/GameContext.tsx`) and mounted once in
`app/_layout.tsx`. Screens call `useGame()`, not `useGameLoop()` directly --
calling the hook in multiple screens would spin up duplicate tick/save/event
intervals.

## What's NOT done / known gaps

- **Icons are placeholders** -- colored boxes with 2-letter codes (CT, DU,
  PT...) on the grid, per `src/buildingColors.ts`. The 30 isometric SVGs
  generated earlier are in `assets/icons/` but not wired in (by request).
- **App icon / splash image**: not configured (Expo needs a 1024x1024 PNG).
- Win-goal screen / "you won" state (`applyWinGoal` is called so the
  underlying flag gets set, but there's no dedicated UI for it yet).
- Starter guide / onboarding tooltips from the web version aren't ported.

## Folder structure

```
app/
  _layout.tsx          root layout -- GameProvider + global modals/banner
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
  theme.ts              shared color palette
  buildingColors.ts     placeholder per-building tile colors
assets/icons/           30 isometric SVGs (generated, not wired in yet)
```
