> **ARCHIVED — fully implemented.** This was a pre-implementation design
> proposal (2026-06-11). Everything proposed here shipped in later passes —
> see GAME_DESIGN.md for the current system, ROADMAP.md / PLAYTEST_NOTES.md
> for what was actually built and any deviations. Kept for historical design
> rationale only; do not treat the "Status: Design only / not implemented"
> notes below as current.

---

# Plant Module System — Design Document

**Author:** Design session, 2026-06-11

---

## Status

> **Design only. Nothing in this document has been implemented.**
>
> - No gameplay code changed
> - No save schema changed
> - No TypeScript files changed
> - No balance values changed
> - All field names, type names, and code snippets below are **proposals**, not existing code

Do not implement any part of this system until it is explicitly promoted to CURRENT_TASK.md.

---

## Summary

This document proposes a Plant Module System that expands Refinery Story beyond gasoline production. The goal is to give refinery progression more depth and contract variety while staying true to the Kairosoft style: simple, readable, click-to-unlock, fun.

The system should feel like a natural extension of what already exists — not a new game glued on top.

---

## 1. Product Types

Five product lines are proposed. Each occupies a distinct position in the game arc.

---

### Gasoline

**Role:** The foundation. Remains the primary product in the early game. All other modules are unlocked on top of it.

**Game position:** Early game (Refinery Level 1–4)

**Value level:** Baseline. All other products are compared against gasoline margin.

**Contract types:** Local gas stations, bus depots, transport companies (existing contracts). Gasoline-only contracts remain the main entry point for new players.

**Notes:** Gasoline contracts should never be removed. They keep early play stable even after other modules unlock.

---

### Asphalt

**Role:** First expansion product. Crude is processed into a different output that sells in large batches, less frequently. Good for players who prefer planning over constant micro-management.

**Game position:** Mid game (Refinery Level 5–7)

**Value level:** ~1.4× gasoline per unit. Lower sell volume but higher per-shipment value.

**Contract types:**
- Road maintenance contracts (city works)
- Highway construction projects
- Airport runway resurfacing

**Design note:** Asphalt contracts should have longer deadlines than gasoline, rewarding players who keep a reserve rather than sell-as-you-go.

---

### Jet Fuel

**Role:** Premium product. Requires higher refinery level and a research unlock. Rewards players who have invested in both buildings and research.

**Game position:** Mid game (Refinery Level 7–9)

**Value level:** ~2× gasoline per unit. Contracts deliver large cash injections.

**Contract types:**
- Airport fuel supply (recurring)
- Charter airline deal
- Government aviation tender

**Design note:** Jet Fuel contracts should have strict gasoline-equivalent quality requirements — a natural reputation gate. Players must reach Tier 3 reputation before these contracts unlock. This uses the existing reputation system without modification.

---

### Plastic Pellets

**Role:** Industrial product. Longer crude-to-product cycle, very high value. Intended as the "prestige" product for late-game players who have maxed storage and research.

**Game position:** Late game (Refinery Level 10+)

**Value level:** ~3× gasoline per unit. Small batch output, premium contracts.

**Contract types:**
- Packaging manufacturer supply
- Consumer goods factory deal
- Chemical distributor contract

**Design note:** Plastic Pellets production should feel like a deliberate investment. Players who unlock this module are committing to a slower, higher-yield playstyle. This is appropriate for the late game where money is less scarce and patience is rewarded.

---

### Lubricants

**Role:** Specialty product. Low volume, high margin per unit. Designed for players who want a secondary revenue stream alongside their main product line.

**Game position:** Late game (Refinery Level 9–11)

**Value level:** ~2.5× gasoline per unit. Very low volume output.

**Contract types:**
- Machinery maintenance client
- Industrial equipment supplier
- Marine engine servicing company

**Design note:** Lubricants should occupy a niche role — small contracts with high RP rewards. The research reward angle makes them valuable for late-game players still trying to unlock the last research tier.

---

## 2. Module Types

Each Plant Module defines what a refinery unit produces. A refinery unit is the existing Distillation Unit building.

The simplest model: one Distillation Unit = one active module. Changing the module costs money and has a short downtime.

---

### Basic Distillation Module

- **Produces:** Gasoline
- **Unlock:** Available from Refinery Level 1 (default state — all distillation units start with this module)
- **Purpose:** No change from current behavior. Existing saves are unaffected.

---

### Asphalt Processing Module

- **Produces:** Asphalt
- **Unlock:** Refinery Level 5 + Research unlock (new research item: "Asphalt Processing")
- **Purpose:** Gives mid-game players a new revenue stream. Encourages building a second or third Distillation Unit specifically for asphalt.

---

### Jet Fuel Module

- **Produces:** Jet Fuel
- **Unlock:** Refinery Level 7 + Reputation Tier 3 + Research unlock ("Aviation Fuel Standards")
- **Purpose:** Gates premium output behind reputation and research. Natural goal for players approaching the current win condition.

---

### Petrochemical Module

- **Produces:** Plastic Pellets
- **Unlock:** Refinery Level 10 + Research unlock ("Petrochemical Processing")
- **Purpose:** Provides a long-term goal after the current prototype win condition. Extends the late game without redesigning early/mid game.

---

### Lubricant Module

- **Produces:** Lubricants
- **Unlock:** Refinery Level 9 + Research unlock ("Lubricant Synthesis")
- **Purpose:** High-margin side product. Rewards research-heavy players.

---

### Module Switching Rules (Proposed)

- Switching a module costs money (suggested: 20–30% of the module's unlock cost).
- Switching takes one full production cycle of downtime for that unit.
- The player can have different modules on different Distillation Units simultaneously.
- There is no penalty for switching back to Basic Distillation Module.

---

## 3. Unlock Flow

The intended progression keeps gasoline dominant until the player is ready to branch out.

```
Refinery Level 1–4:    Gasoline only
                       (current game, no change)

Refinery Level 5–6:    Asphalt Processing unlocks
                       First new product — contracts diversify
                       Mid-game cash injection opportunity

Refinery Level 7–8:    Jet Fuel unlocks (Reputation Tier 3 required)
                       Premium contracts become available
                       Research investment required

Refinery Level 9–10:   Lubricant and Petrochemical unlock
                       Late-game specialty products
                       Optional — player can ignore them and focus on Jet Fuel

Refinery Level 10+:    Full product lineup available
                       Player manages a true multi-product refinery
```

### Alternative Unlock Path: Research-First

Instead of tying modules purely to Refinery Level, an alternative is a research-first gate:

- Modules require specific research to unlock, regardless of refinery level.
- Refinery level acts as a soft cap (some modules are hidden until a threshold is met).
- This gives the Research panel more purpose and makes the research investment feel rewarding.

**Recommended:** Use both gates. Refinery Level shows the module exists (teaser), but the Research unlock is what actually activates it. This creates a clear visible goal.

---

## 4. Building Impact

### Distillation Unit

The Distillation Unit becomes the "module host." Each unit can run one module at a time.

- No new building type is required for Phase A.
- In Phase B+, a dedicated "Petrochemical Plant" building could be added for Plastic Pellets, but this is not required for the initial module system.
- The current Lv1–3 upgrade system applies to each module independently. A Lv3 Distillation Unit running an Asphalt module produces higher-grade asphalt faster.

### Crude Tank

No change. All modules consume crude as their raw input.

- Asphalt and Jet Fuel modules may consume crude faster than gasoline. The storage system should handle this naturally through the existing maxCrudeStorage mechanic.
- This creates natural tension: players expanding into new products need to also invest in crude storage.

### Product Tank

Product Tanks become product-specific in Phase B+.

- Phase A: Product Tanks store all products together in a unified pool (simpler, no save migration needed for early implementation).
- Phase B+: Product Tanks could be designated per product type (e.g., "Asphalt Storage Tank"). This requires save migration planning and should not be rushed.

**Recommended for first implementation:** Keep unified product storage. Label it "Refined Products" instead of "Gasoline Storage."

### Research Lab

New research items unlock new modules. The existing research system handles this without structural changes. Only new data items in `RESEARCH` array are needed.

Suggested new research items:
- Asphalt Processing (Tier 2)
- Aviation Fuel Standards (Tier 3)
- Lubricant Synthesis (Tier 3)
- Petrochemical Processing (Tier 3, expensive)

### Workers

No new worker types are required for Phase A.

In Phase B+, a "Process Engineer" worker type could be added:
- Effect: +10% production rate per active non-gasoline module
- Cost: high (Tier 2 or Tier 3 worker)

This is not a blocker. The module system can launch without it.

### Contracts

Contracts are extended to reference a `productType` field. Existing gasoline contracts use `productType: 'gasoline'` (backward-compatible default).

New contract entries reference `productType: 'asphalt'`, `'jetFuel'`, etc.

The fulfillment logic checks whether the player has enough of the required product type. Players with only gasoline production cannot fulfill asphalt contracts — this is intentional gating.

### Shipments

No change to the crude shipment system. All products still start from crude.

In a later phase, product-specific shipment options (selling products via contract fulfillment delivery) could be explored, but this is not part of Phase A.

---

## 5. Contract Expansion Impact

Each new product type opens a distinct category of buyer contracts.

---

### Airport Fuel Supply (Jet Fuel)

- Requires: 200–500 Jet Fuel
- Reward: $8,000–$20,000 + high RP
- Reputation gate: Tier 3
- Flavor: "IRPC Refinery is now a certified aviation fuel supplier."

This is the natural endpoint of the current prototype arc. It gives the win condition a more specific industrial identity.

---

### Road Construction Project (Asphalt)

- Requires: 300–800 Asphalt
- Reward: $4,000–$12,000 + medium RP
- Reputation gate: Tier 2
- Flavor: Makes the asphalt module feel purposeful immediately after unlock.

---

### Packaging Factory Deal (Plastic Pellets)

- Requires: 100–300 Plastic Pellets
- Reward: $15,000–$40,000 + high RP
- Reputation gate: Tier 4 (future tier)
- Flavor: Late-game prestige contract. Reward should feel substantial given the production investment.

---

### Machinery Maintenance Client (Lubricants)

- Requires: 50–150 Lubricants
- Reward: $6,000–$15,000 + very high RP reward
- Reputation gate: Tier 3
- Flavor: Recurring contract. Low volume but consistent RP gain — good for players grinding toward Tier 4 reputation.

---

### Industrial Lubricant Buyer (Lubricants — recurring)

- A lightweight repeat contract: small batch (20–40 Lubricants), moderate reward.
- Designed to complement, not replace, gasoline contracts.

---

### Contract Panel Impact

The Contracts panel will need a light UI update to show which product each contract requires. Options:

1. Add a product-type badge next to the tier badge (minimal change).
2. Group contracts by product type (larger change, better for late-game readability).

**Recommended for Phase A:** Product-type badge on each contract card. Uses existing `contract-tier-badge` style pattern.

---

## 6. Save Migration Strategy

The most important constraint: **existing saves must keep working after the module system ships.**

### Phase A Save Changes (Minimal — Future Proposal)

When Phase A is eventually implemented, the proposed additions to `GameState` would be:

```
PROPOSED future GameState additions (not yet added):
  distillationModules: Record<number, ModuleKey>
    // Maps grid cell index → active module key
    // Default: 'basicDistillation' for all existing cells
  productInventory: Record<ProductKey, number>
    // Default: { gasoline: current game.gasoline, asphalt: 0, jetFuel: 0, ... }
```

**Proposed migration approach:**

`sanitizeLoadedGameState` (existing function) already handles missing fields with defaults. When these fields are added, they would use safe defaults — making the change zero-breaking for existing saves:

- `distillationModules` would default to `{}` (empty = all units use Basic Distillation)
- `productInventory` would default to `{ gasoline: save.gasoline, ... }` — preserving the existing gasoline count

Existing saves would load as gasoline-only refineries. No data would be lost. No special migration code would be required at this phase.

**These fields do not exist in the current codebase.**

### Phase B Save Changes (Product Tanks — Future Proposal)

If Product Tanks become product-specific, save migration would be more complex:

- `gridLevels` is already an array parallel to `grid` (this exists today).
- A new `gridProductTypes` array (parallel to `grid`) could designate what each product tank stores.
- Existing saves would have all product tanks default to `'gasoline'`.

This migration would be safe if implemented through `sanitizeLoadedGameState` with a default fill.

**`gridProductTypes` does not exist in the current codebase.**

### What to Avoid

- Do not embed product types inside the `grid` cell values. `BuildingType` union already has 6 members; adding product-specific buildings would multiply rapidly.
- Do not version-stamp saves yet unless a truly breaking change is required. The sanitizer pattern is sufficient through Phase B.
- Do not rename `gasoline` field in `GameState` in Phase A. The rename to `productInventory.gasoline` should happen only in a planned Phase B migration, not opportunistically.

---

## 7. Risks

### Complexity Risk

**Risk:** Players who just wanted to sell gasoline now face a confusing module picker.

**Mitigation:**
- Basic Distillation Module is the default. No action required from the player to keep gasoline production.
- Modules only appear in the UI after their research is unlocked. Players who haven't researched asphalt processing never see the asphalt module option.
- The module picker should be a simple dropdown on the Distillation Unit cell, not a new full-screen panel.

---

### UI Risk

**Risk:** The grid becomes hard to read when different cells run different modules.

**Mitigation:**
- Add a small product-type indicator to each filled grid cell (color band or icon).
- This extends the existing Building Identity Pass work — it's a natural next step, not a new system.
- The `build-option-role` label pattern (already in CSS) could be reused for a module label on each cell.

---

### Balance Risk

**Risk:** Asphalt or Jet Fuel contracts pay so well that gasoline becomes pointless early.

**Mitigation:**
- Lock module contracts behind reputation tiers. Early players cannot access them.
- Keep gasoline contract rewards competitive through Phase A. Players should not feel punished for ignoring new products.
- Run a balance pass specifically on crude consumption rates across modules before shipping Phase B.

---

### Save Compatibility Risk

**Risk:** A developer adds product-specific storage before the migration strategy is finalized, breaking existing saves.

**Mitigation:**
- Document the migration rules in this file before any implementation begins.
- The rule: `sanitizeLoadedGameState` must supply safe defaults for every new field before the field is used in gameplay logic.
- Never assume a loaded save has a new field without a null-check or default.

---

### Scope Creep Risk

**Risk:** "Just one more product" and "just one more module type" expand until the system is a mini-Factorio.

**Mitigation:**
- Cap the product lineup at 5 types: Gasoline, Asphalt, Jet Fuel, Plastic Pellets, Lubricants.
- No intermediate products. No byproducts. No catalysts. No heat exchange simulation.
- Review this document before each implementation phase and confirm the cap still applies.

---

## 8. Recommended Implementation Sequence

This is not a commitment. It is a suggested order if/when the system is promoted.

> These phases are proposals. None have been started. Each phase must be explicitly promoted to CURRENT_TASK.md before any implementation work begins.

| Phase | What would ship | Proposed save impact |
|-------|----------------|----------------------|
| A | Module data types + Basic Distillation default. No UI change. | Add `distillationModules: {}` default via sanitizer. Zero breaking. |
| B | Module picker on Distillation Unit cell. Asphalt module only. | Add `productInventory` field via sanitizer. |
| C | Asphalt contracts added to CONTRACTS array. | Contract data only. No save change. |
| D | Jet Fuel module + contracts. | New module data only. No save change. |
| E | Lubricant + Plastic Pellets modules + contracts. | New module data only. No save change. |
| F | Balance pass across all products. | No save change. |
| G | Product-specific Product Tank designation (optional). | Add `gridProductTypes[]` via sanitizer. Requires dedicated migration review. |

If implemented in order, Phases B–F could ship incrementally without breaking existing saves.
Phase G would require a dedicated migration review before shipping.

---

## 9. What This Design Deliberately Excludes

Per the Kairosoft spirit and DONT_BUILD_YET.md:

- No multi-step production chains (no crude → naphtha → gasoline).
- No byproducts (no sulfur waste from jet fuel processing).
- No pipe routing between buildings.
- No chemical recipes or temperature variables.
- No player-defined production ratios.
- No worker assignment to specific modules (until Worker Assignment system is designed).
- No real-time price fluctuation for products.
- No sixth product type without explicit design approval.

---

## Related Documents

- [BACKLOG.md](BACKLOG.md) — Plant Module / Product Expansion System section (prior notes)
- [ROADMAP.md](ROADMAP.md) — Phase 3: Depth (where module system likely fits)
- [TECH_DEBT.md](TECH_DEBT.md) — Save System future considerations
- [DONT_BUILD_YET.md](DONT_BUILD_YET.md) — Confirmed out-of-scope items
