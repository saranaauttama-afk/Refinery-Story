# Technical Debt

## Known Issues

None currently blocking. See Active Concerns below for post-v0.7 observations.

---

## Resolved

- Save / Load — implemented via localStorage with `sanitizeLoadedGameState`
- Bulk buying / selling — Buy 10 / Buy 50 / Fill Tank added
- Storage scaling — per-cell and per-level building bonuses added
- Secondary products have no repeatable demand — resolved by Standing Orders Phase 1 (asphaltMaintenance, jetFuelCharter)
- Product Panel Code Duplication — JetFuelPanel/LubricantsPanel/PetrochemicalsPanel
  consolidated into one config-driven `ProductPanel.tsx` + `data/products.ts`
  during the Staff Cleanup & Economy pass.
- ResourcePanel Layout Scale — RESOLVED 2026-06-13: `.resource-grid` changed
  from fixed `repeat(8, minmax(0,1fr))` to `repeat(auto-fit, minmax(140px,
  1fr))`. Triggered immediately by adding the 9th card (ESG Score, see ESG
  axis); now scales to any card count without redesign.
- AWARDS_BALANCE.thresholdGrowthPerYear — RESOLVED 2026-06-13: removed the
  dead config + comment. DECISION: static gradeThresholds are the intended
  design. Rivals (rivals.ts) are already calibrated against these static
  thresholds; ESG (incident risk) and the Energy Transition era (demand
  shift) now provide ongoing late-game pressure in more thematic ways than a
  generic rising score bar would, so a third "gets harder over time" system
  would be redundant/uncoordinated. No rival recalibration needed.

---

## Active Concerns

### Product Panel Code Duplication

RESOLVED — see Resolved section above. (This entry described the
pre-consolidation state and is now stale.)

---

### Economy Complexity with 4 Active Product Lines

With Gasoline, Lubricants, Jet Fuel, and Petrochemicals all active simultaneously, economy balancing now requires simulating crude allocation across 4 competing consumers (gasoline auto-loop + 3 plant types). Contract rewards, sell prices, Sales Agent bonuses, and production rates interact in ways that are harder to reason about than the single-product prototype.

Fix when: Economy Balance Pass (Option A in BACKLOG.md) is promoted.

---

### Sales Agent Bonus Scales Poorly with High-Value Products

The `workerSellPriceBonus` is a flat dollar amount per Sales Agent applied uniformly across all products. At $18 gasoline, each bonus point is ~5–6% of base price. At $150 petrochemicals, the same bonus point is ~2% — proportionally less, but the absolute dollar bonus is still the same per unit, making Sales Agents disproportionately valuable when selling high-volume petrochemicals.

Fix when: Economy Balance Pass or Worker System Expansion is promoted. Review whether bonus should be a percentage rate rather than a flat value, or whether product-specific sell price multipliers are needed.

---

### ContractsPanel Vertical Length

At Level 7+ with all tiers visible and both standing orders unlocked, ContractsPanel is very long (~20 one-time contract cards + 2 standing order cards + reputation status). Most completed contracts are visually muted, so active content is shorter than raw count implies.

**Partially improved by Final Web Prototype Polish (v0.4):** Completed contract cards compacted (padding 16px → 10px 14px, min-height removed), contracts-list gap reduced 14px → 10px. The panel is still long but noticeably tighter.

This predates standing orders and is not caused by them. No urgent fix — acceptable for current prototype phase.

Fix when: ContractsPanel UI Pass is promoted (possible future task — collapse completed contract tiers, or add a filter).

### Secondary Product Profit/Crude Is Above Gasoline Tier 3

Asphalt Contract 18: $43.3 profit/crude. Jet Fuel Contract 19: $35 profit/crude. Both are 2–3× above gasoline T3 best ($22/crude). Both are one-time, which limits total impact. Flagged as an open question pending Multi-Product Balance Pass 2.

Fix when: Multi-Product Balance Pass 2 is promoted.

### Workers Lack Hiring Tension

Bonus text is now visible (Worker Feedback Pass resolved the invisibility problem).
Remaining issue: players can hire unlimited workers of any type with no strategic constraint.
Fix when: Staff Hiring Pool Lite is promoted.

### Instant Buy Buttons Create UI Clutter

The crude panel has both shipment options and 3 instant-buy buttons.
This is intentional for now, but should be streamlined once shipments are the primary mechanic.
Fix when: Shipment Buy Button Reduction Plan is promoted.

### Building Grid Lacks Visual Identity

All buildings show text labels. Difficult to parse at a glance on 4x4 and 5x5 grids.
Fix when: Building Identity Pass is promoted.

---

## Future Refactors

### State Management

Current React state is acceptable.
Revisit when:
- More than 15 building types
- More than 20 research items
- More than 10 panels

### Save System

Current implementation uses localStorage with sanitized field fallbacks.
Future consideration:
- Export / Import save file
- Save versioning for breaking schema changes

### Balancing

Balance Passes 1, 2, and 3 are done. Product Expansion (Asphalt + Jet Fuel) is shipped with targeted balance passes. Values are stable for the current prototype phase.
Future:
- Multi-Product Balance Pass 2 — review Asphalt 18 and Jet Fuel 19 profit/crude; optional if review deems healthy
- Balance Pass for Lubricants if/when that prototype ships
- Balance review after Staff Hiring Pool Lite (hiring caps may affect late-game throughput)

### UI

Future improvements:
- Consistent icon set
- Better responsive layout for narrow screens
- Number formatting (k/M abbreviations for large values)

### Per-product ternary chains

ContractsPanel maps `productKey → needX text` twice (contract cards and standing
orders) with nested ternaries. Acceptable at 5 products; if a 6th product line
is added, replace both with a single `needText(productKey, shortfall)` helper.

---

### Stacking multipliers

Crew levels, perks, eras, research, and combos now all multiply into production /
storage / sell price. Each is individually clamped/rounded, but the *combined*
late-game curve has not had a dedicated balance pass. Review before v1.0.

### Two tick intervals

Production runs in one setInterval; staff XP + annual awards + era detection run
in a second setInterval at the same cadence. Kept separate so production return
paths stay simple. If a third per-tick system appears, consider consolidating
into one tick with a post-process step.

## Rule

Do not refactor these items unless they become a real problem.
