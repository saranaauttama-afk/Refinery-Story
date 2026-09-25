# Gameplay V3 — Rules, data and engineering specification

2026-09-25 · R0 and V3-03 through V3-09 are implemented. **Decision update:** V3 is a fresh
game/save only. Old saves, contracts, prestige and inventories are not migrated.
Any migration/legacy-adapter wording left in historical notes is superseded.
Authority: [GAMEPLAY_MASTER_PLAN_V3.md](GAMEPLAY_MASTER_PLAN_V3.md).
Execution: [GAMEPLAY_IMPLEMENTATION_V3.md](GAMEPLAY_IMPLEMENTATION_V3.md).
All numeric values below are **candidate dataset V3-A**, not calibrated promises.
This is an abstract game economy, not a real refinery model.

## S1. Architectural limits and authoritative state

Keep the current Expo project and 200ms simulation tick. Extract shared pure
actions from `useGameLoop.ts` incrementally; do not rewrite the renderer or app.
App actions and legal simulation call the same validators/reducers. Side effects
(toasts, audio, navigation) consume returned events; they do not calculate money.

Proposed new modules under `src/game/` (names can match conventions; responsibilities
must remain recognizable): `data/productDesigns.ts`, `data/clients.ts`,
`data/campaign.ts`, `utils/productDevelopment.ts`, `utils/productInventory.ts`,
`utils/productionPlan.ts`, `utils/jobActions.ts`, `utils/campaignActions.ts`.
Use plain functions/typed data, not a generic workflow engine or entity framework.

### Saved state additions (conceptual schema, not drop-in code)

| Field | Required content / invariant |
| --- | --- |
| `rulesetVersion` | Final V3 saves use 3; reject newer unsupported versions safely |
| `productBlueprints` | Immutable revisions keyed by signature; default/developed provenance distinguished |
| `variantInventory` | Blueprint ID → quantity + total cost basis + estimated-basis flag |
| `materialCostBasis` | Crude/feedstock/waste costs matching their scalar quantities |
| `plantPrograms` | cell → blueprint ID, installed module, setup remaining ticks, pause flag |
| `developmentProject` | null or project ID, immutable spec/lead snapshot, lab cell, time remaining, debits receipt |
| `developmentHistory` | Completed signatures and credited contributors; bounded by configuration space |
| `employeeDuties` | employee ID → line(cell), development(project), support, reserve |
| `clientProgress` | per-client last completed milestone and repeat available tick |
| `acceptedJob` | null or locked quote/spec/quantity, delivered ledger, paid-to-date, deadline, status |
| `jobReceipts` | monotonic completed/cancelled/expired IDs, template retry ticks and payout receipts; compact completed history |
| `stockPolicies` | explicit keep quantity per blueprint; auto trade/auto-dispatch settings |
| `campaignProgress` | chapter, one-time flags, showcase receipt, clear tick, inherited capability flags |
| `operatingLedger` | bounded cash/COGS buckets for rolling60/180s, separate capex/grants; lifetime summaries |
| `recoveryState` | nullable fixed rescue job; nontransferable loaner-cell IDs if needed |
| `nextActionSequence` | deterministic unique project/job/receipt identifiers; never Date.now as gameplay RNG |

V3 state is authoritative and does not embed the old `GameState`. Do not add
compatibility mirrors or a second writable inventory/workforce system. The old
engine remains only as a temporary separate path while V3 is unfinished.

Cell indices remain current world slot IDs. Moving/swapping/expanding remaps
programs, modules, duties, work carry and active project lab reference together.
Do not introduce a second coordinate system just for V3.

### Quantity and money precision

Resource/work quantities are finite fractional numbers internally. Do not floor
each tick independently. Calculate one actual work fraction, debit/credit all
recipe components from that fraction, preserve fractional quantities in saves.
Use epsilon1e-8 for zero comparisons; conservation tolerances1e-6 in long tests.
Never epsilon-clamp a material deficit larger than tolerance. Display rounding
is presentation only. Manual shipments specify whole units ≤floor(free quantity).

Cash transactions use integer cents; accrued production cost basis may use
fractional cents until settlement. Cumulative shipment payout uses cumulative
rounding (S6), not rounding each tap separately. Document currency conversion at
the boundary with existing dollar-valued fields; do not multiply money twice.

## S2. Blueprint identity, quality and manufacturing requirements

Five developable families: gasoline, lubricants, jetFuel, petrochemicals,
plasticPellets. Asphalt/recycledMaterial are commodity inventory entries with
Q0, cannot satisfy a quality requirement and do not enter development projects.

Every family has a permanent Standard default Q40, module none, min plant Lv1.
Its availability still requires the family's production capability. Fresh V3
starts with no inherited stock.

### Process profile table

Multipliers are per operation; rate changes operations/time, not free yield.

| Profile | ΔQ | Work-rate multiplier | Main input per operation | Energy per operation |
| --- | ---: | ---: | ---: | ---: |
| Volume | −5 | 1.25 | 1.10 | 1.10 |
| Standard | 0 | 1.00 | 1.00 | 1.00 |
| Precision | +15 | 0.80 | 1.10 | 1.25 |

### Module table (none available immediately; other modules at C2, plant Lv2)

| Module | ΔQ | Work-rate multiplier | Input multiplier | Energy multiplier | One-time fit cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| None | 0 | 1.00 | 1.00 | 1.00 | 0 |
| Throughput | −5 | 1.15 | 1.00 | 1.15 | 20% of plant base build cost |
| Economy | 0 | 0.90 | 0.90 | 0.75 | 20% of base |
| Precision | +10 | 0.90 | 1.00 | 1.10 | 20% of base |

Installed module is a single cell property, not loot/inventory. Replacing removes
the old module with no cash refund; returning to none is free. Preview costs.
Repeated switching cannot issue money or rewards. An identical module is a no-op.
Fit module before selecting a requiring blueprint; mismatch rejects commissioning,
not silent Q reduction. Module switching validates replacement program or pauses
the line until a compatible program is chosen. A running development project
uses the proposed module in a lab; it does not require purchasing it on a line.

Knowledge rank0/1/2 contributes Q0/5/10. Rank1 requires LabLv2 + `premiumFuel`;
rank2 requires LabLv3 + `advancedProcessing`; rank2 includes rank1 prerequisites.
An active suitable lead contributes Q5 if a matched specialist/Chemist, or any
OperatorLv≥3. Otherwise Q0. No additive multi-person lead bonus.

`Q = clamp(40 + profileDelta + moduleDelta + 5*knowledgeRank + leadContribution, 20, 80)`.
All reachable Q values are multiples of5. No RNG. Q stays fixed for that revision.
Min production plant level is2 when module is not none, else1. Lab level and lead
are development prerequisites; already-certified recipes do not stop when that
lead moves elsewhere or a lab is removed after project completion.

Configuration signature is `(family, profile, module, knowledgeRank, leadContribution)`.
At most 3×4×3×2 =72 configurations/family. Same signature cannot farm projects/XP.
Display ≤6 pinned recipes/family; archive is a UI filter, never deletes inventory,
job references or signatures. Names are cosmetic and cannot change signature.

### Development transaction

Start validates chapter/family route, idle lab with sufficient level, fee, 10 free
sample units of that family, one eligible free/transferable lead, no other project.
Select samples lowest Q then blueprint ID, respecting keep/reservations; manual
override requires explicit player selection. Debit samples+fee atomically.
Snapshot Q calculation and lead identity at start. Project time:20/25/30/35/40s
for Gas/Lube/Jet/Petro/Pellet. Fees:$50/100/200/300/400. All samples/fees are R&D
expense, not manufacturing COGS. Lab upkeep continues normally.

Development lead cannot also run a line/support. Prior duty is stored for return;
restore it if still valid/vacant, otherwise Reserve with a notice. At completion
the report is ready automatically (no production stall waiting for a Claim tap),
but blueprint is commissioned only via explicit line selection. Acknowledging a
report gives no second reward. Cancel consumes spent samples/fee, releases duties,
retains no certified result and gives no XP. Pause/resume/speed act in simulation
ticks; app background never advances. Lab/cell mutation checks project ownership.

Prototype-first project XP:20 to its lead on first signature completion. No other
project reward. Existing productive-duty XP rate is retained initially, credited
only for actual active duty; training retains current legal action/cost. Calibrate
thresholds in V3-18; do not randomize required staff quality access.

### Quality reachability examples

- C1 Precision/no module/rank0/no lead → Q55: first premium trial is possible.
- C2 Precision/Precision module/rank0/no lead → Q65: two Regular clients possible.
- C3 Jet Precision/Precision/rank1/matched lead → Q75: Airline Partner possible.
- C4 same with rank2/no lead → Q75: specialists accelerate, are not mandatory.
- Best possible Q80 is not a campaign requirement; no authored job asks above75.

## S3. Proposed production and infrastructure dataset V3-A

Replace legacy per-tick speed math for V3 lines explicitly. Do not layer these
recipes on top of old global production multipliers. Until a family is ported,
keep it unavailable in a V3 preview save; never release a mixed accounting path.

All cycles below are5 simulation seconds (25ticks). Formula evaluation is per cell.

| Unit | Base inputs/cycle | Outputs/cycle | Advanced energy/cycle |
| --- | --- | --- | ---: |
| Distillation | crude6 | gasoline5 + feedstock3 | 0, permanent built-in utility |
| Lube | feedstock6 | lube5 | 3 |
| Jet | feedstock8 | jet5 | 4 |
| Petrochemical | feedstock10 | petro5 | 5 |
| Polymer | unreserved petro6, any Q | pellets5 | 6 |
| Waste Treatment | waste4 | recycled2 | 1 |

Distillation co-product feedstock is Qless. Its recipe profile affects cycle rate
and crude input for the whole operation; only gasoline receives blueprint Q.
Polymer does not inherit the input Petro Q; processing makes a different abstract
product. Reserve/keep rules prevent accidental feeding of valuable Petro stock.
Asphalt manual conversion remains a side action, proposed crude10→asphalt10,
cost/input validated through the same action layer. No per-click reward beyond
goods. Avoid input laundering through unsupported legacy shortcuts.

Output-space policy: main product space limits operation. For Distillation,
newly-created surplus feedstock can be discarded, explicitly shown in Operations;
it does not block gasoline. Existing feedstock is never deleted. COGS allocation
assigns discarded co-product value to retained output, so it cannot hide costs.
Downstream waste is a zero-value byproduct: Distill0.5 and advanced1 unit/operation;
WasteTreatment handles it. Waste cap200; over-cap remains visible, cannot grow
without bound: newly generated excess is a recorded disposal statistic. No
automatic money/production penalties in V3; no silent destruction of paid inputs.

### Rate/input evaluation

```
requestedWork = deltaTicks/25 * levelRate * profileRate * moduleRate
              * (1 + localCrewRate) * (1 + cappedGlobalRate)
              * specializationRate * localAdjacencyRate * boostRate
mainInputPerWork = baseInput * profileInput * moduleInput
energyPerWork = baseEnergy * profileEnergy * moduleEnergy * specializationEnergy
outputPerWork = baseOutput  // no hidden second yield multiplier
```

Level rates Lv1/2/3:1/1.4/1.9. Actual work is bounded by supplied resources,
space and allocation. Debit input/energy only for actual work and create outputs
from exactly that work. Rounding must never debit full demand on partial output.
No work is queued indefinitely while blocked; do not burst all missed production
on restock. Only fractional arithmetic, not elapsed blocked time, is carried.

### Shared resource allocation

Compute all eligible per-cell requests before consuming inputs. Balanced gives
each active line weight1; Focus gives lines directly producing accepted-job goods
weight2 and all others1. Paused/setup/priority0/full main-output requests are0.
Use progressive weighted allocation of work fractions across shared resources;
after a line caps, redistribute remaining resource. Deterministic tie order by
cell ID. At equal configuration, equal-weight lines receive equal work within
tolerance; fixed type order must not starve Polymer or Jet. Stock reserved for
jobs/keep is excluded before Polymer's resource request. No same-tick output can
be consumed by a downstream line unless explicitly stage-ordered in the planner;
V3-A uses opening stock only for all processing, yielding one tick pipeline delay.

Utilities execute before line allocation. First compute crude requested by all
active Distillation cells for this tick, including level/profile/module/crew and
main-output space; reserve that quantity up to opening crude. Generator fuel uses
only the remainder. Show `crude reserved for active distillation`. This prevents
generator addition from stealing even an upgraded line's due input, not merely
protecting a hard-coded6 units. Actual power remains limited by surplus crude.

| Utility | Energy/5s | Crude/full cycle | Battery contribution |
| --- | ---: | ---: | ---: |
| Permanent site supply | 4 | 0 | 20 |
| Generator Lv1 | 12 | 1 | 60 |
| Generator Lv2 | 24 | 2 | 120 |
| Generator Lv3 | 42 | 3 | 210 |

Site supply first, generators then fill remaining capacity proportionately to
their potential supply, using fractional fuel. Full battery=zero fuel debit.
Requested/max/actual energy per minute are separate; output UI includes the
effects of profiles, levels, modules and staff rather than fixed3/4/5 labels.

### Build/upgrade costs and maintenance

| Building | Build | Lv1→2 | Lv2→3 | Unlock/capability |
| --- | ---: | ---: | ---: | --- |
| Crude Tank / Gasoline Tank | 150 | 250 | 600 | C0; added storage50/125/300 |
| Distillation | 1,800 | 2,000 | 5,000 | C0; levels2 atC2,3 atC3 |
| Laboratory | 400 | 1,800 | 5,000 | C1; upgradesC2/C4 |
| Maintenance Workshop | 1,500 | 1,500 | 3,000 | C2; penalty/upkeep support, capped |
| Sales Office | 2,000 | 2,000 | 4,000 | C3; quote bonus5/8/10%, shared trade cap |
| Lube Plant | 5,000 | 4,000 | 9,000 | C2 |
| Jet Plant | 12,000 | 10,000 | 20,000 | C3 |
| Petrochemical Plant | 18,000 | 14,000 | 26,000 | C4 |
| Polymer Plant | 24,000 | 18,000 | 32,000 | C4; needs Petro route |
| Power Plant | 4,000 | 6,000 | 12,000 | C2; upgrade2 atC2,3 atC3 |
| Waste Treatment | 2,000 | 2,000 | 4,000 | C2; rate1/1.4/1.9 |

Tank/support levels2 atC2 and3 atC3 except Lab3 atC4. No “max level” on a type
without a data definition. One central building capability table drives both UI
and action. Multiple labs support placement but still only one active project;
rank uses the selected lab, not sum of labs. Sales/workshop global effects use
the highest one, never repeated stack. Workshops global upkeep cut5/8/10% plus
local adjacency10%, all upkeep cuts combined capped25%.

| Advanced storage | Build | Added storage Lv1/2/3 |
| --- | ---: | --- |
| Lube Tank | 750 | 75 / 190 / 375 |
| Jet Tank | 1,500 | 60 / 150 / 300 |
| Petro Tank | 2,000 | 50 / 125 / 250 |
| Recycling Bunker | 1,000 | 100 / 250 / 500 |
| Pellet Silo | 3,000 | 40 / 100 / 200 |

Advanced tank upgrade costs `max(750,0.75*build)` and `max(1500,1.5*build)`.
Base capacities: crude10,gas20; Lube/Jet/Petro/Pellets200 each; recycled150;
asphalt150; feedstock40 +60 per Distillation cell (any level).
Family cap=sum of physical contributions + applicable research/support bonuses.
Clamp free space to0; keep already-owned overflow on demolition.

4×4 costs6,000 atC2; 5×5 costs25,000 atC4; optional6×6 costs100,000 after clear.
Existing bought expansion retained. Roads do not use plant slots. Example compact
full-chain layout: Distill3, core tanks2, lab1, generator1, Lube/Jet/Petro/Polymer4,
advanced tanks4, workshop1,sales1,waste1 =18 lots. This is a spatial budget, not
proof of balanced throughput. Production/finance simulation must prove a legal
campaign route within25; no requirement to own all these buildings.

Maintenance expense/5s=`0.002 * baseBuildCost /12`, multiplied by levelRate for
processing units, level1/1.25/1.5 for support/storage. Crew upkeep cuts apply after.
Paused manufacturing has50% maintenance. No interest or negative-money debt.
If a recurring debit cannot be paid, accrue no debt: affected optional line/team
enters standby with visible reason; starter Distillation/core tanks have zero
maintenance until C2. After C2 an explicit Emergency operation remains available:
lowest-index owned Distillation (or recovery loaner) plus one core tank of each
kind have maintenance waived while cash cannot fund one starter cycle. That line
runs only the default Standard at Lv1 baseline without crew/module/bonus effects;
other lines are paused. Show this temporary override, retain the saved program,
and restore normal operation only on player confirmation when affordable. Never
disable the sole recovery-producing line because it cannot prepay maintenance.
Do not silently suppress a cost while leaving its benefit active.

## S4. Employees, support and research

`employeeDuties` is authoritative. Old `assignments` mirrors line duties only.
One duty/person and one lead/line/project. Moves/swaps transfer whole line state.
Unstaffed production=baseline, not0. Switching a person never duplicates effects.

Local crew rate: Operator `min(0.20,0.10+0.02*(level-1))`; matched Fuel/Specialist
`min(0.25,0.15+0.02*(level-1))`. Add that employee's output skills, then cap total
local crew rate at0.30. No global Operator rate remains. Throughput raises work
and inputs together; it is not free output. Duties in development give no line
rate. Other role effects from old code must not leak out of inactive duties.

Support effects: Mechanics flat storage benefit capped at effective3 staff;
Sales/trade across staff+office+research+perks capped15%; global support safety
capped20%; all upkeep reductions capped25%; global storage percentage capped50%.
Use existing individual role coefficients unless overridden here; display caps
and effective contribution. Only Support duty supplies global role/skill bonuses.
Line duty output/upkeep skills are local; other skill channels inactive and
labelled so. Project duties use lead qualification, not random skill stacking.
Keep inactive skill records for future reassignment; no automatic rerolls.

Proposed wage$/min: Operator4, Mechanic6, Sales8, Safety6, Chemist8, Logistics8,
Fuel10, Aviation12, Chemical16, Polymer18; scale `1+0.1*(level-1)` capped2×.
Reserve costs25%, contributes no effects/XP. Charge proportionally every5s.
If wages unaffordable, put unpaid duty in unpaid standby with no effects/XP,
no debt; allow explicit resume once funded. Reserve wage never drives cash below0.
First Operator is a named starting employee, not a repeatedly claimable hire grant.
No forced retirement at any later chapter or after clear.

For accomplishment credit, an accepted job records actual eligible production
contributed by each employee while that job is active. On successful completion,
credit `helped production during this job` only to contributors with positive work,
not every current assignee or the person attached at the last tap. This is not a
claim that a merged inventory unit came from that employee. Award5 XP per credited
person for a first milestone completion, none for repeats/cancelled jobs; record
the milestone ID so replay cannot pay twice. R&D attribution uses project snapshot.

Direct-hire unlocks/base costs: Operator C0/$500; Mechanic C1/$800; Chemist C1/$1,500;
Safety C2/$1,200; Logistics C2/$2,000; Fuel C2/$1,500; Sales C3/$1,000;
Aviation C3/$3,000; Chemical C4/$5,000; Polymer C4/$8,000. Recruitment cards can
retain existing skill variety, but a guaranteed ordinary role candidate must be
available at this base cost. Do not gate a required role behind a random refresh.
Inherited role ownership/use survives chapter locks. Staff cap stays current;
hire/unlock validation uses these chapter rules for new V3 hires.

### Research IDs and V3 candidate prices

| Existing ID | RP | V3 effect / prerequisites |
| --- | ---: | --- |
| betterPumps | 10 | global work-rate+5%, C1 |
| biggerTanks | 15 | core crude/gas capacity+20 each, C1 |
| premiumFuel | 20 | knowledge rank1 capability, C2+Lab2 |
| advancedDistillation | 40 | global work-rate+10%, betterPumps+C2 |
| industrialStorage | 40 | physical storage+15%, biggerTanks+C2 |
| premiumContracts | 40 | quote+5%, premiumFuel+C3, shared trade cap |
| advancedProcessing | 60 | knowledge rank2, premiumFuel+C4+Lab3 |
| storageOptimization | 60 | physical storage+25%, industrialStorage+C4 |
| contractAnalytics | 40 | completion RP+20%, premiumContracts+C3 |
| saferOperations | 20 | upkeep−10%, C2 |

RP pricing/research descriptions change together. Owned IDs stay owned, no repurchase;
new capabilities still check appropriate lab for new development. No retroactive Q.
Existing efficiency perks map to work-rate+3%/rank, storage perks to+5%/rank,
quality perks to trade+3%/rank. Fold prestige modifiers into the same capped
channels: global rate≤20%, global storage≤50%, global trade≤15%, upkeep≤25%.
No additive hidden old-path bonus after mapping. Preserve prestige/achievement
history, show total effective modifier and cap. Existing perk costs/unlocks remain
until dedicated calibration; none required for campaign completion.

Specialization optional atC3: Green rate0.95, advanced energy0.90, waste0.80;
Industrial rate1.10, energy1.20. Existing choice preserved; no extra identity tree.
New games see tradeoffs before committing. Neither path is required to clear.

## S5. Inventory, costing and cashflow

Inventory entry is `(blueprintId, quantity, totalCostBasis, estimatedBasis)`.
Same revision merges quantities/costs. Different Q/revisions never blend or
upgrade by averaging. Capacity is sum of quantities across family, not per entry.
Sale/shipment/sample/Polymer consumes proportional weighted-average cost basis
from chosen entries. Default selection is lowest adequate Q, then blueprint ID.
Keep cost origin accounting through each conversion so costs are not double spent.

Crude purchases increase crude quantity+basis with actual quote paid. Generator
fuel moves crude basis to utility cost, never a second purchase cash debit.
Production transfers raw cost plus allocated energy cost into manufactured goods.
Site energy has zero purchased fuel basis. Store battery cost basis; consume it
proportionally. Exclude utility COGS from maintenance expense to avoid double count.
Labor/maintenance are operating expenses as incurred (not also stock COGS).
R&D debits are development expense, separate from operating factory margin.

Distillation input cost split by **fixed reference output values**, never current
contract prices: Gas18/unit and feedstock8/unit. For full base cycle, weights90:24.
If co-product discarded, allocate all cost among actually retained outputs.
Waste reference value0; treatment still has electricity/maintenance cost.
Polymer input uses actual Petro stock basis, not both market price and actual
cost. Margin preview additionally shows Petro sale opportunity cost separately.

Cashflow=actual money receipts−cash outflows. Operating profit=recognized
manufactured COGS margin−wages−maintenance; exclude capex, R&D, gifts, demolition,
gifts and stock with uncertain basis from the clear gate.
UI labels estimated costs where history is unavailable; do not show them as audited.
One rolling ledger with1-second buckets retains180s; cumulative counters for
campaign/report. Pause adds no time buckets. At least180s of V3 operation required
to evaluate clear profitability; this is an observation window, not a repeat grind.

### Trading candidate base prices

| Item | Buy / reference | Spot sell |
| --- | ---: | ---: |
| Crude | 10 buy | Not a player resale product |
| Gasoline | 18 reference | 18 |
| Feedstock | 8 valuation only | No spot trading |
| Lube | 30 reference | 30 |
| Jet | 50 reference | 50 |
| Petro | 65 reference | 65 |
| Pellets | 120 reference | 120 |
| Asphalt | 12 reference | 12 |
| Recycled | 12 reference | 12 |

V3 campaign uses fixed base prices. Disable legacy market saturation/irreversible
era demand drift in this ruleset. Trade bonuses are capped, visible and snapshotted
for jobs. Spot has no extra Q multiplier, including Q80. Prototype has no bargain
buy/sell cycle, price speculation or dynamic market events.

Stock protection precedence: manual keep floors first, accepted-job reservation
next, processing inputs next, auto-sell last. Allocate jobs only against Q-eligible
free units; reserve at most remaining requirement. UI distinguishes keep vs job
reserve. Manual ship/sell can explicitly override keep after confirmation; cannot
silently override a job reservation. Cancel the job or choose surplus instead.
Polymer must respect both protections. At dispatch, release shipped reservation
and re-evaluate; no saved second stock pool representing reserved goods.

Auto-buy minimum cash buffer=wages+maintenance for5s + two starter crude cycles
(12 crude at current quote). If money below buffer, buy only minimum startup
crude that is affordable; do not reserve all money and deadlock. Advanced supply
cannot spend the last startup batch. Defaults visible/changeable after tutorial.

## S6. Jobs, customers and progression transactions

Master plan's15 milestone rows are the complete client content contract.
Tutorial: gas20, Q0, unit quote18, completion+$200/+10RP; no development requirement.
The one-time bonus leaves a small working-capital buffer for Lab1, first research,
and the next crude batch instead of forcing an immediate spot-sale loop.
Only tutorial counts asC0 clear. Client milestones issue RP5/10/15 for Trial/
Regular/Partner plus reputation5/10/20. Each receipt pays once. Repeats have no RP
or reputation; they are income, not unlimited research farming.

Quote multiplier by required Q: Q0–35→1.10, Q40–50→1.20, Q55–60→1.50,
Q65–70→1.70, Q75→1.90. All multiplied by base product spot price and locked
current trade bonus capped15%. Milestone completion bonus10% of quoted whole
order; repeat bonus0; Rush uses repeat unit quote and completion bonus25%.
Showcase Q65 uses milestone bonus10%, no client rank change, RP15 once.
The tutorial's explicit quote overrides this table.

Quote accepted once; stock surplus quality earns no extra. For a job's line:
`targetPaidCents = round(deliveredQty * lockedUnitPriceCents)`.
Each shipment pays `targetPaidCents - alreadyPaidCents`; never a negative delta.
On full completion separately settle bonus+RP+rank one time in the SAME reducer
transaction. Duplicate sequence/taps return existing receipt, not money.
No deposit. Partial delivery pays fairly for goods and costs, so working capital
does not require financing the entire order. Cancellation keeps all already-paid
goods sold and loses only unearned completion bonus; never returns shipped goods.

Auto-dispatch opt-in threshold=`min(remaining, max(1,floor(familyCap*0.25)))`.
Dispatch when eligible unkept stock reaches threshold or whole remainder is ready.
Manual can send any positive whole quantity. Re-evaluate after inventory/cap
changes. Lowering threshold does not alter price or earn RP early.

Milestone jobs never expire. Repeat cooldown starts on acceptance and is120s
simulation; cancellation does not reset it early. Rush follows Master deadline
rule; expiry occurs after dispatch processing for its last valid tick. State
machine: offered→accepted→completed/cancelled/expired. Only accepted occupies slot.
Auto-repeat requiresC3 and keeps one slot; no auto-accept milestones/rush.

Cancelled/expired templates, including milestones and repeat/rush jobs, cannot be
reaccepted before120s after their previous acceptance. Save this by template ID;
a newly generated job instance ID cannot bypass it. Finishing a milestone may
open its distinct next milestone immediately. This prevents repeatedly taking
premium part-payments then cancelling to bypass the intended order cadence.

Offer feasibility checks route, attainable Q at current chapter, retained assets,
min module/plant capabilities, raw supply and conservative working capital.
Missing upgrades may yield a visible planned preview, never an active recommendation
described as ready. Quantity may exceed tank cap because staged delivery exists.
ETA uses shared evaluator, excludes boost and assumes ordinary affordable input;
return `unavailable` with reason if no supply/positive throughput. Recompute before
acceptance, then show live ETA separately from locked contractual terms.

Old contracts, standing orders and rotating offers are not imported. V3 uses only
the authored client milestones, repeats and Rush jobs defined by this plan.

### Chapter, award and ending state

Master's C0–C5 predicates are evaluated after each relevant transaction. Chapter
never decreases; rewards/unlocks have keyed receipts. Chapter is the sole V3
capability gate; there is no inherited company-level progression.

Showcase variants require provenance `developed` and Q≥65. Any qualifying family
amount from Master accepted. Clear flags require3 Partners/2 families/advanced
client/Showcase/positive180s operating profit; no artificial all-research gate.
Save once with completion, emit report event once; rendering report has no payout.

Awards every3,600ticks. At period start snapshot active unlocked-family count F,
set Dtarget=clamp(60*F,60,300) qualified units and Vtarget=min(F,3) distinct families.
At period end: profitScore30 if recognized operating profit>0 else0;
deliveryScore40*min(qualifiedUnits/Dtarget,1);
varietyScore30*min(qualifiedFamilies/Vtarget,1). Grades B≥50/A≥70/S≥90.
Snapshot remains frozen. Grade RP pays only increase above highest prior run award
(B5/A10/S15 cumulative cap15); no recurring free money or low-grade penalty.
Qualifying deliveries require accepted-job Q eligibility; ordinary spot not counted.

## S7. Recovery, startup and fresh-save policy

Fresh setup: 3×3 slots, prebuilt Crude Tank/Gas Tank/DistillationLv1, money600,
crude18, Standard gas Q40 program, named OperatorLv1 assigned, no advanced input,
no free repeating grants. Existing new-game tutorial must not place the same
buildings again. C1 auto-trade is opt-in via tutorial confirmation, not enabled
behind the player's back. All rules/inventory/actions installed before enabling it.

Recovery tolling: available only when cash <6*crudeQuote and no unkept/unreserved
saleable goods cover deficit. Job runs20s with virtual customer-owned supply/output,
pays exactly max(0,6*crudeQuote-currentCash) at completion, quote frozen at start.
No RP/client XP/production stats; subtract already-earned cash during job from
needed rescue payment at settlement, so parallel sale cannot duplicate aid.
One rescue at a time, cannot sell/swap its supplied goods. Reservations can be
cancelled instead, clearly explained. While recovery runs, operating debits pause.

Loaner eligibility is separate from the tolling cash threshold: if the starter
production route is missing and current cash cannot restore it through normal
legal builds, offer only the missing members of a loaner starter trio on vacant
slots. Thus demolishing a line and retaining more than$60 cannot strand a save.
If necessary the player clears up to3 slots through normal
demolition at0 fee; show refund and affected stock/staff before confirming.
Do not silently rearrange the map or create an off-map building warehouse.
Loaner Distillation runs Standard Q40 at50% Lv1 rate without modules/staff bonuses;
it cannot manufacture developed variants. Replace it with a normally bought plant
to recover full capability. Loaners cannot be sold for cash, upgraded for resale, counted for discovery
rewards, or satisfy non-starter build milestones. Loaners keep zero refund
permanently. Keep their provenance through save/move/swap. Normal demolition
proceeds can end insolvency before tolling starts. Recovery status is evaluated
again after each action, so the player cannot collect aid for an obsolete deficit.

### Persistence and reset

V3 reads and writes only its own versioned save. A missing save creates the exact
fresh setup above. Corrupt or newer schemas stop with an honest error and require
an explicit fresh start; they are never silently overwritten during load. Reset
clears every V3 run field and creates the same deterministic initial state. There
is no import, conversion, backup or restore path for the old game.

## S8. Tick/action ordering and UI contract

One authoritative step:
1. Validate ruleset, advance simulation tick if unpaused; settle scheduled debits
   and duty standby, then project/setup timers.
2. Derive keep/job reservations from opening stock and locked job requirements.
3. Fill site/generator battery from opening inputs respecting startup reserve.
4. Plan all manufacturing work from opening stock/battery; commit atomically;
   record cost and worker contribution. Products from step4 are available next
   manufacturing tick, but may be dispatched/traded this tick.
5. Auto-dispatch accepted job, settle cumulative payouts and completion.
6. Auto-sell free surplus; auto-buy affordable inputs, respecting buffer.
7. Evaluate client/chapter/clear/award once; enqueue optional inbox event if allowed.
8. Update bounded metrics; save on durable actions and
   existing cadence. UI reads same evaluators; it must not predict different Q/rate.

Manual actions run through the same atomic transition with a sequence ID. Do not
allow React stale closure state to process the same goods twice. Multiple sheets
use a modal pause-owner set, so dismissing one cannot resume while another still
owns pause. Restore previous user-selected speed, not always1×. Speed multiplies
simulated steps, never currency/quality/rewards directly. Background pauses all.

Factories/contracts/staff are existing screens under `app/game/(tabs)`; inspect
actual current routes rather than assuming tabs from stale README. Tests must
exercise Plant Info, build picker and assign controls, not only pure helpers.
Use TH/EN message IDs for blocked reasons. Developer debug panel is separate.

## S9. Required verification and calibration evidence

Correctness must pass before tuning. At least these fixtures:

- Audit reproduction: no-generator negative energy; generator/no fuel consumed
  feedstock with zero output; power/tank upgrades ignored; wrong assignment eligibility.
- Every producer: empty/partial/full inputs × power × output room; costs conserved.
- Mixed Q35/Q55 stock cannot satisfy Q55 from Q35; renaming/editing/leveling cannot
  upgrade stock; two plants same blueprint merge costs, different blueprint preserve.
- Lab samples cannot spend reserved/kept/shipped inputs or pay twice; cancel/reload
  and duplicate finish; transfer lead out of production and back has one duty.
- Job partial payments split into1-unit shipments equal one whole shipment in cents;
  repeated completion/cancel/expiry taps cannot double reward; last deadline tick.
- Polymer cannot consume reserved/kept premium Petro; insufficient full-cycle power
  leads to matching partial input/output, not negative energy or free product.
- Generator addition and battery-full fuel behavior; equal-line fairness over100cycles.
- Every building/type/level: UI capability/preview matches action and realized effect;
  move/swap/grid expansion preserve all associated state and module cost provenance.
- Stocks overflow on demolition remain sellable; quantities finite after100k ticks.
- Ordinary/Rush templates: route/Q/module/lab/stock/cash feasible at presentation.
- Recovery cannot farm via sale, duplicate completion, demolition, cancel or reload;
  zero cash/no assets state has a visible finite recovery path.
- Fresh save round-trip is exact; corrupted/newer save fails safely; reset leaves
  no prior-run blueprint/client/reward contamination.
- Modal pause/background/speed preserve intended timers and do not cause missed
  penalties; Info/build/assign visible with keyboard/safe-area on Android.

Legal simulator policies: volume/spot, quality/client, economy/compact, automation
control. Use fixed seeds e.g.1,7,42,20260925 for any existing recruitment/event RNG;
no blueprint randomness. Playthrough policy uses the same build/upgrade/hire/research/
sample/assign/accept/dispatch validators as the UI, never direct money/unlock writes.

Record: first sale, first self-developed shipment, chapters, Partner milestones,
clear time, money/recognized margin, lots, workers, stalled ticks, power curtailment,
discarded feedstock, actions by category, recovery usage and option choices.
Fresh and constructed fixtures are labelled separately. Do not use fixture
success to claim chapter reachability. A simulator can disprove legality/balance;
only human playtests establish whether the decisions are enjoyable.

Initial guardrails: useful feedback every1–3min; no forced tutorial wait>45s;
first self-developed delivery≤10min target; first clear90–180min hypothesis;
ordinary relevant investment incremental payback3–8min hypothesis; two feasible
strategies within25lots; no strategy dominates cash, variety and resilience in
every tested scenario. Orders grant no unbounded repeat RP; idle baseline should
be sustainable after deliberate automation setup.

Exact numbers may be changed only with before/after measurements and updated
tables/tests. Do not keep legacy10–18h duration floors as a design requirement.
Do not weaken conservation or reward-idempotency tests to meet a pacing target.

## S10. Planning-time checks completed (2026-09-25)

These are document/arithmetic checks, **not implementation tests or playtest proof**.

- Parsed the profile/module tables:72 configurations/family, maximumQ80,
  qualities in increments of5. Checked example prerequisites yield Q55 atC1,
  Q65 atC2, Q75 with specialist/rank1 atC3, and Q75 without specialist atC4.
- At Lv1 with no modifiers, unbounded input/output space and ignoring feedstock
  value/wages/maintenance: Volume75gas/min, crude cost990/min, spot contribution360;
  Standard60gas/min, cost720/min, contribution360; Precision48gas/min, cost633.6/min,
  spot contribution230.4. At a Q55 buyer's1.5× quote, Precision contribution662.4/min
  while the job lasts. These expose a market tradeoff, not fully realized net profit.
- Chapter dependency walkthrough has a non-Lube route: developed Gas→Local trial→
  C2→Local Regular+Performance Regular(Q65 via module)→C3→Local Partner→C4→
  Performance/Airline Partner via rank2→Showcase. Alternative Local+Fleet reachesC3.
  This checks logical prerequisites; it does not prove affordability or play time.
- All new local document links exist; fenced blocks balanced; no unresolved
  TODO/TBD markers. Task IDs00–19 and5client/15milestone content stages verified.
- R0 and V3-03 through V3-09 automated checks pass. The legal C0→C2 Gasoline loop
  and deterministic recovery simulator are implemented; Android device interaction
  and the V3-10 comparison/playtest gate remain unverified.
