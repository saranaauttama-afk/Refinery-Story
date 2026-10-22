# Refinery Story v4 — Rewrite Plan

Branch: **`rewrite/v4`** (forked from `devGraphic` at `dee77b3`).
Design: [`GDD.md`](GDD.md). Graphics: [`ART.md`](ART.md).

This is a **from-scratch rewrite**. Do not port V1–V3 logic, types, save
format, or screens. Keep only the project shell (Expo config, fonts, icon,
CI workflow) until each piece is replaced.

---

## 0. Ground rules for every task

1. Read `GDD.md` section for the milestone before coding. If the GDD and this
   plan disagree, the GDD wins on rules/numbers, this plan wins on code layout.
2. **All tunable numbers live in `src/v4/data/balance.ts`.** No magic numbers
   in sim or UI code. Content tables (buildings, combos, additives…) live in
   `src/v4/data/*.ts`.
3. **The sim core (`src/v4/sim/`) imports nothing from React / React Native /
   Expo / Skia.** It must run under `tsx` in Node.
4. Game time is tick-based only. Never use `Date.now()` / `Math.random()` in
   sim code — use `state.tick` and the seeded RNG in `sim/rng.ts`.
5. State is immutable: every action is `(state, args) => newState`.
6. Gates before every commit:
   - `npx tsc --noEmit`
   - `npm run v4:check` (all headless checks for finished milestones)
7. One milestone = one or more commits on `rewrite/v4`. Each pushed commit
   builds an Android Preview APK (CI trigger already added). The owner plays
   the APK and decides if the milestone passes.
8. UI text is bilingual `{ en, th }` via `src/v4/i18n.ts`. Thai is default.
9. When a milestone is done, update the **Status** table at the bottom of this
   file and write a short Thai summary in the commit body.

---

## 1. Folder layout (target)

```
app/
  _layout.tsx            root: fonts, GameProvider, overlays
  index.tsx              title screen (New Game / Continue)
  game.tsx               the yard screen (full-bleed) + HUD + sheets
src/v4/
  data/
    balance.ts           ALL numbers from GDD §7 (+ per-section constants)
    buildings.ts         building defs: id, category, footprint, cost, outputs…
    combos.ts            30 combos (pair/set, members, effect, hidden)
    bases.ts             8 bases: price, input cut, unlock rank
    additives.ts         20 additives: unlock rule (job, level, training)
    compatibility.ts     Base × Additive → 'S'|'A'|'B'|'C'|'D'|'F'
    customers.ts         ~40 customers: group, favourite base, min grade, gift
    investments.ts       4 chains with ordered steps
    staff.ts             jobs, hiring methods, trainings, name pool
    ranks.ts             rank thresholds + unlock lists
    events.ts            random events
  sim/
    types.ts             GameState and all domain types
    rng.ts               seeded RNG (mulberry32) stored in state
    time.ts              tick → week/month/year helpers
    state.ts             createNewGame(seed)
    tick.ts              tick(state): advances one tick, calls systems
    systems/
      economy.ts         upkeep, salaries, money ledger
      yard.ts            place/move/demolish/buy land, occupancy grid
      combos.ts          detect pairs/sets/auras → active combo list
      production.ts      crude in → cuts → bases → tanks
      blending.ts        lots, score, grade, familiarity
      customers.ts       truck arrivals, purchases, hearts, gifts
      contracts.ts       monthly offers, deadlines, rewards
      investments.ts     chain purchases, unlocks
      staff.ts           hire, assign, power, train, level, job change
      progression.ts     fame → rank, unlocks
      awards.ts          year-end awards, rivals
      events.ts          random events, market cycle
    actions.ts           every player action as a pure function
    save.ts              serialize/deserialize (versioned, v4 only)
  store/
    GameProvider.tsx     owns state, runs tick interval, exposes actions
    useGame.ts           selector hook
  render/                Skia yard renderer (see ART.md)
    iso.ts               tile ↔ screen math
    palette.ts           colour tokens
    YardCanvas.tsx       ground, buildings, trucks, people, pop-ups
    buildings/*.ts       one draw function per building type
  ui/                    HUD, bottom bar, sheets, modals, banners
  i18n.ts
scripts/v4/
  check-*.ts             headless checks (one per milestone)
  sim-run.ts             N-year autoplay report for balance
```

Old code (`src/game`, `src/components`, `src/hooks`, old `app/game/*`,
`scripts/*.ts`, V2/V3 docs) is **deleted in M0**, not kept alongside. Git
history keeps it.

---

## 2. Core data model (sketch — refine in M1)

```ts
type Tick = number // 1 tick = 0.25 s at 1× → 60 ticks/week
type Grade = 'SS' | 'S' | 'A' | 'B' | 'C'
type Compat = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

interface Building {
  uid: string
  defId: BuildingId
  x: number
  y: number // top-left tile
  level: 1 | 2 | 3 | 4 | 5
  staff: string[] // staff uids assigned
}

interface Lot {
  uid: string
  base: BaseId
  additive: AdditiveId | null
  stats: { purity: number; yield: number; stability: number; eco: number }
  score: number
  grade: Grade
  units: number
}

interface Staff {
  uid: string
  name: string
  job: JobId
  jobLevels: Record<JobId, number> // 0 = never had that job
  stats: { op: number; chem: number; mech: number; safe: number }
  power: number
  maxPower: number
  salary: number
  trainingCounts: Partial<Record<TrainingId, number>>
  assignedTo: string | null // building uid
}

interface GameState {
  version: 4
  seed: number
  rng: number
  tick: Tick
  speed: 0 | 1 | 2 | 4
  money: number
  fame: number
  rd: number
  rank: number
  yard: { size: number; ownedParcels: string[]; buildings: Building[] }
  crude: number
  cuts: Record<CutId, number>
  tanks: Lot[] // finished lots waiting for sale
  familiarity: Record<BaseId | AdditiveId, number>
  triedPairs: string[] // "gasoline:octane"
  discoveredCombos: ComboId[]
  activeCombos: ActiveCombo[]
  staff: Staff[]
  firedStaff: Staff[]
  unlockedAdditives: AdditiveId[]
  customers: Record<CustomerId, { hearts: number; giftGiven: boolean }>
  trucks: Truck[] // visual + logical, in-yard
  contracts: { offers: Contract[]; active: Contract[] }
  investments: Record<ChainId, number> // steps bought
  market: { phase: 'normal' | 'boom' | 'bust'; nextChangeTick: Tick }
  year: YearStats // reset each year for awards
  history: { awards: AwardResult[] }
  log: LogEntry[] // last 50 messages
  popups: Popup[] // money/fame pop-ups for the renderer
}
```

`activeCombos` is **recomputed only when the yard changes** (place/move/
demolish/upgrade), never every tick.

---

## 3. Milestones

Each milestone lists: scope, files, the headless check that must pass, and what
the owner checks on the APK.

### M0 — Clean slate (half a day)

- Delete: `src/game`, `src/components`, `src/hooks`, `src/art`, `src/config`,
  `src/*.ts` (old), `app/game/`, `app/settings.tsx`, old `scripts/*.ts|*.mjs|*.cjs`
  except `scripts/refresh-app-icon.cjs` (CI needs it), old root docs
  (`GAMEPLAY_*`, `FUN_BLUEPRINT.md`, `ROADMAP.md`, `CURRENT_TASK.md`,
  `ASSETS_NEEDED.md`, `ICONS_NEEDED.md`, `PROJECT_UI_AUDIT.md`,
  `RELEASE_CHECKLIST.md`), `Doc/`, `docs-archive/`, `.build/`, `_shot.mjs`.
  Keep `assets/branding`, `assets/fonts` (if any) and the menu background.
- Remove old `npm run sim*` / `check:v3-*` scripts from `package.json`; add
  `"v4:check": "tsx scripts/v4/check-all.ts"` and add `tsx` as a devDependency.
- New `app/index.tsx` = title screen with "New Game" that routes to
  `app/game.tsx`, which shows "v4 – yard coming soon".
- Bump `app.json` android `versionCode` and set version label `V4-M0`.
- **Check:** `tsc` passes, app boots on web export.
- **APK:** installs, shows title, New Game opens the placeholder.

### M1 — Sim core: time, money, save (1 day)

- `sim/types.ts`, `rng.ts`, `time.ts`, `state.ts`, `tick.ts`,
  `systems/economy.ts`, `save.ts`, `store/GameProvider.tsx`.
- 60 ticks = 1 week; month = 4 weeks; year = 12 months. Upkeep and salaries are
  charged on the first tick of each month.
- Speed 0/1/2/4; tick interval = 250 ms / speed; pause when app backgrounded.
- Autosave every in-game month + on background; one save slot, key
  `refinery-v4-save`.
- HUD: date (Y1 M1 W1), money, fame, RD, speed buttons.
- **Check `check-time.ts`:** 720 ticks = 3 months; upkeep charged 3 times;
  save → load round-trips deep-equal; same seed + same actions = same state.
- **APK:** date runs, speed buttons work, kill app → Continue restores.

### M2 — Yard: iso grid, place/move/demolish, land (2–3 days)

- `render/iso.ts`, `render/YardCanvas.tsx` (Skia), `systems/yard.ts`.
- 16×16 start, buy 8×8 parcels (cost in `balance.ts`), max 40×40.
- Build sheet lists buildings unlocked at current rank; ghost preview shows
  green/red footprint; tap to confirm. Move costs $2k; demolish refunds 50%.
- Pan + pinch zoom with gesture-handler; tap a building → info sheet.
- Buildings drawn with placeholder code-drawn boxes (real art in M2b, see
  ART.md) — but already with correct footprint, height and black outline.
- **Check `check-yard.ts`:** no overlaps, no out-of-bounds, land purchase
  enlarges bounds, move keeps uid, demolish refund correct.
- **APK:** place / move / demolish feel good at 60 fps with 40 buildings.

### M2b — Art pass 1 (parallel with M3–M5)

- Per ART.md: real code-drawn sprites for the 12 rank 1–4 buildings, ground
  tiles, roads, trees, lamps, truck, worker. Levels 1/3/5 visibly differ.

### M3 — Production & blending (2–3 days)

- `data/bases.ts`, `additives.ts`, `compatibility.ts`, `systems/production.ts`,
  `systems/blending.ts`.
- Crude arrives by truck at the Truck Gate on a schedule (`balance.ts`), is
  stored in a Crude Tank, CDU converts to cuts, conversion units make bases,
  Blending Station turns base (+ optional additive) into a **Lot** stored in a
  product Tank.
- Blending Station UI: pick Base, pick Additive (shows compat letter if tried,
  "First Try" if not), shows predicted score range.
- Score/grade formula exactly as GDD §3. Familiarity +1 per N lots (balance).
- Grade pop-up above the station when a lot completes ("A!", "S!!").
- **Check `check-blending.ts`:** formula matches hand-computed examples for all
  6 compat letters; familiarity cap 10; first try gives Fame +10 once.
- **APK:** first lot of the game completes within 90 s of New Game.

### M4 — Customers, trucks, contracts (2 days)

- `data/customers.ts`, `systems/customers.ts`, `systems/contracts.ts`.
- Customer trucks spawn at the gate, drive on roads to the Loading Bay, buy the
  best lot that meets their min grade, drive out. Money pop-up on sale.
- Price = basePrice × gradeMultiplier × marketMultiplier × combo price bonus.
- Hearts, gift at 10 ♥ (unlock blueprint/deco/additive).
- Contracts: monthly offers, accept up to 3, deliver from tanks, deadline
  handling, rewards/penalties.
- **Check `check-sales.ts`:** sale picks highest-grade eligible lot; hearts
  and gift fire once; expired contract applies Fame −10.
- **APK:** trucks visibly come and go; first contract completable in year 1.

### M5 — Combos & auras (1–2 days)

- `data/combos.ts` (all 30), `systems/combos.ts`.
- Pair = Chebyshev distance ≤ 2 between any tiles of the two footprints.
  Set = 3 members whose footprints are adjacent in a straight row (horizontal
  or vertical). Aura grid exactly as GDD §2.
- Recompute on yard change. Effects feed production/blending/staff/sales via a
  single `getModifiers(state)` aggregator.
- Discovery banner "New Combo!" + Fame +20 (once per combo). Recipe Book screen
  lists known combos; hidden ones show "???".
- Combo highlight: while placing, show which combos the ghost would complete.
- **Check `check-combos.ts`:** every combo in data is reachable by a scripted
  placement; negative pair applies; aura percentages exact.
- **APK:** owner finds ≥ 5 combos naturally in the first 30 minutes.

### M6 — Staff (2 days)

- `data/staff.ts`, `systems/staff.ts`.
- Hire via 5 methods (candidate pool of 3 per hire), assign to a building, power
  drain/refill, training with diminishing returns + 5% Super Up!, level-up with
  RD, salary ×1.2/level, job change via Career Manual, Plant Director unlock,
  additive unlocks from training rules.
- Staff walk between Canteen and their building (visual only).
- **Check `check-staff.ts`:** diminishing formula, Super Up rate ≈ 5% over
  10k seeded trials, salary compounding, additive unlock triggers.
- **APK:** assigning a good Chemist visibly raises lot grades.

### M7 — Progression, investments, awards, events, market (2–3 days)

- `data/ranks.ts`, `investments.ts`, `events.ts`; `systems/progression.ts`,
  `investments.ts`, `awards.ts`, `events.ts`.
- Rank-up modal listing unlocks; investment screen with 4 chains; year-end
  award ceremony modal vs 4 rivals; random events; market boom/bust with
  1-month warning; Year 15 evaluation screen; New Game+ carry-over.
- **Check `check-progression.ts`:** `scripts/v4/sim-run.ts` autoplay bot reaches
  rank 5 by year 4–5 and rank 10 by year 14–16; ≥ 5 unlocks in the first 40
  in-game weeks (≈ 10 real minutes); no softlock (money < 0 for > 6 months).
- **APK:** full year 1 is fun without reading a manual.

### M8 — Balance & polish (ongoing)

- Run `sim-run.ts` for 20 seeds, tune `balance.ts` to hit GDD §7 income
  targets. Onboarding hints (max 6 short tips), sounds, haptics, confetti on
  S grade and rank-up.

---

## 4. CI

`.github/workflows/android-preview-apk.yml` builds on pushes to
`rewrite/v4`. Typecheck runs in CI; `v4:check` should be added to CI in M1.

## 5. Status

| Milestone                | Status                                                                            | Commit                                                   | APK run                     | Owner verdict |
| ------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------- | ------------- |
| M0 Clean slate           | implemented; APK verification pending                                             | commit titled `feat(v4): complete M0 clean slate`        | pending                     | deferred      |
| M1 Sim core              | done; automated checks passed                                                     | feat(v4): M1 sim core                                    | automatic CI                | deferred      |
| M2 Yard                  | done; automated checks passed                                                     | feat(v4): M2 yard                                        | automatic CI                | deferred      |
| M2b Art pass 1           | done; automated art checks and web export passed                                  | feat(v4): M2b code-drawn art                             | automatic CI                | deferred      |
| M3 Production & blending | done; automated checks passed                                                     | feat(v4): M3 production and blending                     | automatic CI                | deferred      |
| M4 Customers & contracts | done; automated checks passed                                                     | feat(v4): M4 customers and contracts                     | automatic CI                | deferred      |
| M5 Combos                | done; automated checks passed                                                     | feat(v4): M5 combos and auras                            | automatic CI                | deferred      |
| M6 Staff                 | done; automated checks passed                                                     | feat(v4): M6 staff                                       | automatic CI                | deferred      |
| M7 Progression           | done; automated checks passed                                                     | feat(v4): M7 progression                                 | automatic CI                | deferred      |
| M8 Balance & polish      | done; 20-seed checks passed                                                       | feat(v4): M8 balance and polish                          | automatic CI                | deferred      |
| M9 Cleanup (Claude)      | done                                                                              | see git log                                              | pending                     | pending       |
| UI redesign 4.0.13       | implemented; TypeScript, sim checks, web export and 390×844 browser checks passed | `feat(v4): complete chunky pixel industrial UI redesign` | Android Preview APK on push | deferred      |
| UI surfaces 4.0.24      | shared concrete yard and screen presentation; automated and browser validation | see UI-SURFACES-4.0.24.md | Android Preview APK on push | deferred |
| V5 unified graphics 4.1.8 | native pixel frames, tiled coast, play/overview cameras, parcel fences; see ../v5/GRAPHICS.md | feat(v5): unify world pixels and play camera | Android Preview APK on push | deferred |
| Coastal redesign 4.0.25 | approved concept implemented for title, HUD, dock, panels and yard scenery | see COASTAL-REDESIGN-4.0.25.md | Android Preview APK on push | deferred |

### M0 validation

- `npx tsc --noEmit`: passed.
- `npm run export:web`: passed; exported `/` and `/game`.
- `npm run v4:check`: this host blocks the tsx CLI IPC socket (`EPERM`).
  Equivalent socket-free execution `node --import tsx scripts/v4/check-all.ts`
  passed. M0 has no sim checks; the runner is ready for M1.
- Android versionCode 11, version 4.0.0, build label V4-M0.
- APK install / New Game verification and owner verdict remain pending.

## Assumptions

- M1: month expenses are charged at ticks 1, 241, 481 (first tick of each month); week/year labels use completed ticks.
- M1: seeded New Game uses the reproducible default seed 42. No offline catch-up; background pauses ticks.
- M1: `v4:check` uses `node --import tsx` to avoid host IPC restrictions while running the same TypeScript checks, locally and in CI.

- M2: land purchases add one adjacent 8×8 parcel, not a free entire row/column. Bounding size grows while unowned tiles remain blocked. Land starts unlocking at rank 2.
- M2: unspecified building prices use content-table defaults; the six basic production/logistics buildings total $50k.

- M3: starter layout is a one-tap purchase costing exactly $50k, with no free buildings. Crude deliveries use up to $5k working credit so this start cannot deadlock before the first sale.
- M3: one global recipe drives all stations. Familiarity uses the mean Base/Additive level (Base alone without additive). Predicted range is exact because no score noise is specified.
- M3: unspecified base conversions, additive unlocks, 160 compatibility cells and cycle/buffer sizes are explicit content/balance defaults. Light/Heavy/Shale alter initial stat quality. Tuning is deferred to M8.

- M4: two local gas buyers are available before Highway investment; remaining buyers require their chain (government buyers rank 6). Each of five groups has eight named buyers.
- M4: starter includes a road tile and a $100 lower Loading Bay price, preserving the $50k total. Trucks use a breadth-first path through gate/road/loading footprints; blocked roads prevent customer arrivals.
- M4: contract deliveries may be partial and paid per delivered unit at current market price ×1.5; completion awards Fame once. Offers refresh monthly; deadlines count from the offer. Crude is received at the gate with a visual delivery truck.

- M5: the 20 additional combos are explicit new content; one effect per combo definition (multiple copies do not stack). Set order may be reversed/permuted while footprints stay contiguous in one row.
- M5: unspecified aura strength is 10 stat points times the exact GDD grid. Emitters stack; their contributions are averaged across production/blending buildings for global lot stats. Emitter itself receives no aura.
- M5: hints cost $500. Hidden recipes stay unknown until discovered; discovery Fame is awarded once even after demolishing and rebuilding.

- M6: hiring fee buys one interview pool of three; choosing one closes the pool. Multiple workers can be assigned to one building, bounded by the company hire cap.
- M6: active staff stats add directly to lot stats along production/blending buildings. Exhausted workers rest until full; Canteen accelerates weekly recovery. Worker travel is visual only.
- M6: changing jobs consumes one Career Manual and preserves stats/job history. Director additionally requires rank 8 and the same worker at Manager 5 + Chemist 5. Fired workers rehire for the basic $5k fee.

- M7: annual rival curves, award growth ($/Fame-independent, 100–500 per win), event odds and investment middle steps use balance/content defaults. Year 15 evaluation occurs after completing year 15; play continues.
- M7: ranks never decrease when Fame is lost. Investment Stimulus/Shelter mitigation applies company-wide once; terminal Port/Airport bonuses apply to eligible sales. Buyers with eligible stock are preferred when generating demand.
- M7: unused cut buffers overflow to disposal so an unused byproduct cannot permanently stop the starter refinery. CDU/conversion/blending levels now scale real throughput by +25% per level; additional lines increase capacity.
- M7: NG+ carries one free, unplaced copy of every unlocked building. Placing consumes the copy; normal upkeep starts only after placement. This avoids forcing unaffordable upkeep onto a new run.
- M7 checks: seeds 1–3 complete 16 years through normal guarded UI actions: rank 5 at 3.90–3.98 elapsed years, rank 10 at 15.98, >=5 new unlocks by week 40, longest negative balance 0.28 months. Income tuning remains M8.

- M2b: implemented after M7 as requested. All 27 building/deco definitions have code-drawn sprites; L1/L3/L5 differ (road stays flat). `ART-GALLERY.svg` previews the exact shared shape commands.
- M2b: Skia caches ground per parcel change and each building picture per yard change; a dynamic picture interleaves cached buildings with trucks/workers by depth. Integer zoom and non-antialiased drawing preserve crisp pixels.
- M2b: `check-art.ts` validates sprite coverage, level differences, finite geometry, truck/worker variants. Web export passed. Native device 60 fps measurement remains deferred, not claimed by headless checks.

- M8: user explicitly deferred owner/device approval for every milestone. The execution order is M1, M2, M3, M4, M5, M6, M7, M2b, M8; each has one checked commit/push.
- M8: tuned production cycle to 48 ticks and crude deliveries to the same cadence; kept 60 ticks/week. Tuned base prices first (all prices, building/hiring/training/investment values and combo effects are centralized in balance.ts). GDD values are starting values; these tested values supersede them for playtesting.
- M8: 20 seeds × 16 years: average monthly operating profit Y1 $53,615; Y5 $487,094; Y10 $3,059,287. Range and per-year records are in BALANCE-REPORT.md/json. Operating profit excludes optional capital/hiring/training spend; cash/debt checks include all spend.
- M8: onboarding is six dismissible tips. Small original synthesized click/chime WAVs, optional haptics and reduced-motion-aware confetti are included. Title pauses simulation, background saves are serialized, invalid/incomplete development saves are rejected with a visible message. No V1–V3 save migration.
- M8: plain tanks may be emptied without revenue to recover from an experimental low-grade recipe. Native performance, APK installation, audio/haptics feel and subjective fun remain deferred; no device validation is claimed.

- M8 validation: final TypeScript, every milestone check, web static export and Android Hermes bundle export passed. APK compilation is handled by the existing workflow and device verdict remains deferred.

## M9 — Cleanup after the first full pass (done by Claude)

- Prettier (`npm run format`, printWidth 100) — the M1–M8 code was squeezed onto
  very long lines; keep it formatted.
- Guided start: the 6 onboarding steps advance on their own and offer a
  "Place" button with a suggested tile, replacing the one-tap $50k starter.
- Gate must be on the yard edge; trucks drive in on a public road outside.
- One starting Operator foreman, auto-assigned to the first work building, so
  people walk the yard from minute one. Workers stand in front of buildings.
- Product trucks use their product colour.
- Blend panel: selected base/additive highlighted, compatibility letter or NEW.
- Title shows the real app version; "fi" ligature fixed.
- Placement bar moved into the layout flow (the floating one blanked the top of
  the yard canvas on web).
- Gameplay fixes found by the varied bot: LPG had no buyers, and grade-C lots
  could fill the tanks forever. Gas stations now buy LPG; clearance sales empty
  nearly full tanks. A "Tanks full!" pop-up shows above a stalled station.
- `sim-run.ts` bot now plays a different style per seed (pace, cash reserve,
  staff, curiosity, build and investment order). Rank thresholds and base prices
  re-tuned to that spread: all 20 seeds reach rank 5 at ~4 years and rank 10 at
  13–15 years with no debt lock.
