# Refinery Story — Roadmap

Living plan for the game's design + balance direction. Status markers:
`✅ done` · `🚧 in progress` · `⏳ planned`. Newest work is tracked here;
deep implementation notes still live in `README.md`.

Verify every change with `npx tsc --noEmit` **and** `npm run sim:check` (a
headless full-playthrough balance gate, see below). `npm run sim` /
`npm run sim:balance` print detailed reports; the web-export screenshot loop
covers visuals.

---

## Recently shipped (depth pass — recurring decisions + tension)

Adds the "recurring decisions / tension that forces choices" the roadmap flagged
as the game's main gap. All `tsc`-clean and guarded by `npm run sim:check`.

- ✅ **Rubber-band rivals + rank-based grade** — three rival refineries
  (`data/rivals.ts`) whose year-end scores track the player's best year
  (`rubberBandFactor`), so the #1 fight stays a real contest instead of being
  left behind mid-game. The annual grade is now the finishing *rank* (#1 S …
  #4 C), and the ceremony (`AwardModal`) shows the leaderboard with taunts /
  concede lines and rank movement. Produces a natural grade spread.
- ✅ **Season price forecast** — the HUD "Season" row shows where the seasonal
  swing is heading and the ETA to the next peak/trough (`getSeasonForecast`), so
  buy/sell timing is a readable decision, not a hidden sine wave.
- ✅ **More discovery content** — 4 new hidden combos (Tank Farm, Powered Line,
  Green Loop, Polymer Line) and 3 calendar-tied hidden events (Weekend Lubricant
  Run, Mid-Month Green Grant, Month-End Jet Haul).
- ✅ **Prestige perks** — each prestige now grants a permanent *choice* of one
  Legacy Perk (`data/prestigePerks.ts`: Refined Process, Market Maven, Lean Crew,
  Green Legacy, Frugal Upkeep, War Chest) that stacks with the per-level bonus
  and carries across every New Game+. Owned perks leave the pool, so the choice
  narrows over runs. `getPrestigePerkEffects` is the single source of truth.
- ✅ **Crises with teeth** — ignoring a crisis now actually hurts: a time-boxed
  production throttle (`GameState.productionPenalty`, read every tick), a real
  building downgrade (power surge), or a crude-stock drain (shortfall) — no more
  cosmetic one-off nicks that didn't match the scary descriptions.
- ✅ **Rotating "Rush Orders"** — transient, time-limited premium contracts
  (`data/rotatingContracts.ts`) that appear on their own, pay ~1.7× the goods'
  raw value, scale to refinery level, only ask for products you can make, and
  expire on a deadline. A short-horizon "drop everything and pivot?" decision on
  top of the permanent ladder. Shown in the Contracts tab with a live countdown.

---

## Recently shipped (balance audit + sim infrastructure)

A full balance pass driven by headless simulation. All `tsc`-clean and guarded by
`npm run sim:check`.

- ✅ **RN-free tick (`src/game/utils/gameTick.ts`)** — `tick` + `applyAutoTrade`
  extracted from `useGameLoop` (which imports react-native) so a Node sim can run
  the real per-tick economy end to end. Behaviour identical; the hook imports them.
- ✅ **Balance sims** — `scripts/balance-sim.ts` (crude wave, saturation, incident
  curve, progression, prestige, staff ROI, auto-trade regimes) and
  `scripts/full-loop-sim.ts` (a faithful auto-pilot playthrough using real
  contracts + standing orders; reaches Industry Legend in ~2h26m, gated by
  RP/all-research). `scripts/sim-check.ts` asserts the invariants (Legend
  reachable in budget, every endgame goal completes, award grades spread C→S, no
  NaN) and exits non-zero on regression.
- ✅ **Prestige → output, not speed** — the New Game+ bonus was folded into the
  gasoline *speed* multiplier, which floors at `minProductionMs` by ~Lv4, so it
  was silently wasted. Now a flat yield/output bonus (`prestigeOutputMultiplier`)
  on gasoline yield-per-batch and every downstream plant.
- ✅ **Speed-floor recovery** — the whole speed branch (operators, morale,
  production research, refinery/distillation speed, industrial spec, power
  adjacency) was dead past the gasoline speed floor. The clamped-away portion is
  now recovered as a yield bonus (`speedOverflowYieldMultiplier`): no-op until the
  floor, then it keeps those investments paying off.
- ✅ **Staff tension** — diminishing returns on stacking the same worker type
  (`count^0.7`, `BONUS_BALANCE.workerStackDiminishingExponent`) + roughly doubled
  wages, so "fill every bench slot" is a real decision, not an auto-answer.
- ✅ **Auto-trade smarts** — high-value downstream products HOLD when their price
  is depressed but still dump to avoid overflow (`autoSellMarketFloor` /
  `autoSellOverflowGuardPct`); gasoline (overproduced commodity) keeps flowing for
  throughput. Shared `autoSellTargetPct`.
- ✅ **Annual award fix (was unreachable)** — `yearStats.gasolineProduced` was
  never incremented and sales weren't credited to `moneyEarned`, so the award was
  contracts-only and S-grade (an endgame goal) was impossible. Both now feed the
  score; thresholds retuned (S 1400→5000) — grades progress C→B→A→S naturally.
- ✅ **Polymer Plant margin** — was 10 petrochem ($1,500) → 5 pellets ($1,500), a
  zero-value-add top-tier plant. Now 6 petrochem → 5 pellets = +$600/cycle.
- ✅ **Discoverability cues** — gasoline is electricity-gated, and an under-built
  power grid silently starves it; the HUD now shows a "⚡ Low power" flow warning,
  a power-balance meter (gen vs demand) in More Info, an endgame-goal nudge once
  the milestone ladder is exhausted, and a "↓ low" cue on the gasoline sell button.
- ℹ️ **Finding** — repeatable contracts are NOT needed: standing orders already
  sustain endgame RP/reputation/cash (the sim reaches Legend on real systems).
- ℹ️ **`ICONS_NEEDED.md`** — spec for swapping the 33 inline-SVG icons to raster.

---

## Recently shipped (UI legibility + cleanup pass)

Merged to `devMobile` via PR #3. All `tsc`-clean + screenshot-verified (EN/TH).

- ✅ **Flow-rate HUD bar** — a strip under the resource dock shows **net $/min**
  and **output/min** with a profit/loss/idle dot, derived from real state deltas
  over a rolling ~30s tick window (`useGameLoop`) so it reflects every system
  (market / morale / specialization) and freezes on pause.
- ✅ **Full bilingual (EN/TH)** — every gameplay tab (factory + contracts /
  supply / recruit / research / company) now goes through `useLang()`'s `t()`;
  new string blocks in `translations.ts` (`hud`, `nav`, per-screen blocks,
  `eventsSheet`, `hiddenEventBanner`). (Event-log content still mixed.)
- ✅ **HUD declutter** — dock trimmed to 4 core stats (money / crude / gas /
  rep); ESG / morale / specialization / feedstock / season / era moved into the
  "More Info" sheet, with an alert dot when ESG or morale drops low.
- ✅ **Dedicated R&D tab** — Research + Perks pulled out of the Company hub into
  their own `research.tsx` tab (🔬), one tap from the bottom nav.
- ✅ **Shared `ScreenHeader`** + a guiding empty state on Contracts; fixed the
  hidden-event banner/nav that pointed at the removed Business/Staff tabs.
- ✅ **Dead-code removal (~3.7k lines)** — five unregistered legacy screens, two
  unused factory-view components, and the two dev prototype routes.
- ✅ **Event-system consolidation** — cut 12 trivial auto-apply random events
  (free resources / no decision); kept the four real incidents as an ESG-gated,
  safety-officer-mitigated managed risk. Decisions now live in the choice pool.
- ✅ **Art-slot pipeline** — `ArtSlot` + `src/art/registry.ts` render labelled
  placeholders for raster art that can't be code-drawn; `ASSETS_NEEDED.md` is the
  artist's spec sheet. Drop a PNG in `assets/art/` + register one line to swap in.

---

## Recently shipped (game-feel + UX pass)

- ✅ **Bug fixes** — hidden-event `staff` reward now updates `workerCounts`;
  `completeContract` refactored out of 7-deep ternaries; `applyAutoTrade`
  reuses precomputed `DerivedStats`.
- ✅ **Living map** — plants puff smoke while actually producing
  (`PlantSmoke`); a delivery truck drives across the yard on each trade
  (`DeliveryTruck`).
- ✅ **Juice** — confetti bursts on milestone / win / combo / S–A year
  (`Confetti`); year-end `AwardModal` is an animated reveal ceremony.
- ✅ **Sound** — `expo-audio` system with guarded playback + a "Sound effects"
  setting; SFX wired to buy/sell/build + celebration chimes. Ships short
  placeholder WAVs (drop nicer files over `assets/audio/*`). BGM is a no-op
  until a track is added (`sounds.ts` `BGM_SOURCE`).
- ✅ **Custom font** — Baloo 2 loaded at startup, applied to hero UI text.
- ✅ **HUD redesign** — persistent money/crude/gas/ESG/rep bar (no longer
  covered by event banners, which moved below via `OVERLAY_BANNER_TOP`);
  debug tile labels hidden; persistent bottom nav bar replacing the hamburger
  FAB; factory grid dropped down off the HUD (`GRID_DROP`).
- ✅ **Pause-model time + speed control** — crude shipments are tick-based (no
  more wall-clock), folded into the main tick; a speed pill cycles
  1× / 2× / 3× / ⏸ (drives the tick interval period). Pure pause model: closing
  the app freezes everything, no offline progress (the Kairosoft model).

---

## Balance tuning (from the economy audit)

Findings (see audit): downstream margins (2.5–5×) dwarf gasoline (1.8×) so
later products obsolete earlier ones; late-game money inflates because sinks
are weak; tier-1 contracts don't beat spot-selling.

- ✅ **P0 — Contract rewards** — tier-1 contracts now clearly beat spot
  gasoline ($22–24/unit vs $18).
- ✅ **P0 — Ongoing money sink** — annual building maintenance
  (`MAINTENANCE_BALANCE`) deducted at year-end, shown in the ceremony.
- ✅ **P1 — Margin compression** — handled structurally by the Dynamic Market's
  demand saturation (over-producing one product crashes its own price).

---

## Feature roadmap (design direction)

Ordered by impact. The throughline: the game is mechanically rich but light on
*recurring decisions* and *tension that forces choices*. These add both.

### 1. 🥇 Dynamic market (`✅ shipped` — flagship)
Crude spot price swings on a deterministic wave (buy when cheap); each product
has demand saturation that drops on selling and recovers over time, so flooding
one product tanks its own price. Surfaced in the trade panel (live crude price
+ cheap/high hint). Resolves the margin-gap balance item structurally.
Follow-ups: a fuller market panel/price graph; expose saturation per product in
the sell UI; tie crude waves to events (supply shocks).

### 2. 🥈 Specialization / forced tradeoffs (`✅ shipped`)
Permanent one-time choice at refinery Level 5 between Green and Industrial paths.
**Green** — ESG regen ×1.5, sell price +10% eco-premium, wages −20%, year-end
reputation +15, but production −10%. **Industrial** — production output +15%,
crude storage +25%, contract cash +20%, maintenance −25%, but ESG decay ×1.3.
Triggered via the ChoiceEvent modal on upgrade; shown as a badge in the HUD.
Save-safe (old saves default to no specialization).

### 3. 🥉 Layout / adjacency as a first-class system (`🚧 in progress`)
- ✅ **Negative adjacency** — a lab / sales office adjacent to a heavy
  polluting plant loses 50% of its bonus (`LAYOUT_BALANCE`), surfaced as a
  warning line in the tile info sheet. Makes placement a tradeoff.
- ✅ **Synergy auras** — each built tile shows a colored diamond aura (green =
  positive adjacency pair, orange = layout penalty), plus a "✨ Synergy!" toast
  on placement (`getCellSynergy` / `SynergyToast`).
- ✅ **New combo type** — Power Plant next to a downstream production plant
  (`powerToPlant`) grants a stacking output bonus, surfaced by the green aura.
- ⏳ Follow-ups: more positive combo types still welcome.

### 4. People / morale layer (`✅ shipped`)
Global `staffMorale` (0–100) drifts toward equilibrium each tick. High morale
(>75) gives workers a 10% effectiveness bonus; low morale (<40) applies a 15%
penalty — the multiplier flows through `workerProductionMultiplier` transparently.
Morale reacts to: employee level-ups (+3), hires (+2), retirements (−5), unpaid
wages (−15), year-end grade (S/A: +8, C: −5), and 4 dedicated staff choice
events (Standout Hire, Team Feud, Raise Request, Team Outing) that fire on their
own ~6-minute cooldown once you have 3+ employees. Shown in the HUD resource
dock and the year-end ceremony.

### 5. Endgame / prestige spine (`✅ shipped`)
A ladder of 6 "legacy goals" (`ENDGAME_GOALS`: max level, $1M, all research,
max grid, an S-grade year, 100k lifetime gasoline) shown on the Achievements
screen with progress bars. Completing all flips `legendAchieved` → the
"Industry Legend" celebration (modal + confetti). Closes the post-Lv20 loop.
Follow-up: ✅ **New Game+ / Prestige** — once Industry Legend is reached, the
Company › Settings tab offers Prestige: a fresh run that carries a permanent
stacking +10%/level production bonus (`PRESTIGE_BALANCE`, `prestigeGame`), plus
a **choice of one permanent Legacy Perk per prestige** (`data/prestigePerks.ts`).

---

## Execution order

1. Docs + roadmap (this file, `CLAUDE.md`). ✅
2. Balance P0 (contracts + maintenance sink).
3. Dynamic Market (feature 1) — also resolves balance P1.
4. Specialization (2) → Layout (3) → People (4) → Endgame (5).
