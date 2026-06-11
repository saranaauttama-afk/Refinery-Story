# Refinery Story Backlog

Items stay here until promoted to CURRENT_TASK.md.

---

## Recommended Next Phase

Prototype v0.4 — Multi-Product Economy is complete. Choose one of the following as the next task.

---

### Option A — Multi-Product Balance Pass 2

Review and optionally adjust Asphalt Contract 18 and Jet Fuel Contract 19 profit/crude ratios, which both sit 2–3× above gasoline T3 equivalents.

**Scope:**
- Code-trace economic analysis with full multiplier simulation (research, reputation tier, workers)
- Adjust up to 3 numeric values if analysis confirms significant imbalance at intended unlock level
- No new contracts, no new products, no UI changes

**Why now:** Economy Review verdict was B. The Contract 20 storage bug is fixed. The Asphalt 18 / Jet Fuel 19 high profit/crude is the remaining open question.

**Risk:** Very low. Numeric constants only. No save migration.

---

### Option B — Lubricants Prototype

Add Lubricants as the third secondary product, following the established Asphalt/Jet Fuel + Standing Orders pattern.

**Scope:**
- `LUBRICANTS_BALANCE` constant (batchSize, largeBatchSize, maxStorage, unlockLevel)
- LubricantsPanel (mirrors AsphaltPanel/JetFuelPanel — locked, active, done states)
- 2 Lubricant contracts (one-time, Tier 3, unlock Level 9+)
- 1 Lubricants standing order
- ContractsPanel extension (lubricants branch in getContractRequirement)
- App.tsx: handleProduceLubricants, completedContractIds check
- Translations: text.lubricants.*
- CSS: .lubricants-panel, .contract-product-badge--lubricants

**Why now:** Lubricants is already defined in ProductKey. The implementation pattern is fully established.

**Risk:** Low. Same pattern as Asphalt and Jet Fuel. Save-compatible via sanitizer defaults.

---

### Option C — Staff Depth Lite

Add strategic tension to the worker system.

**Scope:**
- Staff Hiring Pool Lite: cap hire count per worker type per refinery level
- Midgame Goal Expansion: add 1–2 milestones between Tier 1 and Tier 2 contracts
- Visual Workers: simple colored token or icon per worker type in StaffPanel

**Why now:** Workers are rated 3/5 after the Feedback Pass. Hiring tension and visual presence are the top remaining gaps.

**Risk:** Low to medium. Hiring cap may require balance review on existing saves.

---

### Option D — Final Playtest

Structured play-through of the full game from Level 1 to win condition. Document findings before adding new systems.

**Scope:**
- Code-trace analysis of v0.4 state (all three products, standing orders, 20 contracts)
- Economic simulation with multipliers at key unlock levels (5, 7, 9)
- Identify any new balance or UX issues introduced by the multi-product economy
- Update PLAYTEST_NOTES.md with findings

**Why now:** The prototype has not had a full structured review since Phase 2A closeout. Multi-product economy + standing orders + final polish represent significant changes.

**Risk:** Zero. Documentation only.

---

### Option E — Mobile UI Redesign (Later)

Redesign the layout for mobile and tablet viewports.

**Why later:** The current desktop-first layout is intentional for the prototype phase. Mobile is a future concern once content stabilizes.

**Do not promote until:** Phase 3 content (Staff Training, Supplier Relationships) is planned or shipping.

---

## Remaining Phase 2 Items (Not Yet Promoted)

### Visual Workers / Pixel Placeholder

Add simple colored worker tokens or icons to the StaffPanel.
Goal: make hired staff feel present and meaningful.
(Included in Option C above.)

### Building Identity Pass

Give each building type a distinct visual identity — icon, color band, or label badge.
Goal: player can read the grid at a glance.
(Included in Option D above.)

### Staff Hiring Pool Lite

Limit how many of each worker type can be hired per refinery level.
Goal: hiring decisions feel more meaningful.
(Included in Option C above.)

### Shipment Buy Button Reduction Plan

Reduce the number of instant-buy crude buttons once shipments are the primary mechanic.
Goal: shipments become the main crude acquisition mechanic.
(Included in Option D above.)

### Midgame Goal Expansion

Add a milestone or objective between "first tier-2 contract" and win condition.
Goal: clearer short-term targets during the mid-game waiting window.
(Included in Option C above.)

---

## Not Yet

These are good ideas but not ready to implement.

- Rare / Specialist Staff — wait until base worker visibility is solved first
- Staff Training System — adds complexity before the base loop is polished
- Worker Assignment to Buildings — needs building identity pass first
- Supplier Relationship System — significant new mechanic, defer to Phase 3
- Backend / Server State — not needed for single-player prototype
- Large Save Schema Rewrite — current save is stable, do not disrupt

---

## Do Not Add Now

These are out of scope for the current prototype phase.

- Complex economy simulation (supply/demand curves, price fluctuation)
- Multiplayer or leaderboards
- Full animation system (worker walking, building pulsing)
- New resource chains (electricity, water, intermediate products)

---

## Completed (Recent)

- Content Expansion 1 — more random events, choice events, staff types
- Content Expansion 1.1 — 6 more random events (14 total)
- Staff Tier System Lite — tier grouping with locked states
- Building Upgrade Depth Lite — Lv1–3 for Lab, Workshop, Sales Office
- More Contract Variety — 16 contracts across 3 tiers
- More Choice Events 1.2 — 5 new choice events (12 total)
- Shipment System Phase 2 Lite — 5 sizes, ETA format, logistics bonus, warnings
- Balance Pass 1 — starting resources, penalties, upgrade costs, T2 rep
- Balance Pass 2 — Onboarding Fix (base storage raised, Starter Guide corrected)
- Worker Feedback Pass — visible bonus text per hire in WorkforcePanel and StaffPanel
- Polish Pass 1 — UI Clarity (disabled-reason labels, contract tier grouping, milestone badge cleanup, dev tools separation)
- Research Expansion Lite — 4 new research items (10 total, 775 RP tree)
- Balance Pass 3 — Post Research Expansion (storage optimization 100→75, contract analytics RP rate 0.15→0.20)
- Plant Module Foundation Phase A — ProductKey, ProductInventory types, productInventory in GameState, save migration defaults
- Product Expansion Prototype — Asphalt (AsphaltPanel, 2 contracts, manual batch, ContractsPanel multi-product support)
- Asphalt Balance Pass — Contract 17 asphaltRequired 50→75, reward $3000→$2200, maxStorage 200→150
- Multi-product Contract Polish — product badges, structured Requires/Reward rows, getContractRequirement helper
- Multi-product Economy Review (code-trace analysis; verdict B; found Contract 20 blocking bug)
- Product Expansion Prototype — Jet Fuel (JetFuelPanel, 2 contracts, manual batch, ContractsPanel + App.tsx extension)
- Jet Fuel Balance Pass — maxStorage 150→200, unblocks Contract 20
- Secondary Product Idle UI Pass — AsphaltPanel and JetFuelPanel collapse to compact done state when all related contracts fulfilled
- Multi-Product Phase Closeout (documentation update)
- Repeatable Secondary Product Demand Design (design doc: Option A — Standing Orders recommended)
- Standing Orders Phase 1 (asphaltMaintenance: 40 asphalt/3 min/$900; jetFuelCharter: 60 jet fuel/5 min/$2,200)
- Standing Orders UX/Balance Review (verdict A — Healthy; no balance pass needed)
- Final Web Prototype Polish (number formatting, completed contract card compaction, contracts-list gap, standing orders visual separator)
- Prototype v0.4 Milestone Closeout — Multi-Product Economy (documentation pass)

# FUTURE DESIGN: Plant Module / Product Expansion System

## Goal

Make refinery progression feel more realistic and deeper by allowing plants to unlock additional product lines through modules or upgrades.

This is a future system. Do not build yet.

## Core Idea

Instead of every refinery only producing gasoline forever, players can upgrade or equip plant modules to produce additional products.

Example product lines:

- Gasoline
- Asphalt / Bitumen
- Jet Fuel
- Diesel
- Plastic Pellets
- Lubricant

## Suggested Model

Each Refinery Plant can have one active production module.

Examples:

### Basic Distillation Module
- Produces Gasoline
- Available from early game

### Asphalt Module
- Converts crude into Asphalt
- Lower selling frequency but good contract value

### Jet Fuel Module
- Higher value product
- Requires higher refinery level or research

### Petrochemical Module
- Produces Plastic Pellets
- Expensive to unlock
- Useful for late-game contracts

### Lubricant Module
- Lower volume, high margin
- Could require Research Tier 3+

## Important Constraint

Do not turn this into a complex factorio-style production chain yet.

Keep it Kairosoft-style:

- Simple modules
- Clear product output
- Simple upgrade path
- Contract-driven demand
- Easy UI

## Recommended Future Implementation Phases

### Phase A: Product Types Foundation

Add product types to the game model, but only use Gasoline at first.

Example:

- gasoline
- asphalt
- jetFuel
- plasticPellets
- lubricant

Do this only when ready for save migration planning.

### Phase B: Plant Module Data

Add module definitions:

- module id
- display name
- required refinery level
- required research
- output product
- crude input rate
- product output rate
- optional reputation effect

### Phase C: Module Selection UI

Allow each Refinery Plant to select one module.

Rules:

- One active module per plant
- Changing module costs money
- No worker assignment yet
- No complex pipe system

### Phase D: Contracts Expansion

Add contracts that require different products.

Examples:

- Road Construction Contract → Asphalt
- Airport Fuel Supply → Jet Fuel
- Packaging Factory Deal → Plastic Pellets
- Machinery Maintenance Client → Lubricant

### Phase E: Balance Pass

Balance:

- crude consumption
- storage pressure
- product prices
- contract rewards
- unlock pacing

## Not Now

Do not build this yet.

Avoid for now:

- multi-step production chains
- byproducts
- chemical recipes
- complex inventory UI
- factory routing
- worker assignment
- supplier simulation
- save schema rewrite without planning

## Why This Fits Refinery Story

This gives the game a stronger refinery identity.

It creates long-term progression:

Early game:
- Gasoline only

Mid game:
- Asphalt / Diesel / Jet Fuel

Late game:
- Plastic Pellets / Lubricant / specialty products

It also makes contracts more interesting because different customers can request different products.