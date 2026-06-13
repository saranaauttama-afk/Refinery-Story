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
> clean, `npm install` resolves all deps), but `npx expo start` itself
> hasn't been run end-to-end here -- please flag anything that breaks on
> first run.

## What's playable

- **🏭 Refinery** (home): resource bar (money / crude / feedstock / gasoline
  / ESG / season), the building grid, buy crude / sell gasoline, sell
  downstream products (lubricants/jetFuel/petrochemicals), tap an empty tile
  to **build**, tap a crude tank / distillation unit / product tank to
  **upgrade**, tap the title to **upgrade the refinery level**.
- **👥 Staff**: hire workers (9 types), each contributes its production
  bonus immediately via the existing `gameCalculations` multipliers.
- **📋 Business**: Contracts (complete when you have enough product),
  Research (spend RP), Perks (spend upgrade points, 3 branches x 3 tiers).
- **📊 Stats**: era progress, ESG score/tier, season, reputation,
  milestones, grid expansion, rename refinery, reset save.
- **Full production tick** (200ms): crude -> feedstock (distillation) ->
  lubricants/jetFuel/petrochemicals (downstream plants), crude -> gasoline
  (incl. Efficiency-perk yield carry), ESG drift, Energy Transition demand
  shift. Autosaves every 5s via AsyncStorage.

## What's NOT done / known gaps

- **Icons are placeholders** -- colored boxes with 2-letter codes (CT, DU,
  PT...) on the grid, per `src/buildingColors.ts`. The 30 isometric SVGs
  generated earlier are in `assets/icons/` but not wired in (by request --
  do this as a follow-up pass).
- **Individual staff (names/training/traits/specialist assignment toggle)**:
  hiring adds an `Employee` (via `createNewEmployee`, so veteran trait rolls
  etc. still happen and contribute to production), but there's no UI to
  train employees or toggle specialist assignments yet -- they sit at level
  1 with default assignment.
- **Random/choice events, shipments, asphalt production, standing orders,
  rivals/year-end awards rollover**: not ported. `tickCount` advances
  forever without a year-end modal; yearStats accumulate but nothing
  surfaces them yet.
- **App icon / splash image**: not configured (Expo needs a 1024x1024 PNG).

## Folder structure

```
app/
  _layout.tsx          root layout
  (tabs)/
    _layout.tsx         bottom tab bar (Refinery/Staff/Business/Stats)
    index.tsx           Refinery: grid, build/upgrade modals, buy/sell
    staff.tsx           hire workers
    business.tsx        contracts / research / perks
    stats.tsx           era/ESG/season/progress, rename, reset
src/
  game/                 ported pure logic (types, data, calculations, storage)
  components/           BuildingTile, BuildingGrid, ResourceBar, Sheet, ListRow
  hooks/useGameLoop.ts  load/save/tick + all game actions
  theme.ts              shared color palette
  buildingColors.ts     placeholder per-building tile colors
assets/icons/           30 isometric SVGs (generated, not wired in yet)
```
