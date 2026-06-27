# Refinery Story — Roadmap

Living plan for the game's design + balance direction. Status markers:
`✅ done` · `🚧 in progress` · `⏳ planned`. Newest work is tracked here;
deep implementation notes still live in `README.md`.

Working branch for this initiative: `claude/claude-md-docs-2iep7n` (off `devMobile`).
Verify every change with `npx tsc --noEmit`. There is no automated test suite;
isolated `node -e` sims + the web-export screenshot loop are the verification tools.

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

### 2. 🥈 Specialization / forced tradeoffs (`⏳ P1`)
You can currently build everything, so nothing is a real choice. Add tension:
divergent research/perk archetypes (e.g. Green vs. Industrial) with real
mechanical payoffs, and lean on shared-crude scarcity + the market so you can't
scale everything at once. Converts "many systems" into "deep game."

### 3. 🥉 Layout / adjacency as a first-class system (`🚧 in progress`)
- ✅ **Negative adjacency** — a lab / sales office adjacent to a heavy
  polluting plant loses 50% of its bonus (`LAYOUT_BALANCE`), surfaced as a
  warning line in the tile info sheet. Makes placement a tradeoff.
- ⏳ Follow-ups: visible synergy auras on the map, more positive combo types.

### 4. People / morale layer (`⏳ P2`)
Employees have names/levels/veterans but no soul. Add morale + small staff
events (a standout hire, a feud, a raise request) so managing the crew is an
ongoing soft decision — Kairosoft charm.

### 5. Endgame / prestige spine (`✅ shipped`)
A ladder of 6 "legacy goals" (`ENDGAME_GOALS`: max level, $1M, all research,
max grid, an S-grade year, 100k lifetime gasoline) shown on the Achievements
screen with progress bars. Completing all flips `legendAchieved` → the
"Industry Legend" celebration (modal + confetti). Closes the post-Lv20 loop.
Follow-up: a New Game+ / prestige that carries something forward.

---

## Execution order

1. Docs + roadmap (this file, `CLAUDE.md`). ✅
2. Balance P0 (contracts + maintenance sink).
3. Dynamic Market (feature 1) — also resolves balance P1.
4. Specialization (2) → Layout (3) → People (4) → Endgame (5).
