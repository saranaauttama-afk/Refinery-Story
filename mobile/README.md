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
    products. A **🎯 Next** card under the header shows the nearest
    incomplete milestone with a live progress bar (tap to open
    Achievements). Tap an empty tile to **build**, tap a crude tank /
    distillation unit / product tank to **upgrade**, tap the title to
    **upgrade the refinery level** (cost + a cumulative-production
    requirement -- see below). A **🔥 Boost** card lets you trigger a
    temporary 2x gasoline production multiplier (with a cooldown -- see
    below), and a **🔄 Auto-trade** card lets you toggle automatic crude
    top-ups / gasoline sell-offs with adjustable thresholds (±5% steppers)
    -- see below.
  - **Staff**: a **Recruitment** pool shows 3 candidates at a time (random
    unlocked worker type + quality tier -- see below), refreshing
    automatically every ~2 min, plus a paid "🔄 Refresh" button. "Your team"
    shows each hired employee (name, level, XP, 🎖 veteran trait), with a
    **Train** button (costs $ + RP, max level 5) and an **Assign** toggle for
    specialist roles (aviationSpecialist -> Jet Fuel Plant, chemicalEngineer
    -> Petrochemical Plant) that boosts that plant's output.
  - **Business**: Contracts, Research, Perks (3 branches x 3 tiers), plus
    **Crude shipments** (order bulk crude with a real-time delay, see
    pending arrivals countdown) and **Standing orders** (recurring
    high-value sales with a cooldown).
  - **Stats**: era progress, ESG score/tier, season, reputation, a
    **Milestones** row linking to the full **🏆 Achievements** screen (all
    16 milestones with name/requirement/reward, progress bars for
    count-based ones, locked vs completed styling), **Asphalt** production
    (once unlocked at Lv5), an **Activity log** (last 8 entries), grid
    expansion, rename refinery, manual/auto save, reset, and links to
    Settings/Store. Also a **☰ Main Menu** link back to `/`.
- **Global overlays**: Choice Event modal (now milestone-triggered, see
  below), year-end Award modal, Era-advance banner.
- **Full production tick** (200ms): crude -> feedstock (distillation) ->
  lubricants/jetFuel/petrochemicals (downstream plants, specialist-boosted),
  crude -> gasoline (incl. Efficiency-perk yield carry), ESG drift, Energy
  Transition demand shift, staff XP/level-ups, era-advance detection,
  year-end award rollover, random events, real-time crude shipments.
  Autosaves every 5s via AsyncStorage. Settings (language/audio/ads) are
  stored separately so "Reset save" / New Game doesn't wipe them.

## Hidden Combo Discovery

Same pattern as the Achievements screen earlier: `HIDDEN_COMBOS` (5 entries,
`data/hiddenCombos.ts`), `getNewlyDiscoveredCombos()`, and
`GameState.discoveredCombos` (sanitized in `gameStorage.ts`) were all
already fully built -- but nothing on mobile ever called
`getNewlyDiscoveredCombos`, so combos could never actually be discovered.

Each combo is a specific set of 3 distinct building types placed in any 3
consecutive cells of a row or column (order-independent), awarded once per
save:

- **Full Refinery Line** (crude tank + distillation unit + product tank):
  +$300, +5 RP
- **Command Center** (laboratory + maintenance workshop + sales office):
  +$500, +8 RP
- **Jet Set Row** (distillation unit + jet fuel plant + sales office):
  +$800, +12 RP
- **Refining Triangle** (distillation unit + lubricant plant +
  petrochemical plant): +$1,200, +15 RP
- **Petrochemical Complex** (lubricant plant + jet fuel plant +
  petrochemical plant): +$2,000, +25 RP, +10 reputation

Wiring: `placeBuilding` (the only action that changes a grid cell's
*type*) now calls `getNewlyDiscoveredCombos(next.grid, next.discoveredCombos)`
after placing -- applies all newly-matched combos' cash/RP/reputation
rewards, appends their keys to `discoveredCombos`, and logs a "🧩 Combo
found: ..." activity-log entry. A new `ComboDiscoveryBanner` (teal,
auto-dismisses after 6s, same shape as `EraBanner`) pops for the first
newly-found combo, plus a success haptic. The `/achievements` screen shows
a "🧩 Hidden Combos: X/5 discovered" card listing the *names* of combos
already found (per the existing "deliberately not shown ahead of time"
design -- undiscovered combos stay a mystery, just a hint to experiment
with layouts).

Known minor edge case: `EraBanner` and `ComboDiscoveryBanner` share the same
screen position/z-index, so if both fire in the same tick they'd visually
stack. Low probability (era advances are milestone/level-driven, combo
discovery is placement-driven) and not addressed here.



`prototypeCompleted` (Lv10+ refinery, reputation >= 250, contract #7 done,
grid expansion >= 2) used to silently flip to `true` in `applyWinGoal` --
nothing in the UI ever showed it.

- `useGameLoop`'s `update()` now detects the `false -> true` transition
  (`!current.prototypeCompleted && next.prototypeCompleted`) and sets
  `pendingWinCelebration`.
- New `WinCelebrationModal` (registered in `GlobalOverlays`, root layout):
  a full-screen "🎉 Prototype Complete!" card with a snapshot of key stats
  (level, reputation, money, lifetime gasoline) and a "Keep Playing"
  dismiss button -- the game doesn't stop, this is just the moment
  acknowledged. Also fires a success haptic.
- The `/achievements` screen shows a "🏁 Prototype Complete" banner at the
  top if `game.prototypeCompleted` is already true (so players who reach it
  again via a fresh look, or already had it on an existing save, see
  confirmation -- though the modal itself only fires once, on the
  transition).

## 🔥 Active Boost

A player-activated temporary production multiplier -- gives players
something to actively tap, addressing "feels like just waiting."

- `BOOST_BALANCE` (`data/balance.ts`): `durationTicks=150` (~30s active),
  `cooldownTicks=600` (~90s cooldown *after* the active window, i.e. ~2min
  total cycle from activation), `productionMultiplier=2`.
- New GameState fields (mobile-only): `boostActiveUntilTick`,
  `boostAvailableAtTick` (both 0 initially, migrated via `getSafeNumber`
  fallback 0).
- In `tick()` (`useGameLoop.ts`), while `tickCount < boostActiveUntilTick`
  the gasoline-production clock advances by `TICK_MS *
  productionMultiplier` instead of `TICK_MS` each tick -- i.e. ~2x gasoline
  output rate. Only affects the core gasoline clock (not
  distillation/downstream plants), keeping the effect simple and
  immediately visible.
- `activateBoost()`: no-op while active or on cooldown
  (`canActivateBoost`/`isBoostActive`/`isBoostOnCooldown`, all pure and
  exported for testing).
- UI: a 🔥 card on the Refinery screen (above Auto-trade) shows either an
  "Activate Boost" button, an active progress bar + "Xs left", or a
  "recharging" progress bar + countdown, using the animated `ProgressBar`.

## Feel / Feedback Polish

A few cheap, broadly-applicable "juice" additions that don't depend on
final art (pure style/animation wrappers, swappable later without touching
this logic):

- **`AnimatedPressable`** (`src/components/AnimatedPressable.tsx`): drop-in
  `Pressable` replacement that springs content to 96% scale on press-in and
  back on release. Uses RN core `Animated` (no reanimated babel plugin
  needed). `style` (background/border/layout) stays on the outer
  `Pressable`, so swapping in real art later needs no layout changes. Used
  for Buy Crude / Sell Gas / product chips / refinery-upgrade header
  (Refinery tab), and Hire / Refresh / Train (Staff tab).
- **Floating +/- numbers** (`useFloatingNumbers` + `FloatingNumbers`):
  small "+$180" / "-$100" toasts that rise and fade (900ms) in the top-right
  of the Refinery and Staff tabs, spawned on buy/sell/hire/train/refresh/
  refinery-upgrade using amounts computed from current state (so they
  always match what the action will actually do, including the "sell what
  you actually have" clamping).
- **Animated `ProgressBar`**: width transitions now animate (400ms) instead
  of snapping -- used by the Achievements screen, the 🎯 Next Goal card, and
  the 🔥 Boost card.
- **Building tile glow** (`BuildingTile`/`BuildingGrid`): crude tank,
  distillation unit, and the three downstream plants get a slow pulsing
  gold-border glow whenever the refinery is active (`crudeOil > 0`) --
  storage/support buildings (product tank, lab, workshop, sales office)
  don't pulse. The glow is a separate `Animated.View` overlay on top of the
  existing color-block visual, so swapping in real building art later needs
  no changes here.
- **Worker badge** (`BuildingTile` `showWorker` prop): minimal stand-in for
  a future Kairosoft-style walking-sprite layer. When the refinery is
  active *and* at least one employee is hired, active production tiles show
  a small bobbing "👷" in the corner (translateY loop, no new assets). Not
  per-employee placement -- just a "staff are working" presence indicator.
- **Haptics** (`useHaptics`, via `expo-haptics`): light tap on buy/sell/
  refresh, medium "confirm" thunk on hire/train/build/upgrade, and a success
  notification whenever a new milestone completes (tracked globally in
  `app/_layout.tsx` via `completedMilestoneKeys.length`). All gated by the
  existing "Sound effects" setting (now does something even without audio
  assets) and wrapped in try/catch (no-ops on web/unsupported devices).

Not done (need real assets first): actual sound effects (no audio files in
the project yet -- haptics cover the "feedback" role for now), and a true
walking-sprite system (the 👷 badge above is a static-position placeholder;
real sprite sheets + a frame-animation/movement layer would replace it).



The existing ~16-entry milestone system (`completedMilestoneKeys` /
`MILESTONES`) was fully computed in `derived.activeMilestones` but never
shown anywhere -- the Stats tab just displayed a count ("Milestones: 6
completed"). Two additions surface this as actual gameplay goals:

- **`getMilestoneProgress(game, key)`** (in `gameCalculations.ts`, pure,
  exported): for the ~10 milestones that are simple count thresholds
  (firstFuel: gasoline produced, smallSupplier/contractVeteran: contracts
  completed, refineryLevel5, reputedSupplier, fullWorkforce: worker types
  hired, etc.) returns `{ current, target }`, clamped to target. Returns
  `null` for the remaining ~6 "build X" / "complete a Tier 3 contract"
  style milestones that aren't a single count. `activeMilestones` now
  includes this as `progress`.
- **`/achievements` screen**: full checklist of all milestones --
  🏆/🔒, name, requirement, reward, with a `ProgressBar` (new shared
  component, `src/components/ProgressBar.tsx`) for count-based ones.
  Reachable from a new "Milestones" row on the Stats tab (now shows
  "X / 16 completed" and links out).
- **🎯 Next goal card** on the Refinery screen (right under the header):
  shows the *first incomplete* milestone in `activeMilestones` order with
  its progress bar (or requirement text if not count-based). Tapping it
  opens `/achievements`. Gives players a constant, concrete "what am I
  working toward right now" without digging into tabs.



Random and choice events used to fire on real-time `setInterval`s (every
30s / 60s), independent of the main `tickCount`-based game loop. That caused
two problems: (1) the timers and `tickCount` could drift on background/
resume, and (2) choice-event popups felt like random interruptions
disconnected from what the player was doing.

Both are now checked from inside the main tick effect (`src/hooks/
useGameLoop.ts`):

- **Random events** (equipment wear, market blips, etc.):
  `shouldFireRandomEvent` -- checked every `RANDOM_EVENT_INTERVAL_TICKS`
  (150 ticks, ~30s of game time), and only fires if the refinery is
  **active** (`crudeOil > 0`). An idle refinery with no crude to process
  doesn't generate "equipment wear" or similar operational events.
- **Choice events** (the A/B decision popup) are now primarily
  **milestone-triggered**: `hasNewMilestone` checks whether
  `completedMilestoneKeys` grew this tick/action (hooking into the existing
  ~15-entry milestone system -- firstFuel, smallSupplier, refineryLevel5,
  jetFuelPioneer, etc.). Checked both in the main tick effect (for
  production-driven milestones) and in `update()` (for action-driven ones
  like completing a contract or hiring), so the popup follows directly from
  what just happened. A **fallback** (`shouldFireChoiceEventFallback`, new
  `lastChoiceEventTick` field, 1200 ticks = ~4 min) still fires if no
  milestone has completed in a while, so longer gaps between milestones
  don't go event-free. Only one event can be pending at a time
  (`pendingChoiceEventRef`).

In a 40-minute simulation: 2-4 milestone-triggered events fire in the first
~3 minutes (as early milestones complete), then fallback events fire exactly
every 4 min for the rest of the run; random events fire ~every 30s
throughout (gated on `crudeOil > 0`).



The old refinery-level upgrade cost was linear (`55 + 35*level`) and barely
scaled: the cumulative cost to reach Lv15 (which unlocks the $15,000
Petrochemical Plant) was only ~$5,025 -- less than a third of the building it
unlocks, so leveling up was nearly a free, no-thought action.

`getUpgradeCost` (in `gameCalculations.ts`) is now **quadratic**:
`60 + 18*level^2`. Cumulative cost to Lv10 (~$5,670, vs the $8,000 Jet Fuel
Plant) and Lv15 (~$19,110, vs $15,000) now roughly track what each level
unlocks, without exploding at very high levels the way an exponential curve
would.

Upgrading also now requires a **cumulative lifetime gasoline production**
threshold (`getUpgradeProductionRequirement` = `50 * level`), checked
alongside the cost in `upgradeRefinery()`. This mainly matters early
(Lv1-5ish) -- it forces "build a basic production line and run it for a bit"
before the first few upgrades, rather than buying Lv2+ with an empty grid.
At higher levels an active refinery has long since cleared this, so cost
becomes the dominant gate again. The Refinery tab's header shows whichever
condition isn't met yet ("Produce X/Y gasoline to unlock" or "Need $X").

In a 30-minute simulation with active building/auto-trade, this reaches
~Lv24 (23 upgrades) -- the production gate blocks for ~2.8 min total early
on, then cost becomes the binding constraint for the rest of the run.



Replaces the old "flat list of 9 always-available worker types" with a
"3 candidates apply, pick one" flow (`src/game/data/recruitment.ts`):

- Each candidate is a random unlocked worker type + a **quality tier**:
  Rookie (Lv1, ×1.0 cost), 🔹 Skilled (Lv2, ×1.5), 🔸 Expert (Lv3, ×2.5), or
  ⭐ Star (Lv4, ×4.0, **always** comes with the Veteran trait). Any
  non-Star candidate also has the normal 5% chance to roll Veteran
  (🎖, +20% effectiveness).
- Tier weights shift with refinery level -- early game is mostly Rookies;
  by Lv10+, Skilled/Expert/Star become much more common (Star: 1% -> 5% ->
  10%), so "นานๆ มี Star มาที" but a bit more often as the refinery grows.
- **Hiring** a candidate immediately refills that slot with a fresh roll;
  the other 2 slots are untouched. The **whole pool** also auto-refreshes
  every ~2 min (`RECRUITMENT_BALANCE.refreshIntervalTicks`), and a
  "🔄 Refresh" button re-rolls all 3 for a small fee (`$200 + $20 per
  refinery level`) and resets that timer.
- Candidate names are pre-assigned from `STAFF_NAME_POOL` via a dedicated
  counter (`recruitmentNameCounter`) so a candidate's displayed name doesn't
  change before you hire them.

`applyRecruitmentRefresh` (in `useGameLoop.ts`) is a pure function, exported
for testing, run after the main tick. Pool/refresh state is part of the game
save (migrates/regenerates cleanly for older saves -- see
`getSafeRecruitmentPool` in `gameStorage.ts`).



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
