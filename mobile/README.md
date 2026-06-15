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
  - **Refinery**: resource bar (money / crude / feedstock / waste /
    electricity / gasoline / ESG / season), the building grid, buy crude /
    sell gasoline, sell downstream products. A **🎯 Next** card under the
    header shows the nearest incomplete milestone with a live progress bar
    (tap to open Achievements). Tap an empty tile to **build** -- 12
    building types now, including **Power Plant** (Lv5, crude ->
    electricity), **Waste Treatment Plant** (Lv8, waste -> recycledMaterial),
    and **Polymer Plant** (Lv20, petrochemicals -> plasticPellets). Tap any
    of the 7 upgradeable buildings (storage/processing tanks, distillation,
    laboratory, maintenance workshop, sales office, and all 4 production
    plants) to **upgrade** its level (Lv1-3, each level boosts that
    building's bonus -- output for the 4 production plants), tap the title
    to **upgrade the refinery level** (cost + a cumulative-production
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
    -> Petrochemical Plant, polymerEngineer -> Polymer Plant) that boosts
    that plant's output.
  - **Business**: **Sell Products** (Sell 1/10/All for jetFuel, lubricants,
    petrochemicals, recycledMaterial, plasticPellets, with live prices and
    "no plants built yet" hints), an **⚖️ Feedstock Priority** card (0-200%
    stepper per built downstream plant, shown once any of the 3 is built),
    Contracts, Research, Perks (3 branches x 3 tiers), plus **Crude
    shipments** (order bulk crude with a real-time delay, see pending
    arrivals countdown) and **Standing orders** (recurring high-value sales
    with a cooldown).
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
  lubricants/jetFuel/petrochemicals (downstream plants, specialist- and
  plant-level-boosted, with feedstock + electricity shareRatio throttling),
  crude -> electricity (Power Plant), waste byproduct -> recycledMaterial
  (Waste Treatment Plant), petrochemicals -> plasticPellets (Polymer Plant,
  specialist- and plant-level-boosted), crude -> gasoline (incl.
  Efficiency-perk yield carry), ESG drift (incl. waste-overflow penalty),
  Energy Transition demand shift, staff XP/level-ups, era-advance detection,
  year-end award rollover, random events, real-time crude shipments.
  Autosaves every 5s via AsyncStorage. Settings (language/audio/ads) are
  stored separately so "Reset save" / New Game doesn't wipe them.

## Contracts List: NEW Badge + Newest-First + Collapsed Completed

The Contracts section showed every unlocked contract (26 total in
`CONTRACT_BALANCE`, in static `id` order) including ones completed long ago
-- by mid/late game this was a long, mostly-irrelevant list.

- **Sort**: incomplete contracts are now sorted by `unlockLevel` descending
  (ties broken by `id` descending), so the tier you *just* unlocked floats
  to the top instead of being buried among lower-tier contracts.
- **"NEW" badge** (`ListRow` new `badge?: string` prop, small orange pill
  next to the title): shown when `contract.unlockLevel === game.refineryLevel`
  -- i.e. "this contract just became available at your current level and
  you haven't completed it yet." No new persistent state needed: the badge
  clears itself either when you complete that contract, or when you level
  up again and a newer tier takes over as "current."
- **Completed contracts** move into a collapsed "▸ Completed (X)" toggle at
  the bottom of the section (local component state, default collapsed) --
  still reachable for reference, but no longer pushing active contracts off
  screen.

Verification: new contracts_ui.test.ts (13 assertions) checks the sort
order, that the NEW badge only ever applies to the current-level tier, that
it disappears on completion, and that leveling up moves the badge to the
new tier and clears it from the old one.

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

## Win Celebration

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

## Bugfixes: Choice Event Firing on First Load + Refinery Tab Not Scrollable

Two issues reported after the first post-update playtest on an existing
save:

1. **A choice event popped up immediately on opening the game.** Root
   cause: the "Event triggers reworked" change added
   `GameState.lastChoiceEventTick` and a fallback rule
   (`tickCount - lastChoiceEventTick >= CHOICE_EVENT_FALLBACK_TICKS`, ~4
   min). For an *existing* save (large `tickCount`, field didn't exist
   yet), migration defaulted it to `0` -- so
   `tickCount - 0 >= 1200` was already true on the very first tick after
   loading, firing the fallback choice event instantly. Fix
   (`gameStorage.ts`): migrate missing `lastChoiceEventTick` to the save's
   *current* `tickCount` (same pattern already used for
   `recruitmentRefreshAt`) -- "as if a choice event was just shown now",
   giving existing saves a full fallback window before the next one.
   New `choiceevent_migration.test.ts` (7 assertions) covers the old-save,
   fresh-game, and already-migrated cases.

2. **The 🔄 Auto-trade toggle was impossible to find.** The Refinery tab
   (`index.tsx`) was a plain `SafeAreaView` with no `ScrollView` -- after
   adding the 🎯 Next Goal and 🔥 Boost cards on top of the existing grid /
   actions / product chips / Auto-trade card, the total content no longer
   fit on screen and there was no way to scroll down to it. Fix: everything
   below the refinery name/level header is now wrapped in a `ScrollView`
   (matching the Staff/Business/Stats tabs, which were already
   scrollable).

3. **Auto-trade made crude/gasoline numbers look "frozen".** `applyAutoTrade`
   ran every tick and corrected crude/gasoline to *exactly* the threshold
   %, every single tick -- since production also runs every tick, the
   level gets snapped back to the same number constantly and the display
   never visibly moves. Fix: new `AUTO_TRADE_BUFFER_PERCENT = 10` constant
   (`CORE_BALANCE`). Buying now overshoots to `(buyThreshold + buffer)%`
   and selling undershoots to `(sellThreshold - buffer)%`, so the level
   drains/refills visibly via production between corrections (sawtooth)
   instead of being pinned flat. `autotrade.test.ts` updated for the new
   targets plus new assertions: visible fluctuation over 1000 ticks, and
   buying never overshoots past `(buyThreshold + buffer)%`.

## Staff Tab: Show What Each Role Does + Assign Targets a Named Plant

`WORKERS[].description` (bilingual, e.g. "Operator -- +10% production
rate") already existed in the data but was never shown anywhere -- hiring
felt opaque.

- Recruitment candidates and "Your team" cards now show
  `worker.description.en` as a small green line under the level/XP info --
  e.g. "Aviation Specialist" -> "+20% jet fuel production per worker".
- The existing per-type "Assign" mechanism (`toggleAssignment`,
  `game.assignments[type]`, capacity = number of matching plants built) now
  names the target plant: "Assign to Jet Fuel Plant (1/2)" /
  "Assigned -- Jet Fuel Plant" instead of just "Assign (1/2)". New
  `SPECIALIST_PLANT_NAME` map built from `PLANT_PRODUCTION[].specialistWorker
  -> buildingKey -> BUILDINGS[buildingKey].name`.

Note: assignment is still per-*type* with a capacity cap (e.g. "up to 2
Aviation Specialists boost all Jet Fuel Plants combined"), not
per-building-instance ("assign Bob to the plant at grid cell 5") -- see the
Building Info section below for how per-instance-feeling assignment works
within this existing model.

## Building Info Sheet: Rates, Green Bonuses, In-Place Staff Assignment

Previously, tapping a built tile did nothing for 6 of the 9 building types
(only crude tank / distillation unit / product tank opened an "Upgrade
building" popup with just a cost). Every `BUILDINGS[type].description` was
already written but never shown anywhere.

- Tapping **any built tile** now opens a "Building Info" sheet: the
  building's name/level, its full description, and one or more live effect
  lines (`getBuildingEffectLines`, new pure exported function in
  `gameCalculations.ts`, `building_info.test.ts` -- 19 assertions):
  - **Crude Tank / Product Tank**: current storage contribution (`+25` at
    Lv1, `+50` at Lv2, `+100` at Lv3), with the next level's *increase*
    shown in green, e.g. `+25 (+25 at Lv2)`.
  - **Distillation Unit**: current production/feedstock speed bonus (`+0%`
    at Lv1, `+25%` at Lv2, `+50%` at Lv3), green delta to next level.
  - **Lubricant Plant**: fixed `5 lubricants / 5s` per plant -- no
    upgrades or specialists exist for this building, so never shows a
    green bonus (intentional, not a bug).
  - **Jet Fuel Plant / Petrochemical Plant**: base `5 <product> / 5s`, plus
    green `(+N from M Aviation/Chemical Specialists)` when specialists are
    assigned (uses the existing `getSpecialistMultiplier`).
  - **Laboratory / Maintenance Workshop / Sales Office**: their flat
    Lv1 bonus (+10% RP / -50% event penalties / +10% contract rewards), plus
    a "x{count} = {total}" note if you've built more than one (workshops
    stack multiplicatively, lab/sales office additively -- matches
    `calculateDerivedStats`).
- **Upgrade row** (crude tank / distillation unit / product tank only):
  moved into this same sheet, unchanged cost/logic.
- **In-place specialist assignment** (jet fuel / petrochem plants only):
  the sheet lists every hired Aviation/Chemical Specialist with an
  Assign/Unassign button and an "ASSIGNED" badge (reuses `ListRow`'s badge
  prop and the existing per-type `toggleAssignment`/`assignments`/capacity
  system) -- so assigning staff *feels* per-building even though the
  underlying model is still "up to N specialists boost all plants of this
  type". A hint line under the section title spells this out explicitly
  ("Shared pool across all N <Plant>s -- assigning here boosts their
  combined output, not just this tile") -- with 2+ plants of the same type,
  the assignment list/capacity/ASSIGNED badges are identical no matter
  which plant's info you open, and unassigning from either affects the
  shared bonus for all of them. Added after a clarifying question about
  exactly this multi-plant case.

Verification: tsc --noEmit clean. building_info.test.ts (19 assertions)
covers every building type's effect-line text and bonus-clamping at max
level / no-specialist-assigned. Existing suites unaffected: 2000-tick sim
(10,106), autotrade (3018), recruitment (647) + migration (11),
refinery_balance (19), events (19) + events_long (8), milestones (25),
win_celebration (12), boost (20), combos (16), contracts_ui (13),
choiceevent_migration (7), translation-key checks (38) all still pass.
EXPO_OFFLINE web export still produces all 14 routes.

## Bugfix: Petrochemical Plant Could Produce Nothing for ~3-4 Minutes

Reported: "Jet/Petro produce from what? Petro is built but its inventory
isn't going up." Jet Fuel and Petrochemical Plants (like Lubricant Plant)
consume **feedstock**, not crude directly -- feedstock is made by
Distillation Units from crude. All downstream plants check eligibility
against the SAME shared feedstock pool every 25-tick (5s) cycle.

Root cause: with 1 of each plant built and only 1 Distillation Unit (a very
common "just unlocked petrochem" setup), feedstock supply (~12.5/cycle) is
well below total demand (lubricant 6 + jet fuel 8 + petrochem 10 = 24/cycle).
The original code was first-come-first-served in a fixed order (lubricant ->
jet fuel -> petrochem): whichever plant was checked first got its FULL
feedstockNeeded or nothing, so the front-of-queue plants produced at 100%
while petrochem (last, needing the most) got 0% until lubricant's 200-unit
storage filled up and stopped competing. Simulated: petrochemicals stayed at
0 until tick ~1125 (~3.75 min) before this fix.

A first attempt just reversed the processing order (petrochem first) --
rejected on review as "musical chairs": it fixes petrochem's case but now
*lubricant* is the one that can sit at 0% for minutes. Same problem, just
moved to a different plant.

**Real fix** (`useGameLoop.ts` tick()): every plant eligible this cycle
(built, on-interval, has storage room) now shares the feedstock pool
**proportionally** to its `feedstockPerCycle` need:
- If supply >= total demand: everyone gets their normal full output
  (`Math.round`, identical to the old behavior in the common case).
- If supply < total demand: `shareRatio = feedstock / totalDemand` (e.g.
  12.5/24 ~= 52%), and EVERY eligible plant produces
  `Math.floor(plantCount * outputPerCycle * specialistMultiplier *
  shareRatio)` -- scaled down by the same shortage ratio, never zero just
  because of queue position. All available feedstock is consumed
  (`feedstock = 0`) since it was fully distributed.

Simulated (1 of each plant, 1 distillation unit, shareRatio ~52%): all three
products now produce `floor(5 * 0.52) = 2` units on the very first cycle
(tick 25), and after 2000 ticks all three sit at exactly 160 (perfectly
balanced -- none favored, none starved). With 4 distillation units (supply >
demand), each plant gets its full 5 per cycle, unchanged from before.

Also updated: `getBuildingEffectLines` (Building Info sheet) warning line on
lubricant/jet fuel/petrochem now reflects proportional sharing -- "Feedstock
supply (X/5s) covers only Y% of total demand (Z/5s) -- all downstream plants
run at a reduced rate. Build more Distillation Units for full output." New
`BuildingEffectLine.warning?` field, rendered in `colors.orangeDark`.

`feedstock_priority.test.ts` (15 assertions): all three plants produce a
non-zero, IDENTICAL amount on the first cycle when feedstock is scarce
(proportional, same ratio); after 2000 ticks all three have substantial,
balanced output; with sufficient feedstock (4 distillation units) each plant
gets its full outputPerCycle (5) unchanged; single-petrochem-no-competition
case unaffected; feedstock never goes negative over a 2000-tick run; the
feedstock warning (with coverage %) appears on all 3 plant types when demand
> supply and is absent when only lubricant is built.

Verification: tsc --noEmit clean. feedstock_priority.test.ts (15) +
building_info.test.ts (19, unaffected) + full suite (2000-tick sim 10,106,
autotrade 3018, recruitment ~645 + migration 11, refinery_balance 19,
events 19 + events_long 8, milestones 25, win_celebration 12, boost 20,
combos 16, contracts_ui 13, choiceevent_migration 7, translation-key checks
38) all pass. EXPO_OFFLINE web export still produces all 14 routes.

Note: this is complementary to (not a replacement for) the earlier "cap Jet
Fuel/Petrochem Plant at 1" discussion -- even with the cap, 1-of-each can
still hit this feedstock bottleneck (now shared fairly instead of starving
one); the real long-term fix is building enough Distillation Units, which
the warning now surfaces.

## Feedstock Priority: Player-Adjustable Allocation

Follow-up to the proportional-sharing fix above. Request: "can the % be
adjusted -- sometimes I want to lean toward one product, sometimes turn one
off entirely." The "cap Jet Fuel/Petrochem Plant at 1" idea was explicitly
deferred to backlog in favor of this.

New per-plant **priority weight** (0% to 200% in 25% steps, default 100%,
`FEEDSTOCK_PRIORITY_BALANCE` in `data/balance.ts`; new `GameState.feedstockPriority:
Record<'lubricantPlant'|'jetFuelPlant'|'petrochemicalPlant', number>`):

- **0% = off.** That plant is excluded entirely from the downstream loop --
  never produces, never competes for feedstock -- regardless of supply.
- **100% (default) = unchanged** from the plain proportional split above.
- **>100% = priority during scarcity.** The plant's *demand* is weighted up
  for the scarcity split, so it claims a bigger slice of `shareRatio` (closer
  to its own normal 100%) at the expense of lower-priority plants. Output is
  still capped at the plant's own normal 100% -- priority only helps you
  *reach* full output sooner under scarcity, never exceed it.
- When supply >= total (unweighted) demand, every eligible plant still gets
  full output regardless of priority -- weights only matter when plants are
  actively competing for a shortfall.

**UI**: new "⚖️ Feedstock Priority" card on the Refinery tab (same stepper
style as Auto-trade thresholds), shown once any of the 3 downstream plants
is built, with one row per *built* plant type and a one-line explainer of
what 0%/100%/200% mean. New `adjustFeedstockPriority(buildingKey, delta)`
action (useGameLoop.ts) nudges by `+/- step` (25%), clamped to [0%, 200%].

**Building Info sheet**: each of the 3 plants now shows a second line,
"Feedstock priority: X%" (orange warning if 0% = off), and the existing
feedstock-shortage warning now also suggests adjusting priority here as an
alternative to building more Distillation Units.

**Migration**: old saves (no `feedstockPriority` field) default every plant
to 100% -- identical to the proportional-sharing behavior they already had.
Out-of-range/invalid saved values fall back to 100% per-plant.

`feedstock_priority.test.ts` extended to 24 assertions: default behavior
unchanged (8, same as before); sufficient feedstock ignores priority except
0% (2); priority=0% is a hard off even with abundant feedstock (2);
de-prioritizing lube+jet (25% each) cumulatively shifts output toward
petrochem over 500 ticks (3); feedstock never negative with mixed priorities
(1); Building Info shows the priority line/warning correctly (4); migration
defaults/clamps/preserves `feedstockPriority` correctly (3 cases).

Verification: tsc --noEmit clean. feedstock_priority.test.ts (24) + full
suite (2000-tick sim 10,106, autotrade 3018, recruitment ~645 + migration
11, refinery_balance 19, events 19 + events_long 8, milestones 25,
win_celebration 12, boost 20, combos 16, contracts_ui 13,
choiceevent_migration 7, building_info 19, translation-key checks 38) all
pass. EXPO_OFFLINE web export still produces all 14 routes.

## Production Complexity Expansion: SHIPPED (Phases 1-3 + upgrade fix + UI)

The 3-phase roadmap below (originally logged as "deferred, not started") is
now fully implemented in `mobile/src/` (this codebase), across several
branches merged into `devMobile` on 2026-06-15:

- **Phase 1 (waste byproduct)**: `GameState.waste`, `WASTE_BALANCE`,
  `getWasteGeneratedPerTick` / `getWasteOverflowEsgPenalty`. New "Waste
  Treatment Plant" (Lv8, $6000, `WASTE_TREATMENT_PLANT_BALANCE`) converts
  waste -> new product `recycledMaterial` ($25/unit). Over-cap waste applies
  an extra ESG penalty on top of the existing dirty-building drift.
- **Phase 2 (power)**: `GameState.electricity`, new "Power Plant" (Lv5,
  $4000, `POWER_PLANT_BALANCE`) burns crude -> electricity. The 3 downstream
  plants each gained an `electricityPerCycle` cost; the existing feedstock
  shareRatio/priority loop in `useGameLoop.ts` now also computes an
  `electricityShareRatio`, and `combinedShareRatio = min(both)` -- whichever
  resource is scarcer governs the throttle. With 0 Power Plants built this
  is fully backward compatible (ratio stays 1).
- **Phase 3 (Polymer Plant / Plastic Pellets)**: new "Polymer Plant" (Lv20,
  $25000, `POLYMER_PLANT_BALANCE`) is a standalone tick block (NOT in
  `PLANT_PRODUCTION`, since its input -- `petrochemicals` -- is a different
  pool from the shared feedstock pool). Consumes 10 petrochemicals -> 5
  `plasticPellets` ($300/unit, ~2x petrochemicals) per cycle. Petrochemicals
  keep their dual role exactly as designed (still sellable raw AND now also
  an input). New specialist `polymerEngineer` (tier 3, Lv20, $8000, +20%/
  worker). `PlantProductionConfig.inputProduct?: ProductKey` added as
  documented (currently unused -- reserved for future tiers).
- **Plant-upgrade-output fix** (went beyond the original 3-phase scope,
  requested as a follow-up): all 4 production plants
  (lubricant/jetFuel/petrochemical/polymer) now have
  `...OutputBonusRateByLevel` tables (Lv1=0%, Lv2=+25%, Lv3=+50%, same shape
  as `distillationUnitBonusRateByLevel`), applied as a multiplier alongside
  the specialist multiplier. Root-cause fix: `upgradeBuilding()`'s
  `isUpgradeable` list only covered crudeTank/productTank/distillationUnit,
  so laboratory/maintenanceWorkshop/salesOffice (which already had
  `...ByLevel` tables) AND the 4 production plants were all permanently
  stuck at Lv1 in normal play -- their bonus tables were dead code. Now all
  7 buildings with `...ByLevel` tables are upgradeable.
- **Mobile UI** (Business tab): new "Sell Products" section
  (`SellProductRow`, Sell 1/10/All) for all 5 `SELLABLE_PRODUCTS`
  (jetFuel/lubricants/petrochemicals/recycledMaterial/plasticPellets), and
  a "⚖️ Feedstock Priority" card (`FeedstockPriorityRow` stepper) shown once
  any downstream plant is built. Building Info sheet's upgrade button and
  specialist-assignment section (`UPGRADEABLE` list, `getAssignmentCapacity`)
  were fixed to match -- previously had their own stale hardcoded lists.

Verification across all of the above: `tsc --noEmit` clean (mobile) after
every commit; isolated Node simulations for the electricity throttle (5
cases), waste/waste-treatment over 3000 ticks (2 cases), Polymer Plant
production (4 cases), and the plant-upgrade multiplier math (5 cases) --
all passed. No formal test suite run (none exists for `mobile/src/`; the
271-assertion suite referenced elsewhere in this doc is from an earlier
session and may be stale -- re-verify before relying on it).

**Not yet done from the original Phase 1-3 scope**: Tier-1 gasoline
production is NOT electricity-gated (only the 3 downstream plants +
Polymer Plant's own simple check) -- Phase 2's "ALL production buildings"
was intentionally scoped down to avoid touching the core gasoline-yield
formula. Polymer Plant's electricity consumption was also deferred (it has
no `electricityPerCycle` cost, unlike the other 3 plants) for the same
reason.

## What's NOT done / known gaps

- **Backlog: electricity-gate Tier-1 gasoline + Polymer Plant.** See "Not
  yet done from the original Phase 1-3 scope" above -- Phase 2's
  electricity throttle currently only covers the 3 original downstream
  plants. Extending it to Tier-1 gasoline production and adding an
  `electricityPerCycle` cost to Polymer Plant would complete the original
  "ALL production buildings" intent, but touches the core gasoline-yield
  formula (highest risk in the original Phase 2 description) -- do as its
  own focused change with its own verification pass.
- **Backlog: Grid Expansion Tier 4 (6x6)**. Current expansion ladder tops
  out at 5x5 (25 cells, Lv10, $100k) -- see `EXPANSION_BALANCE`. Production
  Complexity Expansion (above, now shipped) added 3 new building types
  (Waste Treatment Plant, Power Plant, Polymer Plant) on top of the
  existing 9 (12 total), which may push endgame layouts tight on a 5x5
  grid -- this is the "revisit" point the original note was waiting for.
  Still not started: measure actual endgame cell-usage with 12 building
  types before committing to a 6x6 (36 cells) tier gated to a high
  refinery level (~Lv20) with a cost well above the 5x5's $100k, following
  the existing `EXPANSION_BALANCE` pattern. Grid-size changes touch layout
  UI, save migration, and adjacency-combo balance, so keep this as its own
  phase.
- **Backlog: cap Jet Fuel/Petrochem Plant at 1 each.** Originally deferred
  in favor of Feedstock Priority (shipped above). Feedstock Priority's 0%
  setting already gives players a way to effectively "turn off" a plant
  without capping it structurally, which may address the underlying
  "1 flagship + 1 specialist" design intent well enough -- revisit only if
  players still build multiple Jet Fuel/Petrochem Plants in a way that
  feels unintended despite Priority being available. Not implemented.
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

## Bottom Tab Bar: Minimal, Blends Into the Game

The bottom tab bar previously looked like a standard app navigation bar:
white background, top border, icon + text label per tab -- visually
separate from the cream game screens above it.

- `tabBarStyle.backgroundColor` is now `colors.cream` (same as every
  screen's background), with `borderTopWidth: 0`, `elevation: 0`,
  `shadowOpacity: 0` -- no separate "bar" strip, the icons just sit on the
  same canvas as the game.
- `tabBarShowLabel: false` -- icon-only, four icons (Refinery / Staff /
  Business / Stats via `lucide-react-native`, unchanged icon set).
- The active tab gets a small rounded gold highlight behind its icon (new
  `TabIcon` wrapper, `colors.gold` + `radii.md`) instead of a text-label
  color change -- reads more like a pressed HUD button than a standard tab
  indicator.

Kept deliberately conservative (no `position: absolute` floating-pill bar
with custom screen padding) to avoid safe-area/layout regressions across
all four tabs without on-device testing -- a more dramatic "floating
island" bar is a possible follow-up if this blended look isn't enough.



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
