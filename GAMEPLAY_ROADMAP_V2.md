# Gameplay V2 — Playable decisions, not a longer checklist

> **SUPERSEDED FOR FUTURE DESIGN:** the user subsequently selected product
> development. Use [GAMEPLAY_MASTER_PLAN_V3.md](GAMEPLAY_MASTER_PLAN_V3.md),
> [GAMEPLAY_SYSTEMS_V3.md](GAMEPLAY_SYSTEMS_V3.md), and
> [GAMEPLAY_IMPLEMENTATION_V3.md](GAMEPLAY_IMPLEMENTATION_V3.md). Section1 audit
> evidence remains valid for the inspected baseline. Do not implement V2's
> full-payment-only shipments, Lube-first prototype or recipe deferral over V3.

Date: 2026-09-25. Status: **DESIGN PROPOSAL / NOT IMPLEMENTED**.
Requested after build #68 device feedback. This session changes documentation only.
Baseline inspected: local `6961511`; released code was pushed as `51bc987`.
Implementation handoff: [GAMEPLAY_TASKS_V2.md](GAMEPLAY_TASKS_V2.md).

## Decision in one paragraph

Repair broken operating rules first. Then turn the existing contract catalogue,
staff roster, and layout bonuses into a small recurring management loop:
**choose a customer job → arrange capacity and crew → deliver → earn a new
business opportunity → choose the next investment**. Do not add more products,
currencies, tabs, random interruptions, or mandatory waiting to manufacture depth.
Keep the current art; PixelLab/map work remains deferred.

## 1. What the audit actually established

These are source findings and headless diagnostics, not a claim of device QA.

| Finding | Evidence in current code | Player consequence |
| --- | --- | --- |
| Power Plant cannot upgrade | `upgradeBuilding` in `src/hooks/useGameLoop.ts` and `UPGRADEABLE` in Factory exclude it; generation uses count, not cell level | Only building additional plants helps; level artwork does not imply a working upgrade |
| Five product storage buildings cannot upgrade | Same exclusions; `TANK_FARM_BALANCE.storagePerTank` is flat; derived capacity ignores their levels | Expansion consumes many lots before advanced jobs fit |
| Staff assignment is only for three specialist roles | `CELL_SPECIALIST`, `PLANT_PRODUCTION`, Team picker, and action validation support Jet/Petro/Polymer only | Operator, Lube, and most early-game buildings cannot use the expected assignment interaction |
| First generator activates a new restriction | Gasoline/downstream checks use `buildingCounts.powerPlant > 0` | A generator can reduce production; demolishing the last generator removes the restriction |
| Power readout excludes gasoline | `getPowerBreakdown` and `electricityDemandPerCycle` count only downstream demand | `12 / 3` can coexist with a real power shortage |
| Resource accounting can charge for no output | Downstream loop deducts total feedstock demand after power-limited production | With no electricity, feedstock can vanish and no goods appear |
| Electricity can become negative | The no-generator path skips the limit but still subtracts downstream demand | Invalid state hidden by the existing regression gate |
| Contracts require the whole inventory at once | `completeContract` checks full requirements; no delivery ledger | Storage size, not operational planning, becomes the hard gate |
| Offer level does not guarantee a production route | Jet contracts #19/#20 unlock at Lv7/Lv9, Jet Plant at Lv10; Petro #35 unlocks at Lv14, plant at Lv15 | Offers appear before the inspected production path exists; previews should not be actionable recommendations |
| Auto-sell has no focused-job protection | `applyAutoTrade` uses storage thresholds, not job reservations | The player can be selling away the stock they are trying to accumulate |
| Existing simulation is not a legal player-action test | Auto-trade on from tick 0; `decide` writes state directly; worker loop omits role unlock checks and hire year; no assignments | Passing the simulation does not establish that the same experience works through the UI |
| Retirement and progression clocks conflict | 5 business years × 12 minutes/year; real hires set `hiredOnYear`, simulated hires do not | Real players replace trained staff in roughly an hour; the simulator's hires never retire |

### Diagnostic results from this session

1. Set a Power Plant's cell to levels 1, 2, 3: electricity capacity stays 60.
   Set each product tank to levels 1, 2, 3: its capacity is unchanged.
2. Minimal one-tick fixture: refinery Lv5, tick 24, one Lube Plant,
   20 feedstock, zero crude, zero electricity; other starter buildings present.
   - No generator: 5 lube produced, feedstock 20→14, electricity 0→−3.
   - One generator unable to run without crude: 0 lube, feedstock 20→14,
     electricity remains 0.
3. Isolated 60-second capacity probe, refinery Lv9, one Distillation + one
   Lube Plant, all Lv1. Crude replenished and output emptied every tick to remove
   cash/storage bottlenecks. **This is not a legal playthrough or profitability
   estimate.** With 0/1/2/3 generators, gasoline produced was 366/121/280/403;
   lube stayed 60. Generator adjacency can also change gasoline yield, so do not
   use the totals as a pure power-efficiency comparison. They demonstrate the
   first-generator regression. One generator supplies 144 energy/min; gasoline's
   nominal demand here is ~333 batches/min before 36 energy/min for Lube.
4. Existing `node --import tsx scripts/sim-check.ts` **passed** at 256,392 ticks.
5. Seeded legacy playthrough (LCG seed 20260925; `s = (1664525*s + 1013904223)
   mod 2^32`, random = s/2^32) reached Legend at 256,125 ticks = 14.23 hours at 1×.
   Levels 2/5/10/15/20/30 arrived at approximately 12/42/87/178/268/542 minutes.
   It completed 25 of 41 permanent contracts, with 120 employees, **0 assigned**,
   and **0 employees with a hire year**. This is one reproducible simulator run,
   not the user's save or a validated target play length.

### Storage is inconvenient, not universally impossible

Current base storage for Jet/Lube/Petro/Pellets is 200 each. Current tank bonuses
are +60/+75/+50/+40 respectively. Jet #37 asks for 500: five Jet Tanks above
the base capacity. Petro #40 asks for 600: eight tanks. Pellets #41 asks for
450: seven silos. These are solvable with enough lots/rearrangement, not proof
that every save is permanently blocked. They are poor default recommendations.

The three permanent Lube contracts ask for 50/100/180 and fit base storage.
If the reported Lube job is larger, inspect its exact ID: Rush Orders scale
quantity with level without checking capacity or achievable completion time.
Do not fabricate a permanent Lube-capacity bug to match the report.

## 2. Why repairing bugs alone will not make it fun

Design hypothesis: the current loop rewards buying more and waiting longer,
but rarely lets the player establish a plan, see its result, and unlock a
different kind of opportunity. More throughput is usually the universal answer.

The Kairosoft comparison is a useful direction, not a recipe to copy. For example,
the official Game Dev Story description links staff development to new genres
and content, and encourages combinations: progress changes what one can attempt,
not just how quickly a counter rises.
Reference: https://store.steampowered.com/app/1847240/Game_Dev_Story/

For this game, aim for:

- **Anticipation:** an identifiable customer's next job is within reach.
- **Agency:** choose steady cash, a relationship milestone, or an optional rush.
- **Experiment:** a different assignment/layout measurably changes the result.
- **Attachment:** a named worker contributes to a recognizable success.
- **Payoff:** delivery opens an opportunity, not merely a larger quota.

Working operations should be satisfying to watch. Do not break them every minute
to demand attention. Automation handles repetition; the player chooses priorities.

## 3. Locked scope and design rules

1. This roadmap is a proposal, not authority to implement all phases at once.
2. Preserve the current renderer, art, UI shell, navigation, world slot IDs,
   native build setup, and working save flow. No engine migration.
3. Do not require new art for the gameplay prototype. Use existing portraits,
   product icons, banners, and simple labels.
4. The 5×5 core remains; preserve the existing 6×6 late extension for old saves.
   A campaign completion strategy must fit within 25 lots. The extension is
   optional capacity, not the only escape from a design deadlock.
5. One source of truth for upgrade support, costs, assignment eligibility,
   production effects, and the numbers displayed in a preview.
6. A max-level label is legal only if that building actually supports levels.
7. Never consume inputs for a skipped operation. Constrain the transaction before
   committing consumption; rounding and carry must not create free output.
8. Every new saved field gets a versioned, idempotent migration. No save reset.
9. Offer deadlines use simulation ticks. Pausing/closing the game cannot expire
   accepted jobs. UI browsing must not turn into a reflex challenge.
10. Never make a purchase mandatory without a visible, affordable recovery route.

## 4. Foundation redesign — remove the traps

### 4.1 A readable power rule

**Proposed simplification, not current behavior:** the starter gasoline/
distillation line has a built-in utility supply and is always independent of
the advanced-plant electricity pool. This rule does not change when a Power
Plant is built or demolished. Label it explicitly in Operations.

Advanced processing shares a small permanent site connection, plus owned
generators. A fixed site connection of 4 energy per 5 simulated seconds supports
one starter Lube line (3/5s). Building a generator adds supply; it never enables
a new tax on the existing gasoline line. No grid-power debt or purchase menu
in the first slice. This is a gameplay abstraction, not an engineering model.

Candidate values for testing (not validated balance):

| Source | Energy per 5s | Crude per full cycle | Energy capacity contribution |
| --- | ---: | ---: | ---: |
| Permanent site connection | 4 | 0 | 20 |
| Power Plant Lv1 | 12 | 1 | 60 |
| Power Plant Lv2 | 24 | 2 | 120 |
| Power Plant Lv3 | 42 | 3 | 210 |

- Candidate upgrade costs: $6,000 then $12,000; build cost remains $4,000.
- Lv1 own generator + connection = 16/5s; one Lube+Jet+Petro uses 12/5s.
  Add Polymer (6) and total becomes 18/5s: a visible reason to upgrade or
  prioritize. Lv2 supply = 28/5s. Two of each advanced line use 36/5s;
  one Lv3 + connection supplies 46/5s, leaving headroom.
- Distinguish **supply/min**, **active demand/min**, **installed maximum
  demand/min**, and **stored energy**. Never compare unlike time units.
- Stop/full/zero-priority lines request no inputs. Show intended and delivered
  output separately. A full battery need not make generators burn crude.
- Keep resource allocation deterministic and fair across product types,
  including Polymer; fixed update order must not silently prioritize it.
- First repair conservation with existing weights, then expose a simple
  `Balanced / Prioritize current job` policy. Not a wiring minigame.
- Acceptance: building the first generator never reduces otherwise identical
  gasoline output through a power gate; demolition never makes energy free;
  zero-power cases consume zero downstream inputs.

### 4.2 Storage upgrades, with an alternative to tank spam

Keep base product capacities and existing Lv1 bonuses initially. Sum each tank's
own level bonus; do not multiply every tank by the highest level owned.

| Building | Lv1 added storage | Lv2 added storage | Lv3 added storage |
| --- | ---: | ---: | ---: |
| Lubricant Tank | 75 | 190 | 375 |
| Jet Fuel Tank | 60 | 150 | 300 |
| Petrochemical Tank | 50 | 125 | 250 |
| Recycling Bunker | 100 | 250 | 500 |
| Pellet Silo | 40 | 100 | 200 |

Candidate upgrade price: Lv1→2 = max($750, 0.75 × building base price);
Lv2→3 = max($1,500, 1.5 × base price), round to whole dollars. One upgraded
Jet Tank now permits 500 total stock. Tank levels must affect actual production
caps, trade, storage display, and upgrade preview using the same table.

Audit core Crude/Gasoline Tanks too: a $30 build versus $5,000 upgrade for +25
storage is not a credible early choice when extra lots are available. Do not
retune only one side; compare dollars, lots, capacity, and recovery time together.

Storage still matters after staged contracts: larger tanks absorb production
between visits, handle bulk shipments, and let players wait for a better price.
It need not force the whole map to become tanks for a single contract.

### 4.3 Make staffing truthful, then meaningful

First restore and test the existing Jet/Petro/Polymer assignment routes from
both the Team screen and Plant Info. Label global-support employees as working
globally, not as idle/unassigned. Do not claim an early Operator is assignable
until its economic effect is implemented.

Next slice: extend actual local staffing, using existing employee roles:

| Role | Work placement | Effect scope |
| --- | --- | --- |
| Operator | Distillation, Lube; fallback on Jet/Petro/Polymer | Assigned line only |
| Aviation Specialist | Jet | Assigned line only, better fit than Operator |
| Chemical Engineer | Petrochemicals | Assigned line only |
| Polymer Engineer | Polymer | Assigned line only |
| Mechanic, Sales Agent, Safety Officer, Chemist, Logistics Coordinator, Fuel Specialist | Support team | Clearly labelled global effects; no fake tank assignment |

Plants can run without a worker; assignment improves them, it does not unlock
basic functionality. One person occupies at most one line; one lead per line.
Show transfer consequences before replacing somebody. A hire for an existing
vacancy must be available through a deterministic normal-cost recruitment path;
do not require repeated paid refreshes to get a necessary role.

Candidate local role bonus: Operator +15% effective output at level 1; retain
the existing specialist base rates initially. Scale by existing employee level
and traits. Preview `60 → 69 units/min when supplied`, plus actual constrained
rate, rather than showing an unconditional promise during a power shortage.

No double counting: converting Operator to local work removes its old global
production-stack contribution. Operational employees' output skills apply to
their assigned line, not every line; unassigned operational employees contribute
no role or skill bonuses. Assigned workers' remaining skill channels retain
explicitly labelled global support behavior, with documented caps. Support-role mechanics/storage behavior
is unchanged in the first staffing slice.

For shared gasoline production, weight each Distillation cell's own contribution;
do not multiply aggregate output by one assigned employee. Add this decomposition
before advertising per-cell gasoline benefits. Fractional output must accumulate
so small bonuses are not rounded away.

Preserve valid existing assignments. On migration, place old Operators into
eligible vacancies deterministically (level descending, then ID; targets in cell
order), put extras in Reserve, keep their levels/XP, and display a one-time
summary. Reserve operational staff cost 25% normal wage and provide no role or
skill effects; support staff remain at their established wage. Moving/swap/
demolition/saving must preserve or clean assignment references correctly.

**Retirement proposal:** disable forced retirement under the new campaign rules,
including after campaign clear; it must not automatically resume.
Keep staff identity and progression. Voluntary mentoring after campaign clear
is a later design, not a system to add now. Existing retired workers are not
invented or resurrected. The old five-year timer must not silently run in the
background after this change.

## 5. The smallest loop worth testing

### 5.1 One focused job, not a catalogue of obligations

Present three alternatives at most, selected from existing content:

- **Steady order:** reliable cash, comfortable amount, no short deadline.
- **Customer milestone:** a clear follow-up opportunity, moderate preparation.
- **Optional rush:** higher premium and a stated completion estimate; skippable.

Only one job is focused/accepted in the initial implementation. Keep the full
catalogue behind a secondary section. Distinguish locked preview, available,
accepted, ready, completed, and expired. Ordinary offers have no countdown.
For rush jobs, acceptance starts the delivery deadline; offer availability is
separate and missing an offer has no penalty.

Eligibility is not just refinery level: check production route, capacity or
staged-delivery support, prerequisite research, power availability, and a
conservative completion-time estimate. A difficult but feasible offer is fine;
an impossible one is not a recommended job.

### 5.2 Partial delivery is a business mechanic, not extra storage

Allow normal contracts to be fulfilled in shipments. Example: a 500-Jet job can
accept 100 now, then more later. Shipped goods leave inventory permanently and
count only toward that accepted job. At 500/500, issue the reward exactly once.

- Keep a per-job/per-product delivered ledger, never duplicated inventory.
- Auto-dispatch is opt-in; manual shipments remain possible. Auto-dispatch before
  auto-sell; protect in-stock focused-job quantities while filling the next load.
- Prototype first without intermediate payment: the full reward is received on
  completion. At acceptance, show estimated input cost and working-capital need.
- Always keep a small feasible steady offer for a cash-poor player; do not force
  acceptance of a large job that consumes all working capital.
- Cancellation has no new cash penalty, but already shipped goods are not returned.
  Confirm explicitly. Deadline failure behaves the same, with a clear receipt.
- Reload, repeated taps, cancellation, and multiple products cannot duplicate
  rewards, lose unrelated inventory, or leave reservations permanently locked.
- On completion remove the reservation before normal auto-selling resumes.
- Rush quantities/time budgets must pass an achievable-throughput test. Do not
  simply clamp every requirement to tank size: that rewards never upgrading.

Do not simultaneously rewrite all permanent rewards. Retune premiums only after
the production conservation and actual cost model have passed tests.

### 5.3 Three customers create continuity

One small new progression layer: `clientProgress`, built on existing contracts
and standing orders, not a second contract engine or another currency.

| Client archetype | Existing line | Trial → regular → partner example |
| --- | --- | --- |
| Local service stations | Gasoline | First delivery → repeat supply → steady-account relationship |
| Fleet maintenance company | Lubricants | Trial batch → repeat business → larger staged supply agreement |
| Regional airline | Jet Fuel | Qualification supply → reliable deliveries → flagship job |

Proposed exact MVP transitions:

- Trial: complete one authored client milestone job.
- Regular: complete a different follow-up job plus two standing orders for that
  client on distinct existing cooldown windows.
- Partner: complete one authored flagship job. No random approval chance.
- Each transition has an ID and idempotent claim. Existing completed-contract
  IDs can backfill matching authored steps once; absent standing-order history
  starts at zero. Do not make established players repeat already-proven trials.
- Partner reward in MVP: a reliable repeat offer with a visible price floor and
  predictable RP; no additional permanent global multiplier.
- Stockpiled goods may satisfy normal supply orders. If a challenge specifically
  requires new production, state that clearly and count only post-acceptance
  production. Do not secretly change the meaning of an inventory contract.

Prototype ONE client (Fleet/Lube) first. Add the other two only if the test shows
that players intentionally choose the next job instead of just tapping Ready.

### 5.4 A concrete player moment

At Lv10, two opportunities compete: a steady Lube customer and an airline job.
Jet has enough storage for shipments but shares constrained feedstock/power.
The player can postpone Jet, transfer an Operator to Jet, change job priority,
or invest in generation. Each option shows time-to-delivery and likely cash
impact. After delivery, a customer milestone opens a predictable follow-up.
The decision changes the next few minutes; it is not just a bigger number.

Illustrative minutes and profit must come from the current evaluator, not
hard-coded copy. Show `estimate unavailable: no crude supply` when appropriate.

## 6. Layout and equipment — deepen existing systems, later

Do not add a recipe tree yet. Make the current adjacency combos visible and
local before adding more. Preview the affected cells and before/after rates.
For example, a tank beside a processing unit should help that unit, not silently
buff every distant plant. Limit each pair bonus per target cell to avoid a
stacking exploit. Discovered combinations go in a small collection; discovering
one is a milestone, moving it does not repeatedly pay discovery rewards.

Only after the customer/staff slice is enjoyable, prototype ONE equipment choice
on Lube, unlocked at building Lv2. Mutually exclusive, visible and reversible:

- Throughput kit: target +20% throughput and +25% energy use.
- Economy kit: target −20% energy use and −10% throughput.

These are candidate multipliers, not calibrated constants. Raw-material input
tracks realized processing; do not add free yield accidentally. Hold one kit
choice per cell, not a new equipment inventory. No random drops, rarity system,
durability chores, or paid rerolls. Add other plant kits only after two distinct
strategies are viable. Reuse existing Green/Industrial specialization instead
of layering a second permanent specialization tree over it.

## 7. Progression and ending

The solution to a short uninteresting game is not an uninteresting 14-hour game.
Keep the 30-level cap initially, but shift campaign milestones from cash/lifetime
gasoline alone toward demonstrated operation, deliveries, and relationships.

Candidate pacing bands for legal 1× active-play tests; **hypotheses, not timers
or release promises**:

| Play time | Experience to test |
| --- | --- |
| First 3 min | Working starter line and first completed small delivery |
| First 10 min | One clear either/or investment and one useful assignment |
| 15–35 min | Lube loop and first readable power/capacity decision |
| 40–80 min | Jet introduction and meaningful competing jobs |
| 90–180 min | Advanced lines and factory specialization, not all-building obligation |
| 2–4 hours | Reach a satisfying first campaign clear; keep playing afterward |

Campaign MVP ending proposal: all three clients reach Partner, complete one
advanced-product flagship (Petro OR Polymer), and earn at least A in an operating
period. Do not require buying all research, every building, or the 6×6 extension.
Display these conditions early; preserve the earned clear as a sticky milestone.

Keep existing Industry Legend achievements as optional long-run challenges.
Do not silently mark old goals complete or wipe an old prestige history. Later
expose New Game+ at campaign clear, once migration and its rewards are specified;
until then the existing prestige trigger stays unchanged. Never ship a button
whose underlying eligibility still requires the hidden 120-million-cash goal.

For awards/rivals, retain the existing system first. If scores depend on previous
player performance, reveal the target at period start and freeze it for that
period. A rival must not secretly move the finish line when the player improves.
The current 12-minute business period need not be called a literal year while
the separate calendar says only two days have passed. Relabel later, without
changing simulation clocks and retirement in the same patch.

## 8. Balance process and acceptance measures

### Correctness before target times

Replace copied-action simulator shortcuts with the same pure validated actions
called by the app, one action family at a time. Include normal eligibility,
money, slots, hire year, retirement policy, assignment and automation unlocks.
The current simulator is a useful throughput stress test, not proof of fun.

Run seeded policies: cautious/buffer-first, throughput-first, job-focused, and
automation-only control. Sample fresh games and constructed Lv5/Lv10/Lv20
fixtures. Mark fixtures explicitly; they are not evidence of reaching that level.

### Economic ledger

Compute realized operating margin from sale/delivery income minus paid crude,
power fuel, payroll and maintenance accrual. Track one-time unlock/milestone
grants separately. Allocate joint Distillation costs consistently; do not count
the same crude as a full cost of both gasoline and feedstock. Calculate upgrade
ROI against its actual counterfactual bottleneck, not theoretical gross output.

Draft guardrails:

- At least two useful affordable choices at each tested investment gate.
- Ordinary contracts target roughly 15–30% premium over an equivalent feasible
  spot-sale plan; optional rush 30–50%. Freeze the quote at acceptance. Client
  access/RP can justify less cash; show that tradeoff. Include displaced sales
  and time, not only the base price constant.
- First-hour discretionary upgrades repay in roughly 3–8 minutes of use under
  a suitable load; utility/storage upgrades use enabled net earnings or buffer
  minutes, not a fake direct-output ROI.
- Fresh player should see a useful action/payoff every 1–3 minutes; more clicks
  alone do not count. No unavoidable tutorial wait longer than ~45 seconds.
- Target at least three *different* decisions in a 15-minute observed session
  (job selection, assignment, investment/layout). Repeated sell/claim taps do
  not count as strategic decisions.
- A sound automated factory may run profitably unattended. An active player
  should gain customer progress/options, not merely avoid punishment.
- No sampled policy should dominate cash, relationships, and resilience at once.
  Do not force artificial equality: present measured tradeoffs across seeds.
- All resource pools/carry are finite and nonnegative after every tick/action;
  capacities obey documented overflow policy. Test every catalogued job for a
  feasible route by its advertised unlock, or label it as a future preview.
- Three-minute gameplay interruptions, closing/reopening, speed changes, and
  pauses preserve deliveries and employee assignments without wall-clock decay.

Do not preserve the existing minimum 10–18-hour regression thresholds as sacred.
When the pacing model is intentionally changed, replace them with approved
behavior gates and recorded benchmark bands, explaining why. Never weaken a
failing conservation/eligibility test just to make CI green.

### Human gates the simulator cannot replace

Fresh 15-minute device run + 20-minute Lv10 fixture with visible controls:

1. Can the player explain the current bottleneck and solve it without chat help?
2. Does the player choose between offers, or only tap whichever is ready?
3. Can they name a worker and explain why that person is on that line?
4. Does an upgrade show the expected before/after effect in actual operation?
5. After one delivery, is there a concrete next thing they want to attempt?

If these fail, change the slice; do not proceed to more products or art.

## 9. Delivery roadmap

| Release slice | Work | Gate to proceed |
| --- | --- | --- |
| R1 — Trustworthy factory | Reproduction tests; resource transactions; explicit power; generator/tank upgrades; truthful existing assignment UI | Every reported blocker explained/resolved, new invariants pass, device test passes |
| R2 — One enjoyable business loop | Local Operators, no forced campaign retirement, focused jobs, staged delivery, ONE Lube client | A 20-minute test has choices and a reason to pursue the next delivery |
| R3 — Identity | Remaining two clients; local combo previews; one optional Lube kit experiment | At least two viable factory plans with intelligible tradeoffs |
| R4 — Cohesive campaign | Legal-policy balance sweep; campaign ending vs optional Legend; award target visibility | Fresh/established saves, 25-lot campaign route, onboarding and midgame human gates |

Each slice is multiple small commits; build only a coherent tested slice when
authorized. Do not implement all rows in a single run. Pause between slices for
device feedback. All artwork, soundtrack, multiplayer, new products, complex
logistics, a new engine, and monetization remain outside this roadmap.

## 10. Handoff truth

No gameplay change was made during this audit. No new APK was requested or built.
The numbers above are proposed candidates. Diagnostic probes expose defects;
they do not validate the proposed fixes. The next execution task is **G0**, then
R1's tasks in order, after the user authorizes implementation.
