# Gameplay V3 — Implementation contracts and release checklist

> **V3-15.5 supersession (2026-09-26):** the fixed 3×3 → 4×4 → 5×5 → 6×6 grid,
> "lots"/slot counts and `expand_grid` are **superseded by the expandable refinery
> yard** (see *Expandable yard* below). Any grid, lot or slot figure elsewhere in
> this document is historical. V3 is fresh-save only: earlier preview saves are
> rejected, not migrated.


2026-09-25 · **R0 COMPLETE; R1 FOUNDATION THROUGH V3-09 IN CODE**. The integrity,
atomic-allocation, truthful power/storage upgrades, fresh V3 state boundary,
variant inventory, capacity, protected stock, cost basis, ledger, and per-cell
Gasoline production, local Operator duty ownership, Gasoline development, and the
first customer/job transaction ledger, C0→C2 campaign integration, recovery,
loaners, guided objective, and pause ownership are implemented.
Automated checks pass; Android device smoke remains for the next explicitly requested
build. The next implementation task is `V3-10`; do not skip the prototype gate.
Read [GAMEPLAY_MASTER_PLAN_V3.md](GAMEPLAY_MASTER_PLAN_V3.md) and
[GAMEPLAY_SYSTEMS_V3.md](GAMEPLAY_SYSTEMS_V3.md). V2 future tasks are superseded;
do not implement G0–G11 alongside this backlog. Reuse V2 audit fixtures as evidence.

## Execution contract for every coding model

1. Read AGENTS/README and current git status. This is the Expo root, not Vite.
   Baseline planning commit before V3 is `c51149c`; released #68 remote `51bc987`
   has a different history. Reconcile cleanly before any later external push;
   never force-push just to make IDs match. This task does not authorize push/build.
2. Implement the task/slice the user actually authorizes. A request to implement
   a release slice covers its necessary tasks; do not ask permission per function.
   Do not interpret a planning request as permission to implement all slices.
3. One coherent task/subtask per commit. No art/map/sound edits. No unrelated
   package upgrade, framework change, generic engine, or speculative abstraction.
4. Use exact V3 decisions. Numeric values are V3-A hypotheses: changing them
   requires before/after evidence and updating the canonical table.
5. For each task state behavior change, files, persistence impact and acceptance
   results. UI work includes empty/blocked/loading states and TH/EN messages.
6. Test meaningful behavior and prior bugs. Do not test only that a constant equals
   itself, or silently weaken an invariant to satisfy a legacy timing threshold.
7. New reducers must be shared by UI and simulator; no headless privileged grants
   in playthrough tests. A constructed fixture must be labelled a fixture.
8. Finish the authorized coherent slice; pause expansion at human playtest gates.
   If a gate fails, repair that slice, not add systems from the next one.
9. Never claim a device interaction was tested from TypeScript/simulation alone.
10. No multi-agent work unless user/applicable instructions separately authorize it.

## Source map

| Area | Current files |
| --- | --- |
| State and save | `src/game/types.ts`, `src/game/utils/gameStorage.ts` |
| Rules/data | `src/game/data/balance.ts`, `buildings.ts`, `workers.ts`, `research.ts`, `contracts.ts` |
| Tick and previews | `src/game/utils/gameTick.ts`, `gameCalculations.ts` |
| Action wrappers | `src/hooks/useGameLoop.ts` |
| Factory | `app/game/(tabs)/index.tsx` and existing related components |
| Other UI | inspect `app/game/(tabs)/management.tsx`, `contracts.tsx`, `staff.tsx`, `supply.tsx`, `company.tsx`, `_layout.tsx` |
| Employee math | `src/game/utils/employeeUtils.ts`, `data/staffSkills.ts`, `recruitment.ts` |
| Compatibility | `src/game/utils/gridExpansion.ts`, existing move/swap/build callbacks |
| Validation | `scripts/full-loop-sim.ts`, `sim-check.ts`, `camera-check.ts`, `factory-map-check.ts` |

New modules are proposed in Systems S1. Do not assume a suggested UI file is the
actual rendered screen; trace current route/component ownership before editing.

## Dependency graph in words

R0:00→01→02. R1:03→04→05→06→07→08→09→10. R2:11→12→13.
R3:14→15→16. R4:17→18→19. IDs are ordered intentionally; no parallel agent
execution is needed. Within a task, read-only independent checks can run together.

R0 operates on current rules with focused correctness repairs. R1 uses a fresh V3
save and new authoritative state. Per the 2026-09-25 user decision, do not build
old-save migration, compatibility mirrors, or legacy-order adapters. The old
engine is only a temporary separate path until V3 cutover.

## R0 — Trustworthy foundation

### V3-00 · Capture exact failures and create integrity harness

Status: **COMPLETE** — `f21f035`.

Dependencies:none. Scope:tests/docs only, no runtime changes.
Read V2 audit and reproduce negative electricity, consumed feedstock/output0,
ignored tank/generator levels, and specialist-only eligibility. Capture UI vs
action disagreement in a matrix. Record current source hashes/commands.
Create a focused integrity script; known failures are labelled diagnostic baseline,
not silently treated as passed assertions. Include invalid-resource finite checks
for electricity and every product, not only money/gas/crude.
Acceptance:deterministic fixtures/output; no claim that old simulator passing proves
fun; table showing current expected failures and desired invariants.

### V3-01 · Atomic processing and resource allocation

Status: **COMPLETE** — `5fcd951`.

Dependencies:00. Scope:`gameTick`, calculations, shared planner, integrity tests.
Separate requested vs actual operations, account for input/power/output jointly;
include Polymer and generators. Implement deterministic fair resource allocation
with equal-weight symmetry tests. Preserve current rates for this repair; V3
recipe changes belong to05/11/14. Bypassed old electricity costs must not debit
negative electricity. No UI redesign or new products.
Acceptance:empty/partial/full matrix, no lost paid input for zero work, no negative
resource, repeated100cycle fairness; finite100k ticks; effects follow actual work.

### V3-02 · Upgrade capability and truthful controls

Status: **COMPLETE IN CODE** — `6414de9`. TypeScript, integrity, full-loop,
balance, camera, and map checks pass. Android device rendering is not claimed.

Dependencies:01. Subtasks:02a power,02b tanks,02c assignment/Info regression.
Use single building capability data for action + Factory UI + preview. Apply site
connection/generator rule from SystemsS3, level-dependent supply/cap/fuel and tank
contributions. Expose correct units and startup crude reserve. Test one upgraded
cell among identical cells. Restore existing eligible specialist assignment paths;
global staff labelled correctly, unsupported actions explain why.
Acceptance:first generator does not enable a new gasoline energy charge, full
battery burns no fuel; all5 tanks upgrade; storage overflow preserved; Info/build
picker/eligible assignment render and work on Android. Preserve map/camera tests.
R0 stop gate:audit defects fixed/explicitly accounted for; don't call future Operator
assignment implemented before V3-06.

## R1 — Playable Gasoline product-development prototype

### V3-03 · V3 schema and minimal shared action boundary

Status: **COMPLETE** — `1104884`.

Dependencies:02. Scope:types, schema defaults, reducers/action result type, tests.
Define typed blueprints/inventory/duties/jobs/receipts/ledger/campaign from Systems.
Add isolated V3 save slot with explicit opt-in development entry. It always starts
fresh and does not embed/import old `GameState`. Extract build/upgrade/
trade validators needed for preview; wrapper supplies toasts, reducers decide state.
Acceptance:new/reload round-trip; deterministic IDs; unsupported save-version
handling; no old-save writes/imports; no duplicate state writers in preview.

### V3-04 · Variant inventory and financial ledger

Status: **COMPLETE IN CURRENT BRANCH**.

Dependencies:03. Scope:inventory/material basis + all Gasoline preview consumers.
Implement revisions, cost basis, quantity precision, aggregate selectors, capacities,
keep/reserve APIs and ledger buckets. Default/developed provenance distinct.
Port Gasoline spot/manual/auto sale and samples through inventory transactions.
Acceptance:Q35/Q55 remain separate; no stock duplication from mirror; weighted basis
survives partial sell/reload; displayed counts/cap agree; capex separate from margin.

### V3-05 · Per-cell Gasoline recipes and programs

Status: **COMPLETE IN CURRENT BRANCH**.

Dependencies:04. Scope:Distillation evaluator/actual tick/preview and shared program
actions. Apply V3-A Gasoline/Crude prices, base recipe, per-cell work, co-product
cost allocation, profiles, actual supply vs potential rate and setup5s. No downstream
family enabled yet. Boost uses real input; energy independent of owned generator.
Acceptance:two cells on different programs produce correct separate lots; no global
double bonus; blocked output/co-product disposal policy visible and cost-accounted;
same evaluator powers before/after UI; save/reload respects setup remaining ticks.

### V3-06 · Local Operator and project duty ownership

Status: **COMPLETE IN CURRENT BRANCH**.

Dependencies:05. Scope:employee duty reducer, preview starter staff, assignment UI.
Implement baseline unstaffed line, local crew cap, exclusive duty, project transfer,
return-to-valid-vacancy rule, wage/standby and XP for actual duty. Disable retirement
and unassigned global Operator bonuses in V3. Keep other roles gated until ported.
Acceptance:one worker cannot improve two cells; assignment via Factory and Team
matches production; paused/unpaid/reserve no role benefit; no negative money.

### V3-07 · Gasoline development workflow

Status: **COMPLETE IN CURRENT BRANCH**.

Dependencies:06. Scope:project actions/evaluator + Operations Develop/report UI.
Implement no-module Volume/Standard/Precision at rank0, optional Operator lead,
sample/fee transaction,20s project, immutable certification and selection into
plant. LabLv1 atC1; no fake higher modules in prototype. Add name/pin/archive basics.
Acceptance:preview Q35/40/55 matches output; duplicate config cannot farm XP; samples
cannot consume reserved stock; cancel/reload/move lab validates correctly; produced
stock Q stays fixed when employee levels or research later change.

### V3-08 · Jobs, staged payment and two market choices

Status: **COMPLETE IN CURRENT BRANCH**.

Dependencies:07. Subtasks:08a job state/reducer,08b reservation/auto-dispatch,08c UI.
Implement tutorial, Local client trial/regular, Performance trial from Master.
Show later quality targets as locked previews. Trial35 vs55 and Local repeat40
provide first prototype choices; do not invent a repeat premium trial that pays
unbounded RP. Higher premium repeat unlocks in R2 after real capabilities exist.
Implement cumulative payment rounding, locked quote, one slot, completion receipt,
keep/job protection, cancellation, auto-sell and downstream-reservation API.
Acceptance:split payout==whole payout; no double settlement after taps/reload;
rewards once; auto-sell cannot take job stock; below-Q stock not eligible; slot
released on completion/cancel; no paid shipment returned on cancellation.

### V3-09 · First-session integration and recovery

Status: complete in the current branch. The automated legal path reaches C2 only
after 40 units of one developed blueprint are shipped; recovery/loaner/reload and
nested pause-owner fixtures pass. Android playtesting belongs to V3-10.

Dependencies:08. Scope:C0→C1→C2 transition, starter setup, guided UI, safe insolvency.
Tutorial grant and assets once; new-game flow does not duplicate buildings. Enable
automation only through visible choice. Implement Systems recovery without asset
warehouse/hold feature. Keep unwanted legacy events disabled in V3 preview.
Add modal pause ownership/background handling and TH/EN blocked reasons.
Acceptance:fresh legal path to first self-developed delivery; zero cash/no input
recovery works; loaners never refund/reward; money earned during recovery reduces
rescue payout; clear slots flow doesn't silently destroy assets; nested sheets safe.

### V3-10 · Prototype gate and scoped corrections

Status: **COMPLETE** — automated comparison passes and on 2026-09-26 the player
passed the gate to R2 after playing build #69 (see the gate document; detailed
device measurements were not supplied). Original note: the Android 15–20 minute
human playtest was pending. Evidence and the exact checklist live in
[GAMEPLAY_PROTOTYPE_GATE_V3.md](GAMEPLAY_PROTOTYPE_GATE_V3.md). Do not mark this
task complete or enter R2 from simulator evidence alone.

Dependencies:09. Scope:legal Gasoline mini-sim and device playtest, corrections
within00–09. Do not add next families to cover a weak loop.
Run Volume vs Precision with spot vs qualifying buyer, record revenue/COGS/time.
Test15–20min fresh session on Android. At least: first custom shipment, a meaningful
worker move, a useful investment choice, one completed job and clear next goal.
Ask player to explain why a recipe suits its buyer. Confirm repetitive sell/claim
clicks are not doing the work of strategy. Mark R1 as prototype, not complete V3.
Gate decision document:pass / adjust mechanics / stop expansion. Only after pass
proceed to R2. APK/push only when user asks for a tested slice.

## R2 — Midgame with specialization choices

### V3-11 · Lube/Jet + upgraded infrastructure and modules

Status: **COMPLETE IN CODE** — 11a `a857b53`, 11b/c `5f24c17`, UI `f0a0faa`.
Checks: `check:v3-lube`, `check:v3-modules-jet` plus all prior V3/legacy checks.
Evidence notes: Q65 at C2 is reached through the legal route; Q75 Jet is proven
on a labelled C3 fixture because the C2→C3 predicate belongs to V3-13. Only
Operators staff lines until V3-12. Legal C2 funding of 2 Lube + Power Lv2 +
Lube Tank Lv2 through Gasoline spot took 630 cycles (~52 sim min): flag for V3-18.
Android device interaction with the new panels is not claimed.

Dependencies:10 pass. Split11a Lube/C2,11b modules/rank1,11c Jet/C3.
Port all inputs/outputs through variant ledger and fair planner. Implement V3-A
downstream recipes, power demand with profile/level/staff, storage upgrades, module
purchase/switch validation, LabLv2 and research mappings needed for rank1.
Add development sampling/fees for these families; all programs use same evaluator.
Apply4×4 expansion cost/unlock through shared action; preserve geometry.
Acceptance:production numbers and preview agree under constraints; module mismatch
cannot secretly downgrade Q; actual generator demand includes all modifiers;
Q65 reachableC2 and Q75 JetC3; multi-cell level/staff independent.

### V3-12 · Full workforce/support and progression mapping

Status: **COMPLETE IN CODE** — engine `a2a2990`, UI `2d7c3fd`. Check:
`check:v3-roles` plus all prior V3/legacy checks.
Evidence notes: every role×plant/support eligibility is asserted; mass-hired
Mechanics/Sales hit their caps; R&D leads lose line/support benefit and return;
no-specialist quality path reaches Q65 (C2) and Q70 (rank1) through modules and
research, Q75 without a specialist needs rank2 at C4 (V3-14). Decisions recorded
as V3-A hypotheses for V3-18: staff cap by chapter 4/6/8/10/12; mechanics and
chemists count at most 3 staff-equivalents; job RP bonus cap 50%; productive XP
uses the legacy 1 XP per active tick. Safety Officer, Maintenance Workshop and
`saferOperations` stay locked with a visible reason because V3 maintenance/upkeep
is not implemented yet; perks/prestige do not exist in a fresh V3 save.
Revision-7 preview saves load by adding empty accomplishment records.

Dependencies:11. Implement all role assignments in Master's matrix, deterministic
vacancy hires, all duty caps/wages, contributions display, training legal actions,
minimal employee accomplishment records. Apply research/perk/specialization mapping
with explicit inactive skills; no double global output or surprise retirement.
Keep portraits/traits/assets. Expose RP costs/caps and alternatives to specialists.
Acceptance:all role×plant eligibility tested; workers assigned to R&D lose former
benefit until return; capped supports cannot win through mass hiring; legal no-
specialist path can eventually achieve required Q with knowledge/modules.

### V3-13 · Fleet/Airline ladder and repeat/rush progression

Status: **COMPLETE IN CODE** — engine `42c8ed4`, UI `7469d7b`. Check:
`check:v3-clients` plus all prior V3/legacy checks. **R2 human gate: PASSED** —
recorded 2026-09-26 as the player's decision after playing Android Preview APK
run #72 (player answer: "ผ่าน"). No per-item measurements were supplied; none are
invented here.
Evidence notes: 12 milestones for 4 clients generated from the Master table and S6
multipliers; ladder order, cooldown-from-acceptance, cancel/expire without bonus,
RP or XP, repeat income-only, C3 auto-repeat and Rush sizing/deadline/expiry are
asserted. Two C3 routes (Local+Performance, Local+Fleet) and C4 are proven on
**constructed fixtures** (certified blueprints/stock inserted directly); legal Q65/Q70
certification is proven separately in `check:v3-modules-jet`, but a full legal
fresh-progress run to C3/C4 is not simulated yet (V3-18). Q75 is attainable at C3
(Precision + module + rank1 + lead). Materials remains V3-14.

Dependencies:12. Add all remaining Local/Performance milestones and full Fleet/
Airline content. Implement C2→C3→C4 predicates, repeat cooldown/auto-repeat and
optional Rush only for previously proven routes. Include quote/time feasibility.
Acceptance:two distinct C3 routes, achievable75 airline target, all12
milestones for4clients at this stage; no Materials until14. Cooldown starts at
acceptance; cancellation cannot farm premium/XP; deadline clocks pause; first
milestone does not auto-infer later quality milestones.
R2 gate:20–30min midgame fresh-progress and constructed-fixture previews show viable
quality and quantity decisions; report fixture limitations, no wrong tank power UI.

## R3 — Complete campaign

### V3-14 · Advanced products and Materials

Status: **COMPLETE IN CODE** — 14a/b engine `3f19d0d`, UI `60b9c2b`; 14c engine
`9f7ff88`, UI `0533be7`. Checks: `check:v3-petro-polymer`, `check:v3-materials`
plus all prior checks. Evidence notes: Petro/Polymer/Waste Treatment recipes run in
the shared planner with one energy allocator; Polymer eats only unkept/unreserved
Petro (lowest Q first) with real basis; accepted Materials Petro is never eaten;
wrong branch cannot ship; family cap is shared by Q variants; Q75 without a
specialist at C4 via rank2 (Lab3 + advancedProcessing); 5×5 at C4 ($25,000) and a
17-building full chain fit the 25-lot budget; every V3 stock write goes through
productInventory.ts (asserted). All tests at C4 use **constructed fixtures**.
Maintenance (owner decision 2026-09-26: "add it at the right time"): added as
**V3-14d** before V3-15, because V3-15's operating-profit gate needs it — engine
`a75be94`, UI `4a1add2`, check `check:v3-maintenance`. S3 formula, starter waiver
to C2, capped upkeep cuts (workshop/research/Safety Officer/skills ≤25%), and
Emergency operation without debt. Workshop local adjacency 10% waits for V3-16.
Materials has no Rush (branch is per job);
waste disposal is shown per tick but not yet a persisted lifetime statistic.

Dependencies:13 pass. Split14a Petro,14b Polymer/reservations,14c Materials/Lab3.
Port Petro/Pellets/recycled/asphalt manual paths to ledger, remaining research
and support effects; WasteTreatment actual recipe and disposal stats. Implement
Materials OR-branch jobs, stock basis transfer, rank2,5×5 expansion and all15
milestones. No second Polymer resource loop outside planner.
Acceptance:held/contract Petro never eaten by Polymer; wrong branch cannot submit;
Q75 achievable without specialist atC4; family cap shared;25lot spatial budget and
all Q prerequisites checked; no parallel inventory writer left for any product.

### V3-15 · Campaign end, reports and freeplay

Status: **COMPLETE IN CODE** — engine `feat(gameplay): implement V3-15…`, UI
`feat(ui): V3-15…`. Check: `check:v3-campaign-end` plus all prior checks.
Evidence notes: clear requires exactly 3 of 5 Partners, ≥2 families, Airline or
Materials among them, a Showcase from a developed Q65+ recipe and positive
recognized operating profit over a complete 180s window; completion bonuses,
grants and estimated-basis receipts are excluded, and revision-10 saves upgrade
with all earlier receipts unrecognized. Clear is sticky, saves one report (restored
from save) and pays nothing extra. Award periods (3,600 ticks) freeze targets at
period start and pay grade RP only above the best already paid (cap 15). 6×6
($100,000) opens only after clear. Reset starts a fresh V3 state; there is no
NewGame+. Clear/award cases use **constructed fixtures**; a legal full run to C5
belongs to V3-18.

Dependencies:14. Implement showcase predicates/reward, rolling180s profitability
gate, sticky clear, report, optional challenges and6×6 unlock. Add frozen-period
award targets and capped one-time award RP. The old Legend system is not imported.
Acceptance:3of5/2families/advanced condition exact; no need all buildings/research;
old uncertain-basis sales and gifts cannot fake clear profit; no double clear/award
payout; report restorable from save. No NewGame+ button without actual reset path.

### V3-15.5 · Expandable Yard Foundation (inserted before V3-16)

Status: **COMPLETE IN CODE** — engine+checks `ee38f2b`, yard view `afb1fe8`.
Check: `check:v3-yard` plus every prior V3/legacy check (all migrated to yard
coordinates). Scope: 100×100 world, land parcels, footprints by type×level, shared
placement validator, `unlock_land_parcel`, `move_building`, building caps,
upgrade-growth preview, demolish guards, derived occupancy, road layer data,
Skia yard view with pan/zoom, build/move/upgrade/land previews and real reasons.
**Device check: PASSED** — player decision after APK run #76 ("ผ่าน"; yard has a
good sense of goal). Player note: some targets were hard to read → V3-16 replaced
internal IDs with names and rewrote period targets as plain checklist lines.

### V3-16 · Layout feedback and controlled events

Status: **COMPLETE IN CODE** — engine `69b5e03`, UI `77d6f0f`. Check:
`check:v3-layout-events` plus all prior checks. Evidence: tank/workshop adjacency
per target, once per kind, 4-direction tiles, preview before placing, capped
upkeep; move/demolish loops earn nothing; inbox unique/spaced/suppressed, one
pending decision, RP-only, not read by campaign logic; reload keeps an accepted
job and running development intact. **R3 gate pending:** needs the player's
device run AND a labelled legal full run to the ending — that legal run is not
simulated yet (clear is fixture-proven only).


Dependencies:15. Implement only Master's local tank/workshop adjacency; preserve
discovery history, replace old global power combo. Add minimal optional inbox
events (customer thanks, staff accomplishment, experiment opportunity) with unique
IDs/cooldown/suppression. No destructive old event path or auto inventory debit.
Acceptance:adjacency per target and no stacking beyond one; move/swap cannot farm;
no overlapping modal or Info disappearance; events not prerequisite to clear;
test app/background/modal flow with accepted job and running development.
R3 gate:complete content is present, ending attainable in a labelled legal run;
UI includes empty/blocked states, not placeholders presented as finished systems.

## R4 — Persistence, calibration and release quality

### V3-17 · Production persistence cutover and reset

Dependencies:16. Promote the fresh V3 save to the only production writer. Remove
the temporary old-game entry and ensure no old tick/trade/reward writer runs after
cutover. Implement explicit full V3 reset; do not import or convert old saves.
Acceptance:fresh/reload/reset round-trips are exact; corrupt/newer versions fail
safely without overwrite; no project/job/inventory/reward contamination across
runs; recovery and loaner provenance survive reload; exactly one writer runs.

### V3-18 · Legal full-loop simulation and economy calibration

Dependencies:17. Subtasks:18a replace simulator shortcuts;18b baselineV3-A;
18c data-only retune with report. UI and policies share every action validator.
Policies volume/spot,quality/client,economy/compact,automation control; fixed seeds
1/7/42/20260925. Include conservative missing-specialist strategy, lean cash,
wrong investment recovery and stock-reservation stress case.
Measure SystemsS9 outputs; mark old14h simulator as historical, not target.
Test all authored jobs and ensure no bottleneck requires36lots. Distinguish spatial
fit from affordable production; verify whole campaign path through legal actions.
Acceptance:invariants all green; first-session and campaign timing measured; at
least2tradeoff strategies; payback estimated using actual bottleneck counterfactual;
RP sufficient without repeat farming; no hidden event/award wait required. Update
tables to final candidate V3-B only with stated rationale, not unsupported claims.

### V3-19 · Android acceptance and handoff

Dependencies:18. Complete mobile QA fresh/established save, first20min/midgame/
late/showcase/freeplay; test UI interactions for all repaired reports. Portrait
small screen, text wrapTH/EN, touch sizes, safe areas, sheet scroll, speed/pause,
app resume, save reload, accidental repeated taps. Verify old art/map still usable.
Record actual device vs headless evidence separately. Fix release blockers only.
Acceptance:definition of done in Master; remaining backlog clearly nonblocking;
typecheck/integrity/ledger/legal-sim/camera/map checks pass on exact candidate commit;
README/CURRENT_TASK match reality; reviewable release notes. Push/build only on
user authorization; return exact build/version/download details after success.

## Verification commands and required new checks

Existing commands:

```bash
npx tsc --noEmit
node --import tsx scripts/sim-check.ts
node --import tsx scripts/camera-check.ts
node --import tsx scripts/factory-map-check.ts
git diff --check
```

New scripts proposed by tasks (do not claim these exist yet):
`gameplay-integrity-check.ts`, `product-development-check.ts`,
`product-ledger-check.ts`, `job-ledger-check.ts`, `gameplay-v3-sim.ts`,
`gameplay-v3-persistence-check.ts`. Keep scope focused; consolidate if clearer.
Old sim-check may fail its old duration band after deliberate rules changes;
replace pacing expectations in18, never suppress a new conservation failure.

## Traceability: reported problems and promises

| User problem / design promise | Owning tasks |
| --- | --- |
| ไฟไม่พอ/โรงไฟฟ้าอัปไม่ได้ | 00,01,02a,11,18 |
| ถังสินค้าอัปไม่ได้/งานเกินความจุ | 02b,04,08,11,14 |
| Assign คนไม่ได้/โบนัสไม่ตรง | 02c,06,12 |
| Info/build popup พัง | 02c,09,16,19 |
| สร้างไปจนหมดแล้วไม่มีอะไรตัดสินใจ | 07,08,10,13,15 |
| สินค้ารุ่นต่างกันและไม่ใช้สูตรเดียวตลอด | 05,07,11,14,18 |
| คนมีผลงานและช่วยพัฒนา | 06,07,12 |
| มีจุดจบแต่ไม่บังคับสร้างทุกอย่าง | 13,14,15,18 |
| เซฟ V3 ใหม่/เปลี่ยนรุ่น/รับเงินไม่ซ้ำ | 03,04,08,17 |
| ภาพถนน/Plant/เพลง | Deferred backlog; no dependency or permission to edit here |

## Handoff format after each task

Report: task ID + completed behaviors, exact commit/files, tests actually run,
before/after invariant evidence, save impact, device checks still pending,
next dependency and remaining risks. Update status only after evidence exists.
Never say “R2 complete” because only helper code is present without reachable UI.

Copyable first implementation instruction, when the user wants to start:

> Read AGENTS.md, the V3 README handoff, GAMEPLAY_MASTER_PLAN_V3.md,
> GAMEPLAY_SYSTEMS_V3.md and GAMEPLAY_IMPLEMENTATION_V3.md. Implement V3-00 only:
> reproduce the audited failures with deterministic integrity fixtures and record
> the exact baseline. No gameplay/art/economy/save change and no push/build. Do not
> continue into other task IDs until the authorized scope includes them.

For a broader request “ทำ R0 ให้จบ”: execute00→01→02 and their acceptance checks,
not only00; no repeated confirmation within that authorized slice.
