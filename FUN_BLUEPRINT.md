# Refinery Story — U3 Fun Blueprint

Status: design approved for planning; implementation has not started.

Purpose: turn the existing feature-rich simulation into a readable, satisfying management game without discarding the current systems, art direction, or save data.

This document is the implementation contract for lower-cost coding models. Complete one task at a time, run the listed gates, and do not invent additional features while implementing it.

## 1. Product diagnosis

The game does not lack content. It already has production, products, buildings, workers, research, contracts, standing orders, market saturation, events, crises, ESG, awards, specialization, prestige, grid synergies, and logistics.

The current problem is that these systems do not form a clear moment-to-moment loop. The player often sees many controls and numbers before understanding the next useful decision. Once Auto-trade is enabled, the game can operate with little intervention, while the visual factory does not communicate enough of what the simulation is doing.

The redesign must improve four feelings:

1. **I know what to do next.** One clear short-term objective is visible.
2. **My decision changed the factory.** Layout, staffing, contracts, and upgrades have visible consequences.
3. **The factory is alive.** Production, bottlenecks, deliveries, and rewards are shown on the map.
4. **There is always a near reward.** The next meaningful payoff is usually two to four minutes away during the first session.

This is inspired by the clarity and reward cadence of approachable management games. It must not copy another game's content, interface, wording, or progression.

## 2. Evidence from the current source

### 2.1 Early-game contradictions

- `STARTING_BALANCE` gives `$200` and `5` crude.
- The onboarding tells the player to open Operations/Supply and order a crude shipment first.
- The cheapest shipment costs `$450`, so the tutorial's first instruction is impossible.
- The cheapest shipment contains `50` crude, while starting crude capacity is `10` without a Crude Tank.
- Shipment arrival silently delivers only what fits and discards the excess. A new player following the tutorial can therefore lose most of a shipment.
- A new grid is completely empty. Production does not begin until the player discovers Build mode and places a Distillation Unit.
- The five-page onboarding explains several future systems before the player has caused one visible production cycle.

### 2.2 Choice and pacing problems

- Level-one buildings cost only `$30/$45/$30`; the optimal opening is mostly predetermined, not a strategic choice.
- The first permanent contracts require `20`, `30`, `50`, `65`, `100`, and `120` gasoline. They are presented as a catalogue rather than one focused job.
- Refinery level 2 requires `$840` and `60` lifetime gasoline. That can work economically, but the UI does not present a short chain of intermediate wins leading there.
- The first milestone reward triggers at `50` lifetime gasoline, after the player has already repeated the same buy/wait/sell interaction many times.
- Market saturation, seasonal demand, storage, Boost, Auto-trade, contract inventory, and several resource chips compete for attention before their value is demonstrated.

### 2.3 Event eligibility defects

- `getRandomChoiceEvent()` draws from every `ChoiceEventKey`, including staff-only events and `specializationChoice`.
- This means a staff dispute can appear with no staff and the permanent Green/Industrial decision can appear before Level 5.
- Crisis duration constants convert real hours directly to ticks even though their copy describes game-day-scale durations. At `200ms` per tick, some penalties can last many real hours rather than a few in-game days.
- Some event options clamp spending to zero, allowing a player without enough money to receive the positive outcome without paying the intended cost.

These correctness issues must be fixed before judging deeper balance.

### 2.4 Strong systems worth preserving

- One world grid with per-cell building levels and employee assignment.
- Real production tick and storage constraints.
- Dynamic crude price and per-product market saturation.
- Contract, research, reputation, specialization, and prestige progression.
- Grid adjacency and hidden combos.
- Existing delivery truck, smoke, floating-number, milestone, banner, sound, and haptic components.
- Headless simulation scripts and GitHub release APK workflow.

## 3. New core loop

The primary loop is:

1. **Choose a job** — focus a contract or short order.
2. **Prepare the line** — place/upgrade a building, assign staff, or choose a feedstock priority.
3. **Watch the flow** — see crude arrive, equipment operate, inventories move, and the current bottleneck appear.
4. **Intervene** — solve storage, supply, power, staffing, or demand issues.
5. **Deliver** — a truck/ship collects the product and the reward is celebrated on the factory screen.
6. **Invest** — choose one visibly different improvement, then repeat with a new product or constraint.

Auto-trade is a convenience layer unlocked after this loop has been learned. It must never be the first solution shown to a new player.

## 4. First-session target experience

The first 15 minutes are the vertical slice. Late-game rebalance is deferred until this slice is fun.

| Time | Player experience | Required result |
| --- | --- | --- |
| 0:00–0:30 | Factory opens already capable of producing | Smoke/motion/progress starts without visiting another tab |
| 0:30–2:00 | Player follows one live goal and makes the first gasoline | The goal advances on the factory screen |
| 2:00–3:30 | Player delivers a small starter order | Truck feedback, cash reward, and completion headline |
| 3:30–6:00 | Player chooses Storage or Throughput | Choice causes a free/discounted visible factory improvement |
| 6:00–9:00 | Player completes a standard contract | Contracts are taught through use, not an explanation page |
| 9:00–12:00 | Player hires the first useful worker | Only eligible candidates/roles are shown |
| 12:00–15:00 | Player solves a small bottleneck and reaches/refines toward Level 2 | The next unlock is clear before the session ends |

### First-session metrics

- First controllable action: within 20 seconds after entering the factory.
- First visible production: within 45 seconds.
- First completed delivery: within 3 minutes.
- First meaningful either/or choice: within 6 minutes.
- At least three decisions with different outcomes in the first 10 minutes.
- No forced wait longer than 45 seconds at 1x speed during onboarding.
- No more than one modal explanation before the first delivery.
- A new player should be able to state the loop as “make → deliver → improve” after 5 minutes.

## 5. Starter flow design

### 5.1 Initial factory

For **new games only**:

- Pre-place one Crude Tank and one Distillation Unit on adjacent cells.
- Start with enough crude for the first visible production run.
- Keep at least one nearby empty tile highlighted for the player's first construction decision.
- Existing saves must never have their grid overwritten.

Draft values for simulation, not final constants:

- Money: `$200`.
- Crude: `15`.
- Starter buildings: Crude Tank Lv1 + Distillation Unit Lv1.
- Auto-trade: off and locked until the early loop is learned.

The player still learns building by placing the third building after the first delivery. Starting with a functioning line avoids beginning on an empty map with a five-page lecture.

### 5.2 Guided goals

Use a small state machine, not hard-coded UI booleans:

```ts
type StarterMissionKey =
  | 'produce_5_gas'
  | 'deliver_starter_order'
  | 'choose_first_improvement'
  | 'complete_standard_contract'
  | 'hire_first_worker'
  | 'reach_level_2'
  | 'complete'
```

Store the current mission on `GameState` and migrate old saves to `complete` unless they are clearly fresh (`tickCount`, level, buildings, and completed contracts all near zero). Do not replay onboarding over established saves.

Only the current mission appears in the factory goal banner. Tapping it routes to the exact required action or opens the relevant sheet.

### 5.3 Starter order

Add one special, one-time order separate from the permanent contract catalogue:

- Requirement: `5 gasoline`.
- Reward target: `$180–$240`, `2 RP`, `2 reputation`.
- No deadline.
- It is automatically focused.
- Completing it plays truck-out animation, floating cash, sound/haptic, and a milestone headline.

Do not add it to `CONTRACT_BALANCE` as another permanent catalogue row. It is tutorial progression and should not clutter normal contract completion history.

### 5.4 First improvement choice

After the starter order, show one deterministic operational choice:

- **Storage Plan** — one free Gasoline Tank placement.
- **Throughput Plan** — one free Distillation Unit Lv1→Lv2 upgrade, or one discounted extra Distillation Unit if a free upgrade is unsafe.

The choice must visibly change the factory and teach a trade-off. It must not be part of the random event pool.

### 5.5 First supply purchase

Fix the Operations/Supply contradiction:

- Add a starter delivery that fits early storage, for example `20 crude / $160 / 5 seconds`.
- Show expected delivered amount before purchase.
- Disable or clearly warn on shipments whose amount exceeds available capacity.
- Never silently discard paid cargo without a confirmation.
- Change onboarding copy so it does not direct the player to an unaffordable option.

## 6. Information and UI hierarchy

### Factory screen must answer only four questions at a glance

1. What is my current job?
2. Is the line running?
3. What is blocking it?
4. What action should I take next?

### Display rules

- Keep the world as the visual priority.
- The top HUD stays compact; detailed breakdowns remain on tap.
- The goal banner shows one focused objective, not the nearest item from a large milestone list.
- Build and Trade remain available but collapsed.
- Hide Auto-trade settings until unlocked.
- Show one contextual bottleneck bubble near the affected plant: `Need crude`, `Tank full`, `Low power`, `No feedstock`, or `Waiting for order`.
- Use existing animation components before creating new art.

### Progressive disclosure

| System | First shown |
| --- | --- |
| Production and starter order | Immediately |
| Building placement | After first delivery |
| Standard contracts | After improvement choice |
| Recruitment | When affordable and mission reaches hiring |
| Research | After first meaningful RP threshold |
| Auto-trade | After two deliveries or Level 2 |
| Market saturation details | After first manual sale or Auto-trade unlock |
| Rush orders | Level 3 |
| Specialization | Exactly Level 5, never randomly |
| Crises | After Level 2 and after starter missions complete |
| Hidden events / advanced production | Existing level gates |

## 7. Contract redesign

Do not delete the existing contract content. Change how it is presented.

### Focus contract

- Add `focusedContractId: number | null` to save state.
- The player may focus one available contract.
- Factory HUD shows its product, current/required amount, and reward.
- Completion remains manual so inventory allocation is a decision.
- Do not reserve inventory in the first implementation; that is a later option if accidental selling remains a problem.
- Completed contracts remain archived as today.

### Contract board hierarchy

- Recommended: at most three recommended offers at the top.
- Separate active/focused, available, locked, and completed sections.
- A locked catalogue of dozens of rows must not be the first view.
- Auto-trade warns when it is about to sell a product needed by the focused contract. The first implementation may simply skip auto-selling that product while focused.

## 8. Management decisions that create fun

### Layout

- Keep adjacency bonuses but preview them before placement.
- Build picker must explain the exact effect: e.g. `+10% output next to Crude Tank`, not only a green aura.
- The first guided placement should deliberately demonstrate one positive adjacency.

### Staff

- First hire should be a deterministic choice between two understandable roles, not three random stat-heavy cards.
- Example: Operator = faster output; Mechanic = more storage/reliability.
- Hide advanced skill noise until after hire or put it behind details.
- Later visual pass: show small worker activity around the assigned plant. This is not required for U3.1.

### Bottlenecks

- Calculate one primary bottleneck using existing state and derived stats.
- Priority order: no crude → gasoline full → no feedstock → low power → downstream storage full → no focused goal.
- Every bottleneck message must link to a valid solution.

### Automation

- Unlock Auto-trade only after the player completes the manual loop.
- Default it off.
- Keep threshold controls, but provide presets: `Keep for contracts`, `Balanced`, `Sell aggressively`.
- Advanced per-product thresholds can remain under a secondary section.

## 9. Event and crisis repair

Before adding new events:

1. Replace the global random event key list with eligibility predicates.
2. Staff events require at least one employee and any required cash/state.
3. `specializationChoice` is excluded from random selection and triggered only on reaching Level 5 without a specialization.
4. Events that spend money either disable unaffordable options or explicitly define debt/partial outcomes; do not silently clamp the cost to zero.
5. Express crisis durations using `CALENDAR_BALANCE.dayLengthTicks`.
6. Crises do not spawn until starter missions are complete.
7. Add deterministic tests for event eligibility and duration.

## 10. Balance strategy

Do not rebalance every late-game value at once. Use three passes.

### Pass A — first 15 minutes

Tune:

- starting state;
- starter order;
- first supply purchase;
- first two standard contracts;
- Level 2 cost/production gate;
- first worker affordability;
- Auto-trade unlock timing.

### Pass B — first hour

Tune:

- Levels 2–5;
- first research choices;
- Rush Orders;
- worker stacking;
- Level 5 specialization;
- grid pressure and first expansion preview.

### Pass C — long game

Only after device playtests confirm Pass A and B:

- Levels 5–60;
- product profitability;
- awards, crises, prestige, and Industry Legend timing;
- full-loop simulation target.

### Balance guardrails

- Contract value must exceed spot selling, but not by more than roughly 25–50% in the early game.
- A recommended purchase should repay itself within 3–8 minutes during the first hour.
- No single worker type should dominate every strategy.
- No unlock should introduce more than one new primary resource and one new decision at the same time.
- Storage should create a solvable interruption, not sustained inactivity.

## 11. Implementation tasks for Terra

Implement in this order. Each task is a separate commit. Do not combine tasks.

### U3.0 — Baseline and early-game simulation

Files:

- Add `scripts/early-game-sim.ts`.
- Extend `scripts/sim-check.ts` only with stable assertions.
- No UI changes.

Requirements:

- Run the real `tick`, derived stats, purchases, and contract actions where possible.
- Record timestamps for first production, starter delivery, first standard contract, first hire, and Level 2.
- Print idle/wait windows and total player decisions.
- Seed or avoid randomness.
- Establish current baseline first; then encode target ranges from section 4.

Acceptance:

- `npm run typecheck`.
- `npm run sim:check`.
- New simulation can run independently and returns deterministic output.

### U3.1 — Event eligibility and time-scale fixes

Files likely affected:

- `src/game/data/choiceEvents.ts`
- `src/game/data/crisisEvents.ts`
- `src/hooks/useGameLoop.ts`
- `scripts/sim-check.ts`

Requirements:

- Eligible random choice helper takes `GameState`.
- Exclude specialization from random events.
- Staff events require staff.
- Crisis duration uses game-day ticks.
- Starter phase suppresses crises.
- Preserve existing saves.

Acceptance:

- Level 1/no-staff simulations never receive staff/specialization events.
- Specialization appears exactly once at Level 5.
- Crisis durations equal documented game-day lengths.

### U3.2 — Starter state and mission state machine

Files likely affected:

- `src/game/types.ts`
- `src/game/utils/gameCalculations.ts`
- `src/game/utils/gameStorage.ts`
- `src/game/data/balance.ts`
- `src/game/translations.ts`
- `src/hooks/useGameLoop.ts`
- `app/game/(tabs)/index.tsx`

Requirements:

- New saves receive the functional starter line.
- Established saves are unchanged.
- Add mission progression and targeted actions.
- Replace five-page onboarding with one brief welcome plus live missions.
- First goal is visible on factory screen.

Acceptance:

- Fresh save produces within target time.
- Reload preserves mission progress.
- Migration does not overwrite existing grids.

### U3.3 — Starter order and first improvement choice

Files likely affected:

- Add a small starter-mission data file under `src/game/data/`.
- `src/hooks/useGameLoop.ts`
- `src/game/utils/gameCalculations.ts`
- `src/game/translations.ts`
- `app/game/(tabs)/index.tsx`

Requirements:

- One-time 5-gas delivery.
- Deterministic Storage vs Throughput choice.
- Visible reward feedback using existing components.
- Free reward cannot be claimed twice.

Acceptance:

- Both branches produce valid states.
- Save/reload cannot duplicate rewards.
- Delivery occurs within the first-session target under normal play.

### U3.4 — Capacity-safe supply onboarding

Files likely affected:

- `src/game/data/balance.ts`
- `src/game/utils/gameCalculations.ts`
- `app/game/(tabs)/supply.tsx`
- `src/game/translations.ts`

Requirements:

- Add fitting starter delivery.
- Show capacity and expected delivered amount.
- Prevent accidental paid overflow or require explicit confirmation.
- Correct onboarding copy.

Acceptance:

- No guided purchase can discard cargo.
- Existing shipment choices still work for experienced saves.

### U3.5 — Focus contract

Files likely affected:

- `src/game/types.ts`
- `src/game/utils/gameStorage.ts`
- `src/hooks/useGameLoop.ts`
- `app/game/(tabs)/contracts.tsx`
- `app/game/(tabs)/index.tsx`

Requirements:

- Focus/unfocus one unlocked incomplete contract.
- Factory goal links to it.
- Auto-trade protects the focused product or clearly warns.
- Existing contract completion remains compatible.

Acceptance:

- Focus survives reload.
- Completed focused contract clears focus.
- No product or reward duplication.

### U3.6 — Bottleneck feedback and contextual actions

Files likely affected:

- Add a pure bottleneck helper under `src/game/utils/`.
- `app/game/(tabs)/index.tsx`
- Factory view/components as needed.

Requirements:

- Detect one primary bottleneck.
- Show a short contextual bubble/action.
- Reuse current derived stats; do not duplicate production formulas in UI.

Acceptance:

- Unit-style simulation covers each bottleneck state.
- Message disappears when the condition is resolved.

### U3.7 — Automation progression and presets

Files likely affected:

- `src/game/types.ts` or a derived unlock helper.
- `src/hooks/useGameLoop.ts`
- `app/game/(tabs)/index.tsx`
- `src/game/translations.ts`

Requirements:

- Hide/lock Auto-trade until the manual loop is complete.
- Add three presets while retaining advanced thresholds.
- Maintain compatibility with existing persisted settings.

Acceptance:

- Old saves with Auto-trade enabled keep their settings.
- Fresh saves cannot automate before learning manual delivery.

### U3.8 — Factory feedback pass

Files likely affected:

- `src/components/DeliveryTruck.tsx`
- `src/components/FloatingNumbers.tsx`
- `src/components/FactorySkiaView.tsx`
- `app/game/(tabs)/index.tsx`

Requirements:

- Manual and contract deliveries animate consistently.
- Important production/blockage changes are visible without opening a sheet.
- Avoid additional permanent HUD panels.
- Maintain current mobile frame rate and memoization strategy.

Acceptance:

- Feedback works at 1x/2x/3x.
- Grid placement and camera remain unchanged.
- No continuous re-render of every tile on each tick.

### U3.9 — Balance pass and APK playtest

Requirements:

- Run early-game simulation and all existing release gates.
- Build one APK.
- Play a fresh save for 15 minutes on device.
- Record actual timestamps and confusion points in this document's playtest log.
- Change values only after comparing target vs actual.

## 12. Release gates for every implementation task

Required:

```bash
npm run typecheck
npm run sim:check
```

When relevant:

```bash
npm run sim:camera
npm run sim:balance
npm run sim
```

Additional rules:

- Never change production math only in UI.
- Never reset or overwrite a user's established save.
- Every new save field needs migration and a default.
- Random systems need deterministic eligibility tests.
- Do not add a new product, building, research item, currency, or main tab during U3.
- Do not build an APK after every small task; build after a coherent playable slice.

## 13. Playtest log template

| Metric | Target | Actual | Notes |
| --- | --- | --- | --- |
| First action | < 0:20 |  |  |
| First production | < 0:45 |  |  |
| Starter delivery | < 3:00 |  |  |
| First choice | < 6:00 |  |  |
| Standard contract | < 9:00 |  |  |
| First hire | < 12:00 |  |  |
| Level 2 / clear progress | < 15:00 |  |  |
| Longest forced wait | < 0:45 |  |  |
| Confusing screens/actions | 0 critical |  |  |

## 14. Definition of done

The U3 Fun Pass is successful when a fresh player can play the first 15 minutes without outside explanation, experiences at least three meaningful decisions, can see why the factory stops or succeeds, and wants to pursue the next unlock. Passing typecheck or achieving a mathematically stable economy alone is not sufficient.
