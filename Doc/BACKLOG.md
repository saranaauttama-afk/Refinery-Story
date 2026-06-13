# Refinery Story Backlog

Items stay here until promoted to CURRENT_TASK.md.

---

## Next Session — Charm Pass Follow-ups + Strategic Differentiation (2026-06-13)

Discussed but not started. The first three are a continuation of the Charm
Pass (4 items done — see PLAYTEST_NOTES 2026-06-13). Recommended order: 3 → 4
→ 2, then revisit the strategic-differentiation set below once gameplay
feels locked.

### 3. Rival Refineries / Annual Ranking (cheap, high charm)

2-3 fictional rival companies (e.g. "Coastal Refining Co.", "Apex
Petrochem") each get their own score every business year — a baseline that
grows with the year number plus small randomness, tuned to track near the
player's economy curve (see Economy Pass numbers in PLAYTEST_NOTES). Surface
as "Ranked #X of 4" in the existing AwardCeremonyModal alongside the S/A/B/C
grade. No new system — just an extra computed field on the award record.

### 4. Hidden/discoverable combos (medium effort)

3-5 NEW adjacency combos beyond the 3 already shown in the UI
(crude↔distillation, distillation↔product, crude↔product). e.g. "Refining
Triangle": Distillation Unit + Lubricant Plant + Petrochemical Plant in a row
→ one-time RP/cash bonus + a discovery popup (reuse the era-banner-toast
pattern). Track `discoveredCombos: string[]` in GameState; don't document
these combos anywhere in-game — the player has to find them. Ties into the
milestone/log system.

### 2. Star employees (scoped down — avoids a big refactor)

NOT full individual-employee stats (that would mean reworking the
count-per-type architecture — a large refactor AGENTS.md says to avoid).
Instead: ~5% chance on hire to get a "veteran" tag with a small permanent
perk (e.g. +20% personal XP rate), shown with a star marker in the
StaffPanel roster (built on top of the named-staff roster from the Charm
Pass). Workers stay count+level per type underneath.

---

## Strategic Differentiation — "Better than Kairosoft" (2026-06-13)

Kairosoft games rarely have real strategic tradeoffs — numbers only go up,
and replays tend to converge on one best path. These four ideas hook into
EXISTING systems (eras, perks, economy, awards) — no new silos — and lean
into the refinery theme in ways generic Kairosoft clones don't.

### 1. ✅ DONE (2026-06-13) — ESG / Safety as a second axis

Shipped in `feature/esg-safety-axis`: GameState.esgScore (0-100, starts 50)
drifts per tick — down from "dirty" refining buildings, up from
safetyOfficer staff. Affects incident-event frequency (getIncidentChance)
and unlocks a +10% premium contract bonus at esgScore>=70. See
PLAYTEST_NOTES 2026-06-13 for the full design.

### 2. Eras that shift the meta, not just add bonuses

Currently eras (foundation → expansion → modern) only add cumulative +sell
price / +RP bonuses. A later era — e.g. "Energy Transition" — could instead
SHIFT demand: gasoline demand slowly declines while petrochemicals/specialty
chemicals demand rises, forcing a mid-game restructuring of the refinery
instead of pure linear expansion. Kairosoft progression is static; this
creates a real inflection point.

### 3. Perk branch diversity / build diversity (balance pass only)

Efficiency / Capacity / Quality perk branches may currently have one
standout branch. A balance pass to make all three genuinely viable late-game
(volume play vs premium play vs diversified play) would add real
replayability for the cost of a numbers-only pass — no new code.

### 4. Seasonal price/demand volatility within a business year

Within the ~12-minute business year, introduce "seasons" where gasoline
demand/price swings high and low on a cycle (like tourist-season vs
off-season), so players time production/selling for short-term planning.
Kairosoft games have static prices for the whole game — this adds a planning
layer that doesn't exist there at all.

---

## Recommended Next Phase

v0.7 — Product Expansion is complete. Choose one of the following as the next task.

---

### Option A — Economy Balance Pass

Review and adjust economy balance across all four product lines now that the full product ladder is implemented.

**Scope:**
- Code-trace economic analysis with full multiplier simulation at key levels (5, 10, 15)
- Review Sales Agent flat bonus impact on high-value products ($90 jet fuel, $150 petrochemicals)
- Review petrochemical contract rewards vs gasoline T3 income
- Adjust up to 5 numeric constants if analysis confirms imbalance
- No new systems, no UI changes, no save migration

**Why now:** v0.7 introduces 3 new auto-production buildings and 6 new contracts. The balance has not been reviewed with all 4 products active simultaneously.

**Risk:** Very low. Numeric constants only.

---

### Option B — Worker System Expansion

Add strategic tension and visibility to the worker system.

**Scope:**
- Staff Hiring Pool Lite: cap hire count per worker type per refinery level
- Visual Workers: simple colored token or icon per worker type in StaffPanel
- Midgame Goal Expansion: 1–2 milestones between Tier 1 and Tier 2

**Why now:** Workers are rated 3/5. Hiring tension and visual presence are the top remaining gaps. Sales Agent and Operator interactions with 4 product lines make this more important.

**Risk:** Low to medium. Hiring cap may require balance review on existing saves.

---

### Option C — Endgame Progression

Add meaningful content and goals for the Level 10–15 range.

**Scope:**
- 1–2 new milestones targeting Petrochemical Plant activity
- Review win condition — does Level 15 need a new goal component?
- Optional: new research items tied to advanced products (e.g. premium petrochemicals, efficient refining)

**Why now:** The Level 10–15 gap currently has no new building unlocks except Petrochemical Plant at Level 15. Refinery upgrades in this range feel less purposeful.

**Risk:** Low. Milestone and balance constants only. Save-compatible.

---

### Option D — Contract Expansion

Add more contract variety for mid-to-late game, especially for the new product lines.

**Scope:**
- 1–2 additional Lubricant contracts (current: 3 one-time contracts, no standing order)
- Review whether Jet Fuel needs a standing order now that manual batch is removed
- Optional: mixed-product contract (requires both gasoline and one secondary product)

**Why now:** Lubricants has no repeatable demand (no standing order). Jet Fuel lost its manual batch path — the standing order is the only repeatable demand.

**Risk:** Low. Follows established contract patterns.

---

### Option E — Mobile UI (Later)

Redesign the layout for mobile and tablet viewports.

**Why later:** The current desktop-first layout is intentional for the prototype phase. ResourcePanel now has 8 cards — mobile layout needs dedicated planning before implementation.

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
- Product Expansion 1.0 — Multi-Product Framework (ProductInventory display, ResourcePanel extension)
- Product Expansion 1.1 — Lubricant Plant (Level 5, $3,000, auto 10 crude→5 lubricants/5s, LubricantsPanel)
- Product Expansion 1.2 — Lubricant Market (sell 1/10/all at $45/unit + Sales Agent bonus)
- Product Expansion 1.3 — Lubricant Contracts (IDs 21–23, Tier 2–3, unlock Level 5)
- Product Expansion 1.4 — Jet Fuel Plant (Level 10, $8,000, auto 20 crude→5 jet fuel/5s)
- Product System Cleanup 1.0 — Jet Fuel production consolidated (removed manual batch, JetFuelPanel is now sell-only)
- Product Expansion 1.5 — Petrochemical Plant (Level 15, $15,000, auto 30 crude→5 petrochemicals/5s, PetrochemicalsPanel)
- Petrochemical Contracts (IDs 24–26, Tier 3, unlock Level 15, rewards $15k–$75k)
- Documentation Update — Product Expansion Closeout v0.7
- Demand & Goals Pass 1.0 — secondary inventory save fix, Jet Fuel Charter rework (Lv10, $7,000), Lubricant Supply + Petrochem Export standing orders, 4 late-game milestones (covers most of Option C + Option D)
- Gameplay Systems Expansion v0.8 — Staff Training & Levels, Refinery Upgrade Perk Tree, Tech Eras, Annual Awards (Option B Visual Workers / hiring tension addressed via leveling; new long-term + recurring goals)

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