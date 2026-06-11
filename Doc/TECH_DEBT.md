# Technical Debt

## Known Issues

None currently.

---

## Resolved

- Save / Load — implemented via localStorage with `sanitizeLoadedGameState`
- Bulk buying / selling — Buy 10 / Buy 50 / Fill Tank added
- Storage scaling — per-cell and per-level building bonuses added
- Secondary products have no repeatable demand — resolved by Standing Orders Phase 1 (asphaltMaintenance, jetFuelCharter)

---

## Active Concerns

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

---

## Rule

Do not refactor these items unless they become a real problem.
