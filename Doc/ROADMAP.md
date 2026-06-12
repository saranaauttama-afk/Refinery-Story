# Refinery Story Roadmap

## Phase 1 - Prototype

Completed:

- Buildings (place, remove, combo bonuses)
- Contracts (3 tiers, 16 contracts)
- Research (6 items, prerequisites)
- Workers (6 types, tier grouping, locked states)
- Random Events (14 events)
- Choice Events (12 events)
- Milestones (4)
- Reputation (4 tiers, contract bonuses)
- Save / Load (localStorage)
- Grid Expansion (3x3, 4x4, 5x5)
- Goal / Win Condition
- Shipment System Phase 2 Lite (5 sizes, ETA, cost-per-unit, logistics bonus)
- Building Upgrade Depth (Lv1–3 for all building types)
- Balance Pass 1
- Balance Pass 2 — Onboarding Fix (base storage raised, Starter Guide corrected)
- Research Expansion Lite (10 research items total, 775 RP tree)
- Balance Pass 3 — Post Research Expansion (storage optimization bonus, contract analytics RP rate)
- Plant Module Foundation Phase A (ProductKey, ProductInventory types, productInventory in GameState, save migration defaults)
- Product Expansion Prototype — Asphalt (AsphaltPanel, 2 contracts, manual batch, ContractsPanel multi-product support)
- Asphalt Balance Pass (Contract 17 requirement 50→75, reward $3000→$2200, maxStorage 200→150)
- Multi-product Contract Polish (product badges, structured Requires/Reward rows, getContractRequirement helper)
- Product Expansion Prototype — Jet Fuel (JetFuelPanel, 2 contracts, manual batch, ContractsPanel + App.tsx extension)
- Jet Fuel Balance Pass (maxStorage 150 → 200, unblocks Contract 20)
- Secondary Product Idle UI Pass (AsphaltPanel and JetFuelPanel collapse to compact done state when all related contracts are fulfilled)
- Standing Orders Phase 1 (asphaltMaintenance: 40 asphalt/3 min/$900; jetFuelCharter: 60 jet fuel/5 min/$2,200; cooldown saved in standingOrderCooldowns)
- Standing Orders UX/Balance Review (verdict A — healthy; no balance pass needed)
- Final Web Prototype Polish (toLocaleString formatting, completed contract cards compact, contracts-list gap 14→10px, standing orders amber separator)

---

## Phase 1B — Multi-Product Economy (Complete — Prototype v0.4)

**Milestone: Refinery Story Prototype v0.4 — Multi-Product Economy**

Shipped: Gasoline (primary, auto-loop), Asphalt (Level 5, manual batch, 2 one-time contracts + 1 standing order), Jet Fuel (Level 7, manual batch, 2 one-time contracts + 1 standing order).

Standing orders give asphalt and jet fuel persistent demand after one-time contracts are complete.

Remaining open concerns (not blocking, deferred to next phase):
- No full plant module selection UI (Kairosoft-style module picker per distillation unit)
- Lubricants and Plastic Pellets are defined in ProductKey but are not yet playable
- ContractsPanel vertical length (18+ cards at late game — partially improved by Final Polish)
- Asphalt Contract 18 and Jet Fuel Contract 19 profit/crude are 2–3× above gasoline T3 (one-time, low impact; deferred to Multi-Product Balance Pass 2)

Recommended next for multi-product economy:
- Multi-Product Balance Pass 2 (review Asphalt 18 and Jet Fuel 19 profit/crude; optional if review deems healthy)
- Lubricants Prototype (third secondary product, follows Asphalt/Jet Fuel + Standing Orders pattern)
- Full Plant Module Selection Design (design doc — define per-cell module picker for future implementation)

---

## Phase 2A — Product Expansion (Complete — v0.7)

**Milestone: Refinery Story v0.7 — Full Product Expansion**

Completed:

- Multi-product inventory framework (ProductInventory types, productInventory in GameState, save migration)
- Lubricants (Level 5, Lubricant Plant, sell panel, 3 one-time contracts IDs 21–23)
- Jet Fuel (Level 10, Jet Fuel Plant, sell panel rework, consolidated to single production path)
- Petrochemicals (Level 15, Petrochemical Plant, sell panel, 3 one-time contracts IDs 24–26)
- Product-specific selling for all secondary products (sell 1/10/all with Sales Agent bonus)
- Advanced production buildings (Lubricant Plant, Jet Fuel Plant, Petrochemical Plant)
- Product System Cleanup 1.0 (removed dual Jet Fuel production path)

Current product ladder:

| Level | Product | Building | Price |
|-------|---------|----------|-------|
| 1 | Gasoline | Distillation Unit | $18/unit |
| 5 | Lubricants | Lubricant Plant | $45/unit |
| 10 | Jet Fuel | Jet Fuel Plant | $90/unit |
| 15 | Petrochemicals | Petrochemical Plant | $150/unit |

---

## Phase 2B — Economy & Balance (Next Recommended)

Completed:

- Demand & Goals Pass 1.0 (save-load inventory bug fix, Jet Fuel Charter rework
  Lv7→10 / $2,200→$7,000, Lubricant Supply standing order Lv6, Petrochem Export
  standing order Lv15, 4 late-game milestones: Jet Fuel Pioneer, Aviation
  Partner, Petrochemical Pioneer, Product Mogul)

Suggested goals:

- Sales Agent diminishing returns (flat bonus scales poorly with high-value products at late game)
- Upgrade cost review (Level 10–15 gap may need cost/reward adjustment)
- Contract reward review (petrochemical contracts vs gasoline T3 income comparison)
- Product profitability review ($/crude across all 4 product lines at each unlock level)
- Storage balance pass (all plant products at maxStorage 200 — may need per-product tuning)

---

## Phase 2D — Staff Cleanup & Economy (Complete — v0.9)

- Removed redundant WorkforcePanel; deduped worker bonus text into a shared util
- Consolidated 3 sell-product panels into one config-driven ProductPanel
- Sales Agent flat bonus → percentage; unified productSellMultiplier across all products
- Wages/Payroll system tied to Annual Awards (net profit drives the grade — real hiring tension)
- Combined balance pass (production floor 250→180ms; verified the stacked-multiplier curve is healthy)

See Doc/WORK_PLAN.md and PLAYTEST_NOTES 2026-06-12 "Economy Pass".

---

## Phase 2C — Depth Systems (Complete — v0.8)

**Milestone: Refinery Story v0.8 — Gameplay Systems Expansion**

Four Kairosoft-style systems added (all save-compatible):

- Staff Training & Levels — per-type crew Level 1–5 with passive XP and paid
  instant training; level scales bonus effectiveness ×1.0 → ×1.6
- Refinery Upgrade Perk Tree — 1 point per level-up, spent across Efficiency /
  Capacity / Quality branches (3 directional tiers each)
- Tech Eras — Foundation → Expansion → Modern with cumulative global bonuses and
  a one-time advancement banner
- Annual Awards — 12-minute business year graded S/A/B/C with cash + reputation
  rewards, ceremony modal, and rolling 12-year history

See Doc/GAMEPLAY_SYSTEMS_EXPANSION.md for design rationale.

---

## Phase 2 — Feel and Identity

Completed:

- Worker Feedback Pass (visible bonus text per hire in WorkforcePanel and StaffPanel)
- Polish Pass 1 — UI Clarity (disabled-reason labels, contract tier grouping, milestone badge cleanup, dev tools separation)

Planned:

- Staff Depth Lite (hiring tension, visual workers, midgame goal expansion)
- Visual Workers / Pixel Placeholder
- Building Identity Pass (icons or color coding per type)
- Staff Hiring Pool Lite (limited hire slots per session)
- Shipment Buy Button Reduction Plan (reduce clutter, promote shipments)
- Midgame Goal Expansion (new milestone or mid-tier objective)
- Final Playtest (structured play-through, document findings before Phase 3)

---

## Phase 3 - Depth

Planned:

- Staff Training System
- Staff Level System
- Rare / Specialist Employees
- Worker Assignment to Buildings
- Supplier Relationship System
- Crude Shipment Enhancements

---

## Phase 4 - Visual Polish

Planned:

- Pixel Art Buildings
- Pixel Workers on Grid
- Animation (production cycle, events)
- Better UI Layout and Icons

---

## Phase 5 - Release Candidate

Planned:

- Final Balance Pass
- Full Content Review
- Bug Fixing
- Final UI Polish
