# Gameplay V2 — Execution contracts for coding models

> **SUPERSEDED / DO NOT EXECUTE THIS BACKLOG:** use
> [GAMEPLAY_IMPLEMENTATION_V3.md](GAMEPLAY_IMPLEMENTATION_V3.md) instead.
> Reuse relevant audit fixtures, not a second G0–G11 implementation track.

Date: 2026-09-25. **All tasks below are NOT STARTED.**
Design authority: [GAMEPLAY_ROADMAP_V2.md](GAMEPLAY_ROADMAP_V2.md).
The audit/planning request does not authorize implementation, push, or build.

## Start here

Read `AGENTS.md`, README's dated handoff, the V2 roadmap, and only the selected
task's relevant source. The shipped project is Expo/React Native, not the
archived Vite project. Use source over historical completion claims.

Release mapping: build #68 used remote `51bc987`; the locally audited gameplay
is in the ancestry of `6961511`. Reconcile the actual branch/worktree before
starting. Local history and API-created release history have different commit
IDs; do not force-push one over the other.

### Execution rules

- Implement exactly the selected task. One coherent commit per task/subtask.
- Do not delegate unless separately authorized. Do not change art or the map.
- Use shared pure functions for real actions and simulations; UI wrappers may
  supply effects/toasts but not alternate business rules.
- Add regression tests before changing the identified behavior. Record old
  failures openly; do not call expected failing baseline tests a passing gate.
- New state fields: default + migration + repeat-migration test + reload test.
- Treat every numeric candidate in the roadmap as a tuning hypothesis. Record
  measured before/after effects; never present it as already calibrated.
- R1 functional correctness comes before R2 content. G9 kits are optional.
- No automatic APK after each task, no external push/build without authorization.
- Stop at each release slice's human playtest gate.

### Verification commands already available

```bash
npm run typecheck
node --import tsx scripts/sim-check.ts
node --import tsx scripts/camera-check.ts
node --import tsx scripts/factory-map-check.ts
git diff --check
```

The last two simulator checks concern camera/map compatibility, not gameplay
quality. Existing `sim-check` duration floors encode the OLD pacing hypothesis.
Report an intentional pacing mismatch separately from an invariant failure;
change its thresholds only in G10 with a written before/after rationale.

## R1 — Trustworthy factory

### G0 — Reproduce the blockers and establish an honest baseline

Dependencies: none. Changes allowed: isolated test scripts and test docs only.

Files to read: `src/game/data/balance.ts`, `gameCalculations.ts`, `gameTick.ts`,
`src/hooks/useGameLoop.ts`, `scripts/full-loop-sim.ts`, `scripts/sim-check.ts`.
Suggested new script: `scripts/gameplay-integrity-check.ts`.

Fixtures/assertions:

1. Lv5, tick24, 20 feedstock, 0 crude/power, Lube + starter line: reproduce
   electricity −3 with no Power Plant, and feedstock 20→14/output0 with one.
2. Repeat after 100 cycles; no negative resource is permitted by the desired
   invariant. Full/paused lines must not consume resources.
3. Two identical plant cells, upgrade only one; only its contribution changes.
4. Capture currently unsupported Power/Tank upgrades, not just asset presence.
5. Assignment eligibility matrix: current Jet/Petro/Polymer only. Distinguish
   a missing feature from a broken eligible assignment.
6. Every permanent/Rush job: product route and capacity feasibility at offered
   level; tag designed future previews separately.
7. Capture legacy auto-pilot assumptions: automation unlock bypass, premature
   hires, missing hire year, unassigned workforce, incomplete contract ladder.

Use fixed RNG seeds. Output failing invariants as diagnostic baseline entries;
promote them to hard assertions as G1–G4 repair them. Do not modify gameplay to
make G0 green. A failing reproduction is the expected outcome of this task.

Acceptance: reproducible command/output, exact fixture setup, no runtime edits.

### G1 — Atomic resource accounting

Dependencies: G0. Files: `gameTick.ts`, focused pure allocation helper if needed,
`gameCalculations.ts`, `gameStorage.ts`, integrity tests.

Keep current content and rates. Plan each due operation from input, electricity,
output space and priority; commit consumed inputs and output together. Cover
downstream plants, Polymer, generators, and feedstock; verify gasoline too.

- One shared policy must prevent update-order starvation between advanced lines.
- Zero supply/space/priority means no attempted transaction or input debit.
- Partial operations consume only the recipe fraction actually processed.
  If rounding is needed, persist bounded fractional carry with the matching
  consumption, not a fresh free fraction each tick. Level/staff yield bonuses
  are explicit recipe modifiers, not a mass-conservation test failure.
- Until G2, a bypassed electricity requirement must not debit electricity.
- Overflow must follow a documented clamp/hold policy, not hidden deletion of
  purchased resources. Migration sanitizes already-negative electricity once.

Acceptance: run zero/partial/full input × zero/partial/full power × empty/nearly
full/full output fixtures; all pools finite/nonnegative; no paid input vanishes
when output/carry is zero; total scarce allocation never exceeds supply; repeated
save/load cannot mint output. Existing rates match before/after when unconstrained.

### G2a — Shared upgrade definitions + explicit power model

Dependencies: G1. Files: `balance.ts`, `gameCalculations.ts`, `gameTick.ts`,
`useGameLoop.ts`, `types.ts`, `gameStorage.ts`, Factory and Operations screens,
translations. Suggested helper: `src/game/utils/buildingUpgrades.ts`.

Implement roadmap §4.1: built-in gasoline utility, permanent 4/5s advanced site
connection, per-cell generator levels, and candidate generator values/costs.
Remove every runtime check that enables/disables power gating based on whether
any generator exists. Keep the advanced demand rule constant.

Create shared `getBuildingUpgradePreview(state, cell)` and validated upgrade
action returning a specific unavailable/max/insufficient-funds reason. Both UI
and action must use the same data; remove duplicate allowlists for covered types.

Use base battery20 + sum generator capacities. Clamp impossible old electricity
to [0,newMax] on migration. Preview rates per minute at 1×, not per ambiguous
cycle; show battery separately. Include all actual consumers in the declared
advanced model, and label gasoline's built-in supply. Distinguish installed
demand from active demand and actual generation when fuel/battery constrain it.

Acceptance:

- Test 0→1→0 generators: no gasoline power regression, no free advanced-energy
  bypass after demolition. Leveling one generator does not level all.
- Level1/2/3 generate 12/24/42 per full 5s cycle, costs and caps match UI.
- Power upgrades work through the actual action/UI, save/reload, move and swap.
- At simulated rates: Lube+Jet+Petro require12/5s; adding Polymer requires18/5s;
  one Lv1+connection supplies16/5s, Lv2+connection28/5s.
- Full battery stops unnecessary fuel use. Fuel shortage has an explicit reason.

### G2b — Product tank upgrades + accurate previews

Dependencies: G2a. Files: same upgrade helper, balance, derived capacities,
Factory/Business/Operations storage displays, storage migration/tests.

Implement roadmap §4.2 five tank level tables and candidate costs. Use
`gridLevels[cell]` per tank, then sum contributions. Keep existing Lv1 capacities
unchanged and do not erase stock. All views read the same derived capacities.

Audit every upgradeable building preview, especially Lab/Workshop/Sales Office:
some current effect lines read level1 even when a different level is passed.
Do not advertise a benefit the effect function does not provide. Unsupported
buildings say `No level upgrade`, not `MAX` or a fictitious next-level thumbnail.

Acceptance: mixed-level capacity sums; one Lv3 Jet Tank gives200+300=500;
two Lv3 Petro tanks give200+250+250=700; save/reload and move/swap preserve levels;
affordability and max-level checks agree between UI and action; core tank cost
imbalance is reported for G10, not silently retuned here.

### G3 — Existing staff paths and feasible-offer messaging

Dependencies: G0; merge after G2b. Files: Team/Factory/Business screens,
`gameCalculations.ts`, `useGameLoop.ts`, `rotatingContracts.ts`, translations.

Do not add local Operator behavior yet. One shared eligibility helper for the
three current specialists. Test both directions of assign/unassign/transfer.
Do not show global staff as idle. Give clear reasons for no eligible building,
no employee, occupied slot, or wrong role, and a valid route to resolve each.

Contracts whose product cannot yet be produced remain clearly future previews,
not recommended ready-to-accept work. For Rush jobs, use a conservative supply
estimate and capacity until G6 enables staging; suppress impossible recommended
offers. Do not quietly grant locked buildings or free goods.

Acceptance: assign a Jet specialist from Team and Plant Info on a Lv10 fixture;
only that plant improves; invalid assignments are rejected with a reason;
move/swap/demolish/reload do not lose or duplicate the person. Operator/Lube
still explicitly labelled unsupported for local assignment pending G4.

**R1 human gate:** fresh starter run plus Lv5/10 fixtures. Upgrade Power/Tanks,
identify true power shortage, and assign an existing specialist without guidance.
Report what remains deliberately deferred. No claim that R1 alone fixes fun.

## R2 — One enjoyable loop

### G4a — Local operational staff model

Dependencies: R1 approved. Files: calculations, worker/skill data, production,
types/storage, validated assignment actions. Screens only as needed for access.

Implement roadmap §4.3. Operator is local on production lines; advanced matched
specialists remain local. Support roles stay global. Introduce a single
eligibility/effect function used by hiring, Team, Plant Info and tick math.

- Before per-cell Distillation staffing, decompose its contribution to shared
  gasoline/feedstock output. A worker's bonus must be weighted by that cell's
  contribution; applying it to the entire fleet is forbidden.
- Remove Operator's old global production term when introducing local output.
- Operational output skills are local only. Non-output skills of assigned
  operational workers may remain explicit global support bonuses; **Reserve
  operational workers contribute no role or skill effects at all**.
- Global support-role skills retain current caps; audit/record those separately
  so no role effect is silently counted twice.
- Fractional bonus output accumulates; +15% of a small batch must not round to0.

Acceptance: two-identical-plant control test with one employee assigned; moving
that employee moves only the marginal contribution. Same employee cannot occupy
two cells; rejected assignment is a no-op. Test a trained worker under an actual
bottleneck: advertised potential and constrained output remain distinct.

### G4b — Staffing UX, migration, and campaign continuity

Dependencies: G4a. Files: Team, Recruit, Plant Info, storage, annual close,
employee wage/retirement utilities, translations.

Use one lead slot per processing cell. Preserve valid assignments; assign old
Operators into vacancies deterministically as described in the roadmap; extras
go to Reserve. Reserve operating wage is25%, no effects. Never remove employees
because a new cap is lower. Global-support roles remain clearly working.

Disable forced retirement for the new campaign rules, including after clear
until a separate voluntary-mentoring feature is approved; do not auto-resume it.
Retain hire-year/history for display. Add a deterministic normal-cost hire route
for an eligible operational vacancy. No paid reroll requirement.

Acceptance: established save retains names/XP; migration twice is identical;
team counts reconcile to active+support+reserve; global/support wage unchanged;
reserve cannot provide cheap global skills; no worker disappears at old five-year
boundary; a new player can assign the first Operator from Plant Info.

### G5 — Focused job + protected stock

Dependencies: G3; R2 integrates after G4b. Files: contract helpers, types/storage,
trade loop, Factory goal strip, Business contract board, translations.

Add one accepted/focused job record, stable identity, immutable quoted reward,
and at most three recommended alternatives. Keep all existing catalogue/history
behind a secondary view. Pure feasibility and reservation helpers must power
both display and action validation. Other contracts can remain browsable, but
do not complete them using reserved stock without explicit cancellation.

Compute protected stock from the current job requirement minus delivered amount
(zero until G6). Auto-sell only unreserved stock. Manual sell clearly shows
protected/available quantities; it must not silently consume protected stock.

Acceptance: auto-sell cannot stop the focused job from accumulating required
goods; ordinary completion pays exactly once; cancel releases protection;
reload preserves focus/quote; full inventory and impossible offers have a
specific next action. No duplicate overlay or new primary navigation tab.

### G6 — Staged deliveries and job-aware automation

Dependencies: G5 + G1. Suggested pure helper file: `src/game/utils/contractActions.ts`.

Record `delivered` by product on the accepted job. Deliver only
`min(requested, available, remaining)`, decrement real stock atomically, never
exceed requirement. Complete once every required product is shipped; reward,
RP, reputation, milestones and history in the same guarded transition.

- Snapshot the quote at acceptance; delivery later uses that snapshot.
- No intermediate payment in MVP. Display working-capital warning before accepting.
- Normal jobs have no deadline; accepted Rush jobs use a persisted simulation-tick
  deadline. Expiration/cancellation forfeits shipped goods with confirmation/
  receipt and releases stock protection, no new monetary penalty.
- Opt-in auto-dispatch threshold: min(remaining, max(1, floor(capacity×0.5)))
  for each required product. Evaluate dispatch/completion before auto-sell.
- On a final multi-product job, shipment may occur separately by product.
  Treat impossible future gasoline+product mixed contracts correctly too;
  do not reproduce the current either-gasoline-or-products branch assumption.

Acceptance: 500 Jet delivered through a260-capacity tank; partial save/reload;
multi-product completion; duplicate taps; exact-deadline boundary; speed/pause;
cancel then refocus; no inventory/reward duplication. Every accepted promise has
a feasible route or an explicit preparation warning and a recoverable choice.

### G7 — One customer progression prototype

Dependencies: G6. Files: small client config, contract/standing-order actions,
types/storage, Business client section, Factory feedback, translations.

Prototype Fleet/Lube only using the roadmap's Trial→Regular→Partner rule.
Map existing Lube contract IDs explicitly in data; no alternate completion
engine. Standing-order count only increases on a genuine consumed delivery,
never on menu opens or repeated reward claims. IDs/flags make transitions and
rewards idempotent. Backfill prior matching completed contracts; unknown past
standing deliveries are not fabricated.

Partner unlocks a predictable repeat offer, not a permanent global income buff.
Show next step and named contact with existing portrait assets; no new art needed.

**R2 human gate:** in20 minutes on a midgame fixture the player selects between
at least two feasible plans, makes a useful staff/investment decision, ships,
and understands the next client opportunity. Count distinct decisions, not taps.
If it feels like another progress bar, revise G7 before adding clients or kits.

## R3 — Identity and experimentation

### G8a — Two additional customers

Dependencies: R2 approved. Extend the same data/action flow to service stations
and airline. Assign explicit existing job IDs and add only missing authored
milestone definitions. Use stated roadmap transitions. Keep one active focus.

Acceptance: each client has a feasible unlock path, no repeated milestone
reward, no duplicate standing-order system; two offers create a measurable
cash/time/relationship tradeoff on the same saved state.

### G8b — Local combo preview

Dependencies: R2 approved. Files: combo evaluator, production contribution
helpers, placement preview/Plant Info, discovered-combo state.

Audit where each current combo actually applies before changing it. Convert
documented local effects to per-target evaluation and cap once per target;
retain global effects only if explicitly named as global. Preview touched cells,
benefit and any existing pollution penalty. Preserve discovered history and
prevent farming discovery rewards by moving buildings repeatedly.

Acceptance: moving one tank changes only documented neighbors; displayed delta
matches production math; road/world-slot projection does not change; a learned
combo is discoverable in a small list without a new main tab.

### G9 — OPTIONAL Lube equipment choice

Dependencies: G8b, explicit go-ahead after playtest. Implement only Lube Lv2
throughput/economy alternatives from roadmap §6, not an equipment inventory.
For the prototype switching is free while paused and applies at the next cycle;
no switching exploits, timer reset, fractional-carry duplication or mid-cycle
double output. Later switching costs require separate tuning.

Acceptance: show scenarios where each option is preferable; neither wins all
cash/throughput/power measures. Reject the feature if both just feel like a tax
on choosing the faster button. Do not block R4 if this experiment is cut.

## R4 — Balanced campaign

### G10a — Legal-action simulation and economy report

Dependencies: R2 at minimum; repeat after R3. Extract action families in small
subcommits: purchases/upgrades, hiring/assignment, contracts/trade, progression.
Both app and simulator call the same validators/reducers. Preserve UI effects.

Simulate cautious, throughput, job-focused and automated policies across fixed
seeds. No free hires, locked automation, fabricated rewards, infinite capacity,
immortal staff via missing metadata, or instant acquisitions outside rules.
The new no-forced-retirement rule must apply identically to app and simulator.

Record cash ledger, grants separately, payroll/upkeep accrual, resource/cell
occupancy, accepted/completed/expired jobs, idle reason durations, timestamps,
and actual input/output per line. Do not estimate fun from reaching Legend.
Keep the old auto-pilot as a clearly labelled stress/legacy reference if useful.

### G10b — Tune one economy dimension at a time

Dependencies: G10a. Data edits only unless report establishes a formula defect.

Order: operating margins → building-vs-upgrade prices → storage/slot burden →
crew wages/training → contract premiums → level/expansion gates → endgame targets.
Compare counterfactual net benefits, not gross income. Verify a campaign route
within25 lots. Measure gasoline upgrades versus extra $45 units and ensure
at least two sensible options, without destroying the cheap starter loop.

Use roadmap §8 guardrails. Test production under full tanks, low crude, low
power, saturated prices and automation; a theoretical profit must not mask
recurring starvation. Revisit the old 180k/320k tick thresholds with explicit
evidence; never just raise duration again to fill an empty middle game.

Acceptance: before/after tables for each edited parameter family, multi-policy
results, no unreachable mandatory goals, all invariants hard-fail, fresh and
established device playtests. Commit tested values separately from action refactors.

### G11 — Campaign payoff and optional long game

Dependencies: G8a + G10b; G9 not required. Files: endgame/campaign data, types/
storage, achievements, award period state, win UI, translations.

Implement first-clear criteria: three Partner clients + one advanced-product
flagship (Petro OR Polymer) + A-or-better operating-period award. Resolve exact
existing advanced contract IDs in data. Sticky once earned, not a fluctuating
inventory condition. Retain old Legend and prestige records as optional goals.
Do not require all research/every plant/6×6 for main clear.

Show campaign destination early, permit continued sandbox play. Freeze and
display rival target scores at period start; do not silently change within the
period. The existing prestige eligibility remains until its post-clear variant
has an explicitly approved reward/migration design; no misleading unlocked CTA.

Acceptance: three clients' facts migrate correctly; already-earned records
preserved; rewards never replay on reload; multiple valid25-lot strategies can
clear; no demand to sit idle for hours after all decisions are exhausted.

## Report template after EACH task

1. Task ID and what was deliberately not changed.
2. Source files changed; shared rule/action used by UI and simulation.
3. Before/after reproduction and tests, including failures and assumptions.
4. Save/migration behavior and device checks still unverified.
5. Next task dependency; stop at a human gate when required.

## Copyable next instruction (after approval)

> Read AGENTS.md, the dated README handoff, GAMEPLAY_ROADMAP_V2.md and
> GAMEPLAY_TASKS_V2.md. Implement G0 only: reproduce the power, capacity,
> assignment and simulator-validity findings with deterministic fixtures.
> Do not change gameplay, art, map, economy values, save format, or build/push.
> Record expected baseline failures honestly and hand back the audit results.

Do not replace this with "finish the whole roadmap". Each task's acceptance
criteria are a contract, not permission to invent further mechanics.
