# Playtest Notes

## 2026-06-12 — Gameplay Systems Expansion v0.8

**Method:** Implementation pass + 48 unit assertions. Branch `feature/gameplay-systems-expansion`.

Four new systems, each targeting a long-standing playtest complaint.

### 1. Staff Training & Levels (fixes "workers feel passive/invisible")

Workers now visibly grow. Each type's crew earns XP every tick (faster with more
headcount), levels 1→5, and each level adds +15% bonus effectiveness (×1.6 at
max). A Train button lets impatient players buy a level with money + RP. The XP
bar in StaffPanel gives the constant low-level feedback the crew was missing.

### 2. Refinery Upgrade Perk Tree (fixes "level-ups are just a number")

Every refinery level-up now grants an upgrade point. Three directional branches
(Efficiency / Capacity / Quality) with prerequisite gating mean you can't max
everything — each playthrough specializes. This gives level-ups a *decision*.

### 3. Tech Eras (fixes "research ends abruptly, no long-term goal")

Foundation → Expansion → Modern, gated on research count + refinery level. Each
era is a visible long-term target with a real payoff (+sell price, +RP) and a
one-time banner moment. The Era panel shows dual progress bars toward the next era.

### 4. Annual Awards (adds the Kairosoft recurring-hype beat)

A 12-minute business year ends in a graded ceremony (S/A/B/C) with cash + rep.
The Awards panel shows a live projected grade and the year's running stats, so
players have a recurring medium-term target that pulls all the other systems
together (produce more, earn more, complete more → better grade).

### Balance Notes / Concerns

- Staff XP pacing: Level 1→2 ≈ 80s for a crew of 3; full Lv5 is a long-haul
  goal (~hours of idle, or paid training). Feels right for a chill management
  game but worth re-checking once specialists are common.
- Perk + era + crew-level bonuses now stack multiplicatively with research and
  combos. Late-game sell price / production could compound fast — flagged for a
  future combined Balance Pass (the Option A Sales Agent review should fold this in).
- Awards score weights (1/gas, 8/$1k, 60/contract) are a first pass; the S
  threshold (1000) is reachable but demanding in a 12-minute year — tune after
  live play.
- Year length (12 min) means a new player's first ceremony is ~12 min in. If
  early retention testing shows that's too long for the first payoff, consider a
  shorter first year.

### Carried-forward (unchanged)

- Sales Agent flat-bonus diminishing-returns review (now more urgent with crew
  levels amplifying it) — BACKLOG Option A.
- Petrochemical Contract 26 ($75k) still the largest single reward.

---

## 2026-06-12 — Demand & Goals Pass 1.0

**Method:** Code-trace analysis + implementation pass. Branch `feature/demand-goals-pass`.

---

### Bugs Found and Fixed

1. **Secondary product inventory wiped on every load.** `sanitizeLoadedGameState`
   still contained the Phase A placeholder that reset asphalt, jet fuel, lubricants,
   and petrochemicals to 0. Any player who saved with stock in a plant product lost
   it on reload. Fixed: amounts are now read from the save with a safe 0 default.

2. **Jet Fuel Charter became a trap after the v0.7 production rework.**
   With the new 20 crude → 5 jet fuel ratio, 60 jet fuel sells for $5,400 base
   directly — but the standing order only paid $2,200. Fulfilling it lost the
   player $3,200 versus just pressing sell. It also unlocked at Level 7, three
   levels before jet fuel can be produced (plant unlocks at 10).
   Fixed: unlock 7 → 10, reward $2,200 → $7,000, RP 15 → 20, Rep 10 → 15.

---

### Standing Order Economics (all four orders, base prices)

| Order | Required | Crude cost | Direct sell value | Order reward | Premium vs selling |
|-------|----------|-----------|-------------------|-------------|--------------------|
| City Road Maintenance (asphalt, Lv5) | 40 | $400 | n/a (no direct sell) | $900 | — |
| Industrial Machinery Co-op (lubricants, Lv6) | 60 | $1,200 | $2,700 | $3,800 | +$1,100 + 12 RP + 8 Rep |
| Regional Air Charter (jet fuel, Lv10) | 60 | $2,400 | $5,400 | $7,000 | +$1,600 + 20 RP + 15 Rep |
| Overseas Petrochem Export (petrochem, Lv15) | 40 | $2,400 | $6,000 | $8,500 | +$2,500 + 35 RP + 30 Rep |

Premiums stay ahead of direct selling until roughly 5–8 Sales Agents (+$3/unit
each), at which point the player has a genuine optimization choice rather than
an always-correct button. This is intentional.

---

### New Milestones (Level 10–15 gap)

Before this pass, nothing happened between Jet Fuel Plant (Lv10) and
Petrochemical Plant (Lv15) except refinery upgrade costs. The gap now has a
goal ladder:

- **Jet Fuel Pioneer** — build a Jet Fuel Plant ($2,500, +25 Rep) — fires at Lv10
- **Aviation Partner** — complete any jet fuel contract ($4,000, 30 RP) — Lv10–12
- **Petrochemical Pioneer** — build a Petrochemical Plant ($5,000, +50 Rep) — Lv15
- **Product Mogul** — complete a contract in every product line ($10,000, +75 Rep)
  — endgame collection goal, Kairosoft-style "complete the set" payoff

Total milestone count: 12 → 16.

---

### Remaining Concerns (carried forward)

- Sales Agent flat bonus still scales linearly into high-value products
  (BACKLOG Option A — diminishing returns review still recommended).
- Asphalt remains the only product with no direct sell path; its standing order
  is its only repeatable income. Acceptable for now.
- Petrochemical Contract 26 ($75,000) still dwarfs everything; review with
  Option A.
- Mixed-product contract (gasoline + jet fuel) deferred — needs multi-requirement
  completion logic in App.tsx and ContractsPanel.

---

## 2026-06-11 — v0.7 Product Expansion Complete

**Milestone:** Refinery Story v0.7 — Full Product Expansion
**Method:** Documentation pass. No source changes. Reflects full state after Product Expansion 1.0–1.5 and Product System Cleanup 1.0.

---

### Completed Features

- Multi Product Framework (ProductInventory types, productInventory in GameState, save migration defaults)
- Lubricants resource (ProductKey renamed from plasticPellets placeholder)
- Lubricant Plant (Level 5, $3,000, auto: 10 crude → 5 lubricants every 5s per plant)
- Lubricant selling ($45/unit + Sales Agent bonus, manual sell 1/10/all)
- Lubricant contracts (IDs 21–23, Tier 2–3, unlock Level 5)
- Jet Fuel Plant (Level 10, $8,000, auto: 20 crude → 5 jet fuel every 5s per plant)
- Jet Fuel selling rework (removed dual production path; JetFuelPanel is now sell-only)
- Petrochemical Plant (Level 15, $15,000, auto: 30 crude → 5 petrochemicals every 5s per plant)
- Petrochemical selling ($150/unit + Sales Agent bonus, manual sell 1/10/all)
- Petrochemical contracts (IDs 24–26, Tier 3, unlock Level 15)
- Product System Cleanup 1.0 (consolidated Jet Fuel to single auto-production path)

---

### Current Product Progression

| Level | Product | Building | Price | Production |
|-------|---------|----------|-------|-----------|
| 1 | Gasoline | Distillation Unit | $18/unit | Auto-loop (1/tick) |
| 5 | Lubricants | Lubricant Plant ($3,000) | $45/unit | Auto: 10 crude → 5 lubricants / 5s |
| 10 | Jet Fuel | Jet Fuel Plant ($8,000) | $90/unit | Auto: 20 crude → 5 jet fuel / 5s |
| 15 | Petrochemicals | Petrochemical Plant ($15,000) | $150/unit | Auto: 30 crude → 5 petrochemicals / 5s |

---

### Known Balance Concerns

1. **Sales Agents scale too well in late game.** The flat `workerSellPriceBonus` applies equally to all products including $150 petrochemicals — the bonus becomes proportionally larger at higher base prices.
2. **Advanced product contract rewards may create excessive income.** Petrochemical Contract 26 (200 units, $75,000) is the largest reward in the game and may outpace gasoline income significantly at Level 15.
3. **Refinery upgrades above Level 10 feel less meaningful.** Cost continues to scale but no new production mechanic unlocks until Level 15. The gap between Jet Fuel Plant (Level 10) and Petrochemical Plant (Level 15) may feel empty.
4. **Advanced product storage limits may require tuning.** All three plant products share maxStorage: 200. With multiple plants, storage fills fast and crude demand spikes.

---

### Recommended Next Playtest Focus

- Product profitability comparison (gasoline vs lubricants vs jet fuel vs petrochemicals $/crude at each stage)
- Contract progression pacing (do petrochemical contracts reward too much relative to gasoline T3?)
- Late-game economy (Level 10–15 income balance, crude pressure with 3 competing plants)
- Worker balance (Sales Agent and Operator bonuses at maximum hire count)

---

## 2026-06-11 — Prototype v0.4 Milestone Closeout

**Milestone:** Refinery Story Prototype v0.4 — Multi-Product Economy
**Method:** Documentation pass. No source changes. Reflects full state after Final Web Prototype Polish.

---

### What Is Playable in v0.4

| System | Status | Notes |
|--------|--------|-------|
| Gasoline economy | Complete | Auto-loop, 16 contracts (Tier 1/2/3), direct sell |
| Asphalt economy | Complete | Level 5 unlock, manual batch ×10/×50, 2 one-time contracts, 1 standing order |
| Jet Fuel economy | Complete | Level 7 unlock, manual batch ×25/×75, 2 one-time contracts, 1 standing order |
| Standing Orders | Complete | asphaltMaintenance (40 asphalt, $900, 3 min); jetFuelCharter (60 jet fuel, $2,200, 5 min) |
| Contracts | Complete | 20 total (16 gasoline + 2 asphalt + 2 jet fuel); 3 tiers; reputation gating |
| Workers | Functional | 6 types, 3 tiers, visible bonus text; hiring tension not yet implemented |
| Research | Functional | 10 items, 775 RP tree; stays relevant through late game |
| Random Events | Complete | 14 events, 30-second interval |
| Choice Events | Complete | 12 events, 60-second interval |
| Milestones | Complete | 12 milestones, sorted incomplete-first |
| Shipments | Complete | 5 sizes, ETA display, cost-per-unit, logistics bonus, low-capacity warning |
| Building Grid | Complete | 6 types, Lv1–3 upgrades, combo bonuses, 3×3/4×4/5×5 expansion |
| Goal / Win Condition | Complete | Level 10 + $100k expansion + Reputation 250 + Contract 7 |
| Save / Load | Complete | localStorage with sanitizeLoadedGameState; all new fields safely defaulted |

---

### Economic Snapshot (v0.4, base prices, no multipliers)

| Income source | Profit/crude | Type |
|--------------|-------------|------|
| Gasoline direct sell | $8 | Continuous auto |
| Gasoline T3 best (Contract 16, 1000 gas) | $22 | One-time |
| Asphalt Contract 17 (75 asphalt) | $19.3 | One-time |
| Asphalt Contract 18 (150 asphalt) | $43.3 | One-time — flagged for Balance Pass 2 |
| Jet Fuel Contract 19 (100 jet fuel) | $35 | One-time — flagged for Balance Pass 2 |
| Jet Fuel Contract 20 (200 jet fuel) | $50 | One-time |
| Asphalt standing order (40 asphalt, 3 min) | $12.50 | Repeatable |
| Jet fuel standing order (60 jet fuel, 5 min) | $26.67 | Repeatable |

---

### Open Concerns Carried Into v0.5

1. **Asphalt 18 and Jet Fuel 19 profit/crude are high** (2–3× above gasoline T3). Both one-time, low total impact, but flagged for Multi-Product Balance Pass 2.
2. **No Lubricants or Plastic Pellets playable yet.** Types exist in `ProductKey` but no panels, contracts, or standing orders.
3. **ContractsPanel vertical length.** 20+ cards at late game. Partially improved by Final Web Polish (completed card compaction, reduced gap). Not fully resolved.
4. **Workers lack hiring tension.** Players can hire unlimited workers of any type with no strategic constraint.
5. **Building grid lacks visual identity.** Text-only shortnames at 4×4 and 5×5 are hard to parse at a glance.

---

### Recommended Next Task

Any of the following is a valid v0.5 starting point:
- **Multi-Product Balance Pass 2** — review Asphalt 18 / Jet Fuel 19 profit/crude (very low risk, numeric-only)
- **Lubricants Prototype** — third secondary product, pattern fully established
- **Staff Depth Lite** — hiring tension, visual workers, midgame goal
- **Final Playtest** — full structured play-through of v0.4 to surface any new issues before Phase 3

---

## 2026-06-11 — Standing Orders UX/Balance Review (Code-Based Analysis)

**Method:** Full code trace of `ContractsPanel.tsx`, `STANDING_ORDER_BALANCE`, `handleFulfillStandingOrder` in App.tsx, and `sanitizeLoadedGameState`. Economic simulation at Level 5 and Level 7.

---

### Standing Orders — Current State

| Order | Product | Required | Net profit | Profit/crude | Cooldown | Income/min |
|-------|---------|----------|-----------|--------------|----------|------------|
| City Road Maintenance Bureau | Asphalt | 40 | $500 | $12.50 | 3 min | $167 |
| Regional Air Charter Service | Jet Fuel | 60 | $1,600 | $26.67 | 5 min | $320 |

For reference — one-time contracts and gasoline:

| | Net profit/crude |
|---|---|
| Gasoline direct sell | $8 |
| Gasoline T3 best (Contract 16) | $22 |
| Asphalt Contract 17 (one-time) | $19.3 |
| Asphalt Contract 18 (one-time) | $43.3 |
| Jet Fuel Contract 19 (one-time) | $35 |
| Asphalt standing order | $12.50 |
| Jet fuel standing order | $26.67 |

---

### Questions Answered

**1. Are standing orders easy to understand?**

Yes. Each card follows the identical visual pattern as existing contracts: product badge, buyer name, Requires row, Reward row, action button. Flavor text ("Standing contract for municipal road repair crews.") adds narrative. The "Restocking — Xm Ys" countdown in the button is self-explanatory — consistent with shipment ETA conventions already present in the game.

**2. Are rewards worth doing?**

Yes. At Level 5, earning $500 net per 3-minute cycle for a single production click is meaningful. At Level 7, $1,600 net per 5-minute cycle is a significant supplement to gasoline income without replacing it. Both orders require exactly one large-batch click to fill (asphalt ×50 fills to 50 → 40 used + 10 leftover; jet fuel ×75 fills to 75 → 60 used + 15 leftover). Effort is minimal relative to reward.

**3. Are cooldowns too short or too long?**

Appropriate. Both cooldowns are long enough to make each fulfillment feel like a deliberate cycle rather than spam-clicking. Both are short enough to be hit 2–4 times in a 15-minute session. Asphalt (3 min) is correctly shorter than jet fuel (5 min) since it unlocks earlier and pays less.

**4. Does this solve the contract-only product problem?**

Yes — effectively. Before standing orders: players completed asphalt contracts 17 & 18, panel showed "done", asphalt was effectively retired from gameplay. Now: the City Road Maintenance Bureau standing order persists indefinitely, giving the player an ongoing reason to produce asphalt every 3 minutes. Same for jet fuel. Secondary products are active throughout the game, not just at the moment of one-time contract fulfillment.

**5. Is either standing order dominant?**

No. Jet fuel ($320/min net) earns roughly 1.9× more per minute than asphalt ($167/min). This is intentional — jet fuel unlocks 2 levels later, requires more crude per cycle (60 vs 40), and targets a higher-tier player. Neither order is so rewarding that it crowds out gasoline or makes the other pointless.

**6. Does ContractsPanel feel cluttered?**

Somewhat. At Level 7+ with all three tiers visible and both standing orders unlocked, the panel is very long. Content: reputation status card + ~16 one-time contract cards + 2 standing order cards. Most one-time contract cards are "Completed" by late game and visually muted, so the active content is shorter than the count suggests. The "Standing Orders" heading and italic flavor text distinguish the section without requiring a new panel. The vertical length is not newly caused by standing orders — it was already long — but it remains the panel's primary UX weakness.

---

### Crude Allocation Pressure

Asphalt order: 40 crude per 3-min cycle. At Level 5, the player's crude storage is 50–200 units depending on buildings. 40 crude is a real but manageable ask — enough to create a decision ("do I run the asphalt order this cycle, or hold crude for the gasoline loop?") without being disruptive.

Jet fuel order: 60 crude per 5-min cycle. At Level 7, crude storage is higher and the 60-crude commitment is similarly moderate. The 5-minute cooldown means the player only diverts ~12 crude/minute — a small fraction of a well-developed refinery's throughput.

Both standing orders add pressure without creating tension. This is the correct balance for optional secondary income: visible, worthwhile, but not forcing a tradeoff.

---

### Implementation Findings

**Cooldown persistence:** Stored correctly as absolute tick values in `standingOrderCooldowns`. Survives save/load: if a player saves mid-cooldown and reloads, the remaining time is calculated from the saved `availableAt` tick vs the loaded `tickCount`. No state loss.

**Sanitizer:** `getSafeStandingOrderCooldowns` correctly defaults to `{}` for saves without the field (all pre-standing-orders saves). Whitelists only known keys. Safe for all existing saves.

**Production step count per cycle:** Exactly one large-batch click per order. This is the ideal interaction density for a 3–5 minute cooldown.

**Minor code observation:** `formatCooldown` uses `Math.ceil` on seconds. When 1ms remains, this displays "0m 1s" rather than "0m 0s". This prevents a confusing "0m 0s" flash before the order resets. Correct behavior.

---

### Verdict

**A — Healthy.**

Standing orders solve the contract-only secondary product problem cleanly. Reward rates are appropriate (below one-time contract windfalls, above gasoline direct sell). Cooldowns pace the mechanic correctly. UI follows established patterns and adds no significant cognitive load beyond the existing ContractsPanel length.

No balance pass is needed. No redesign is needed. No UX polish is urgent.

---

### Top Strengths

1. **Problem is solved.** Secondary products are now active throughout the full game. Players have a persistent reason to produce asphalt and jet fuel after one-time contracts are complete.
2. **Reward calibration is correct.** Asphalt standing order ($12.50/crude) sits neatly between gasoline direct sell ($8) and gasoline T3 contracts ($22). Jet fuel order ($26.67/crude) is at the top of the range but paired with a longer cooldown and higher-level unlock that justify the margin.
3. **One click per cycle.** The manual production step creates a satisfying micro-interaction — click to produce, click to fulfill, wait, repeat — without requiring sustained attention.

### Top Concerns (Not Blocking)

1. **ContractsPanel vertical length.** With 18+ contract cards + 2 standing orders, the panel requires significant scrolling at late game. This predates standing orders and is not worsened dramatically, but it remains the top UX concern for this panel.
2. **Split-attention production loop.** Secondary products require checking ContractsPanel (to see timer), navigating to AsphaltPanel/JetFuelPanel (to produce), then back to ContractsPanel (to fulfill). Gasoline auto-production removes step 2. This is by design but adds friction for players who find the cross-panel flow confusing.
3. **Jet fuel standing order profit/crude ($26.67) is above Gasoline T3 ($22).** This was flagged in the economy review. For ongoing income it is acceptable, but it makes jet fuel the highest-efficiency ongoing crude use in the game. Monitor this as more standing orders are added.

---

### Recommended Next Task

**Final Web Prototype Polish** — the multi-product economy is now stable and the contract-only problem is solved. A focused polish pass (building identity, number formatting, shipment clutter) would make the prototype presentable before adding new systems. Alternatively: **Multi-Product Balance Pass 2** if the Asphalt Contract 18 / Jet Fuel Contract 19 profit/crude concern is deemed urgent.

---

## 2026-06-11 — Multi-Product Phase Closeout

**Method:** Documentation pass. No source changes. Reflects state after Secondary Product Idle UI Pass.

---

### What Shipped — Multi-Product Economy (Phase 1B)

| Task | Description |
|------|-------------|
| Plant Module Foundation Phase A | `ProductKey`, `ProductInventory` types; `productInventory` in `GameState`; save migration defaults via sanitizer |
| Asphalt Prototype | `AsphaltPanel`, 2 one-time contracts (IDs 17, 18), manual batch (×10, ×50), ContractsPanel product badge + getContractRequirement helper |
| Asphalt Balance Pass | Contract 17 asphaltRequired 50→75, reward $3,000→$2,200, maxStorage 200→150 |
| Multi-product Contract Polish | Structured Requires/Reward rows, product badge chips, getContractRequirement helper |
| Multi-product Economy Review | Code-trace analysis; verdict B; found Contract 20 blocking bug (maxStorage 150 < jetFuelRequired 200) |
| Jet Fuel Prototype | `JetFuelPanel`, 2 one-time contracts (IDs 19, 20), manual batch (×25, ×75), ContractsPanel + App.tsx extension |
| Jet Fuel Balance Pass | `JET_FUEL_BALANCE.maxStorage` 150→200, unblocks Contract 20 |
| Secondary Product Idle UI Pass | AsphaltPanel and JetFuelPanel collapse to compact done state when all related contracts are fulfilled; leftover inventory visible if > 0 |

---

### Current Product State

| Product | Unlock | Batch sizes | Max storage | Contracts | One-time? | Post-completion |
|---------|--------|------------|-------------|-----------|-----------|-----------------|
| Gasoline | Level 1 | Auto (1/tick) | Dynamic (builds + research) | 16 | Yes | Continuous auto-loop — always active |
| Asphalt | Level 5 | ×10, ×50 | 150 | 2 (T2 + T3) | Yes | Panel collapses to done state |
| Jet Fuel | Level 7 | ×25, ×75 | 200 | 2 (T3 + T3) | Yes | Panel collapses to done state |
| Lubricants | — | — | — | — | — | Not yet implemented |
| Plastic Pellets | — | — | — | — | — | Not yet implemented |

---

### Economic Summary (profit/crude, base prices, no multipliers)

| Contract | Profit/crude |
|----------|-------------|
| Gasoline T3 best (Contract 16, 1000 gas) | $22 |
| Asphalt Contract 17 (75 asphalt) | $19.3 |
| Asphalt Contract 18 (150 asphalt) | $43.3 |
| Jet Fuel Contract 19 (100 jet fuel) | $35 |
| Jet Fuel Contract 20 (200 jet fuel) | $50 |

Asphalt 18 and Jet Fuel 19 remain 2–3× above gasoline T3. Flagged for Multi-Product Balance Pass 2. Both are one-time, which caps total impact.

---

### Remaining Concerns (Carried Forward)

1. **No repeatable demand for secondary products.** Once all asphalt and jet fuel contracts are done, both panels show the done state and the player has no further reason to produce these products. This is the top design gap in the current multi-product economy.
2. **Secondary product profit/crude is above gasoline T3.** Not a blocking problem (contracts are one-time), but should be reviewed before the next product prototype ships.
3. **No full plant module selection system.** Current implementation is manual-batch buttons per product. The intended long-term design (per-distillation-unit module picker) is documented in `PLANT_MODULE_SYSTEM_DESIGN.md` but not yet implemented.
4. **Lubricants and Plastic Pellets defined in types but not yet playable.**

---

### Recommended Next Tasks

Listed in priority order:

1. **Multi-Product Balance Pass 2** — review Asphalt 18 and Jet Fuel 19 with full multiplier simulation; adjust if needed
2. **Repeatable Secondary Product Demand Design** — documentation/design only; decide on mechanism before implementing
3. **Lubricants Prototype** — follows established pattern; straightforward implementation
4. **Final Web Prototype Polish** — Building Identity Pass, shipment clutter, number formatting
5. **Staff Depth Lite** — hiring tension, visual workers, midgame goal expansion

---

## 2026-06-11 — Multi-Product Economy Review (Code-Based Analysis)

**Method:** Full code trace of all three product systems (gasoline, asphalt, jet fuel), balance tables, contract data, production handlers in App.tsx, ContractsPanel logic, and storage caps. No live session — derived from source and balance constants.

---

### Product Summary

| Product | Unlock | Production | Max Storage | Contracts | Status |
|---------|--------|-----------|-------------|-----------|--------|
| Gasoline | Level 1 | Auto-loop | Variable (builds + research) | 16 (one-time, all tiers) | Primary income |
| Asphalt | Level 5 | Manual batch (×10, ×50) | 150 | 2 (one-time, T2 + T3) | Midgame windfall |
| Jet Fuel | Level 7 | Manual batch (×25, ×75) | 150 | 2 (one-time, T3 + T3) | Late-game windfall + **bug** |

---

### Economic Analysis — Profit per Crude

Revenue and profit calculated at base prices (no multipliers). Crude cost = $10 per unit.

| Contract | Product | Crude consumed | Revenue | Net profit | Profit/crude |
|----------|---------|---------------|---------|-----------|--------------|
| Direct sell | Gasoline | 1 | $18 | $8 | $8 |
| Contract 1 | Gasoline | 20 | $300 | $100 | $5 |
| Contract 3 | Gasoline | 100 | $2,200 | $1,200 | $12 |
| Contract 6 | Gasoline | 500 | $13,000 | $8,000 | $16 |
| Contract 7 | Gasoline | 700 | $21,000 | $14,000 | $20 |
| Contract 16 | Gasoline | 1,000 | $32,000 | $22,000 | $22 |
| Contract 17 | Asphalt | 75 | $2,200 | $1,450 | $19.3 |
| Contract 18 | Asphalt | 150 | $8,000 | $6,500 | $43.3 |
| Contract 19 | Jet Fuel | 100 | $4,500 | $3,500 | $35 |
| Contract 20 | Jet Fuel | 200 | $12,000 | $10,000 | $50 — **UNREACHABLE** |

---

### Critical Bug: Contract 20 is Unreachable

`Contract 20` (Regional Airport Reserve) requires `jetFuelRequired: 200`. `JET_FUEL_BALANCE.maxStorage` is `150`. The player can never accumulate 200 jet fuel. The contract is permanently uncompletable.

Fix options (either works):
- Raise `JET_FUEL_BALANCE.maxStorage` from 150 → 200 (or higher)
- Lower `Contract 20.jetFuelRequired` from 200 → 150

The contract appears in the Tier 3 contract list at Level 9 with a $12,000 reward. Players who see it and cannot fulfill it despite having max jet fuel will have no way to understand why the button remains disabled.

---

### Decision Quality Assessment

**Gasoline vs. Asphalt (Level 5–7):**

Real decision exists. Diverting 75 crude to Asphalt Contract 17 means 75 fewer gasoline units in the auto-loop. At Level 5, crude is still somewhat constrained. The player must consciously pause accumulation for a gasoline contract to fulfill the asphalt batch. Decision quality: **adequate.**

**Gasoline vs. Jet Fuel (Level 7):**

Stronger tension. At Level 7, players are likely targeting Contract 6 (500 gasoline) or Contract 7 (700 gasoline). Diverting 100 crude to Jet Fuel Contract 19 delays a large gasoline contract by a meaningful amount. The $4,500 jet fuel reward vs. ~$1,600 equivalent gasoline value (100 gasoline × $16/crude) creates a genuine trade-off calculation. Decision quality: **good.**

**Asphalt Contract 18 vs. Jet Fuel Contract 19 (both Level 7):**

A player at Level 7 who still has Asphalt Contract 18 open faces: 150 crude for $8,000 asphalt, or 100 crude for $4,500 jet fuel, or hold for gasoline T3. This is the most strategically interesting moment in the current multi-product economy. All three options are plausible. Decision quality: **best in the game right now.**

---

### Questions Answered

**1. Does each product have a purpose?**

- Gasoline: Yes. Continuous auto-production, primary income, all 16 main contracts.
- Asphalt: Yes, but time-limited. Two contracts provide meaningful midgame income spikes, then the panel goes idle.
- Jet Fuel: Partially. Contract 19 works. Contract 20 is unreachable due to the storage cap bug.

**2. Is one product dominant?**

Yes — Gasoline. By design: auto-production, 16 contracts, continuous income. Asphalt and Jet Fuel are intentional sidequests, not alternatives to gasoline. The dominance is structurally correct but the gap widens after secondary contract completion (both panels become idle while gasoline continues).

**3. Is one product ignored?**

Both Asphalt and Jet Fuel become ignored after their one-time contracts complete. The AsphaltPanel and JetFuelPanel persist with no gameplay purpose. A player who reaches Level 9 with all secondary contracts done has two visible panels with active buttons that produce something with no demand. This creates mild confusion.

**4. Are contracts balanced relative to effort?**

- Contract 17 (Asphalt, $19.3/crude): Reasonable. Comparable to gasoline T3 range.
- Contract 18 (Asphalt, $43.3/crude): High. Acceptable as one-time late-game contract at Level 7, but 2× above gasoline T3.
- Contract 19 (Jet Fuel, $35/crude): High. Same single-occurrence caveat. Slightly below asphalt 18.
- Contract 20 (Jet Fuel, $50/crude): Would be highest in the game — but unreachable.

Secondary contracts reward more per crude than gasoline at every tier. This is by design (the player sacrifices auto-loop continuity for the manual batch). The delta is tolerable given one-time nature. Contract 18 remains the most generous, but is capped by its one-time status.

**5. Does product choice create meaningful decisions?**

Yes — at Level 7, the three-way crude allocation (gasoline T3 vs. asphalt 18 vs. jet fuel 19) is the most strategic moment in the current game. Before and after that window, decisions are less interesting (pre-Level 7 = no jet fuel; post-completion = no secondary demand).

**6. Is progression better than gasoline-only gameplay?**

Yes. Level 5 and Level 7 now have notable unlock moments that break the monotony of "wait for gasoline." The crude competition at Level 7 is genuine. Secondary products are well-placed as mid-game variety rather than replacements.

---

### Verdict

**B — Product economy needs a balance pass.**

The core trio is structurally sound. The unlock pacing, crude competition window, and contract tier placement are all working as intended. The decision quality at Level 7 is the best in the game.

However: Contract 20 is a blocking bug that makes one quarter of jet fuel contracts permanently uncompletable. This must be fixed before the product expansion can be considered finished.

Secondary: the "complete and forget" pattern for both Asphalt and Jet Fuel panels is a documented limitation. It is not a redesign problem — it is a future feature gap (no repeatable contracts or alternate uses for secondary products after one-time contracts are done).

---

### Top 3 Strengths

1. **Level 7 crude allocation decision is the best strategic moment in the game.** Asphalt 18 + Jet Fuel 19 + gasoline T3 contracts all compete for crude simultaneously, creating genuine player agency.
2. **Unlock pacing is well-spaced.** Level 1 (gasoline) → Level 5 (asphalt) → Level 7 (jet fuel) gives the player new decisions without overwhelming early gameplay.
3. **Product UI is clear.** Product badges, structured Requires/Reward rows, and disabled button labels (e.g. "Need 40 more jet fuel") remove ambiguity about what each contract wants and why the button is disabled.

---

### Top 3 Weaknesses

1. **Contract 20 is unreachable.** `jetFuelRequired: 200` exceeds `maxStorage: 150`. The contract appears on screen with a large reward visible and no way to ever complete it. This is a bug, not a design choice.
2. **Both secondary panels become idle after contract completion.** No repeatable demand, no sell mechanic, no alternate use. AsphaltPanel and JetFuelPanel become visual noise after Level 7 if both sets of contracts are done.
3. **Asphalt Contract 18 profit/crude ($43.3) and Jet Fuel Contract 19 profit/crude ($35) are 2–3× above gasoline T3 equivalents.** Both are one-time and late-game, which softens the impact. But a player who optimizes for secondary products first will find gasoline mid-game significantly easier than intended.

---

### Recommended Next Task

**Jet Fuel Balance Pass** — one targeted fix:

1. Raise `JET_FUEL_BALANCE.maxStorage` from 150 → 200 (or lower `Contract 20.jetFuelRequired` from 200 → 150). Either unblocks Contract 20.

Optional in same pass: review Contract 18 and Contract 19 profit/crude ratios if the high delta vs. gasoline is judged to be a real player-experience problem.

No new contracts, no new products, no save schema changes.

---

## 2026-06-11 — Asphalt Gameplay Review (Code-Based Analysis)

**Method:** Full code trace of asphalt production logic, balance constants, contract table, and App.tsx handlers. Simulated player experience from Level 5 unlock through both asphalt contract completions.

---

### Asphalt System State

- Production: manual button, 10 or 50 crude → 10 or 50 asphalt per click. No auto-loop.
- Storage: max 200 asphalt.
- Contracts: 2 total, both one-time completions.
  - Contract 17 Road Repair Supplier: 50 asphalt, $3,000 + 12 RP + 20 rep. Unlocks Level 5.
  - Contract 18 Airport Runway Project: 150 asphalt, $8,000 + 30 RP + 40 rep. Unlocks Level 7.
- UX: AsphaltPanel with locked state, inventory display, crude-available counter, hint about shared crude supply. Contract badge clearly marks asphalt contracts.

---

### Economic Analysis

Revenue per crude unit across all player options at Level 5:

| Option | Crude cost | Revenue | Net profit/crude |
|--------|-----------|---------|-----------------|
| Gasoline (direct sell, base price) | $10 | $18 | $8 |
| Gasoline T2 contract (best case, Contract 13) | $3,800 | $8,000 | $11.1 |
| Gasoline T3 contract (Contract 6, 500 gas) | $5,000 | $13,000 | $16 |
| **Asphalt Contract 17** | **$500** | **$3,000** | **$50** |
| **Asphalt Contract 18** | **$1,500** | **$8,000** | **$43.3** |

Asphalt returns 3–6× more profit per crude than any gasoline option. The RP and reputation rewards are proportionate and not out of line.

---

### Decision Quality

**Contract 17 (Road Repair Supplier — 50 asphalt):**

The decision is not a real decision. At Level 5 the player has significant crude storage (base 10 + research + buildings = 100–300 crude cap). The large batch button converts 50 crude to 50 asphalt in one click. Then the player clicks Fulfill. Total interaction: 2 clicks. Total time: under 5 seconds. The reward ($3,000) at this stage is one of the best single payoffs in the game. There is no meaningful trade-off.

The crude competition hint in the panel is accurate — asphalt does share crude with gasoline — but because the batch is so small relative to typical crude reserves, the player does not feel the competition. They just do both.

**Contract 18 (Airport Runway Project — 150 asphalt):**

This one has more weight. 150 crude is meaningful at Level 7. The player needs to make 3 large-batch clicks and wait for their crude to refill between sessions (or accept that the auto-gasoline loop slows during accumulation). The $8,000 reward is strong but not wildly out of proportion for Level 7. RP (30) and reputation (40) are solid but not dominant.

---

### Crude Competition Assessment

The asphalt panel hint ("Asphalt uses crude from the same supply as gasoline") is accurate but the tension is low in practice for contract 17 because 50 crude is a small ask at Level 5. For contract 18, the tension becomes real: 150 crude held in asphalt storage is 150 crude not flowing into the gasoline auto-loop, which delays contract fulfillment and production income. This is the better-designed of the two contracts.

---

### UX Clarity

**Panel:** Clear. Locked state communicates the Level 5 gate. Batch buttons (×10, ×50) are appropriately sized. Crude-available display and shared-supply hint are useful. No confusion about what the buttons do.

**Contracts panel:** The ASPHALT badge distinguishes asphalt contracts from gasoline contracts at a glance. Structured "Requires / Reward" rows are readable. Button label "Need 30 more asphalt" is specific and actionable.

**No UX problems identified.**

---

### Verdict

**B — Asphalt needs a small balance pass.**

Asphalt is not ignored (reward is too good to ignore) and not dominant (contracts are one-time, total windfall is capped at $11,000). However, contract 17 completes too easily and too profitably to feel like a real strategic choice. It currently functions as a free $3,000 bonus rather than a meaningful new production decision.

Contract 18 is close to healthy. The crude investment (150) creates genuine tension. The reward ($8,000) is attractive but not broken.

**Specific finding:** Contract 17's reward/crude ratio ($50 profit/crude) is 3–6× above any gasoline path. At minimum the crude requirement should be raised, the reward lowered slightly, or both — enough that the player pauses before committing.

---

### Top 3 Issues

1. **Contract 17 is a free $3,000.** One large-batch click at Level 5 fulfills it. No real decision. No felt crude competition. Raise asphalt requirement from 50 → 75 or lower reward from $3,000 → $2,000.
2. **No ongoing asphalt income.** Once contracts 17 and 18 are done, asphalt disappears from the game. Players who reach Level 7 post-completion have an idle AsphaltPanel with no purpose. A third contract or a repeatable small-batch sell would help.
3. **Asphalt max storage (200) is well above both contract requirements.** The cap doesn't create pressure. A tighter cap (e.g. 150) would make contract 18 (which needs exactly 150) feel like a deliberate fill-to-completion run rather than incidental accumulation.

---

### Recommended Next Task

**Asphalt Balance Pass** — small numeric adjustments only:

1. Contract 17: raise `asphaltRequired` from 50 → 75 (still completes in 2 clicks of ×50 — but costs more crude).
2. Contract 17: lower reward from $3,000 → $2,200 (brings $/crude closer to gasoline T3 contract range).
3. `maxStorage`: 200 → 150 (cap matches contract 18's requirement; makes accumulation feel intentional).

No new contracts, no new products, no save schema changes.

---

## 2026-06-11 — Phase 2A Closeout Review (Code-Based Analysis)

**Method:** Code trace after Balance Pass 2, Worker Feedback Pass, Polish Pass 1, Research Expansion Lite, and Balance Pass 3. No source changes in this review — documentation only.

---

### What Shipped Since Vertical Slice Review

- **Balance Pass 2 — Onboarding Fix:** Base crude storage raised 4 → 10; base gasoline storage raised 4 → 20. Starter Guide step order corrected (Produce Gasoline listed first, Buy Crude second). Explicit storage hint added below the checklist.
- **Worker Feedback Pass:** WorkforcePanel and StaffPanel now display computed active bonus text per worker type (e.g. "+10% production", "+25 crude/gasoline storage"). Bonuses are derived directly from `BONUS_BALANCE` constants × hire count, computed at render time with no new props.
- **Polish Pass 1 — UI Clarity:** Disabled buy/sell buttons now show reason text ("Tank Full" / "No Funds" / "Nothing to Sell"). Contract tier grouping added (Tier 1 / 2 / 3 sections with headings in ContractsPanel). "In Progress" milestone badge removed — completed badge only. Event trigger buttons moved to DevToolsPanel, cleanly separated from gameplay UI.
- **Research Expansion Lite:** 4 new research items added (`advancedProcessing`, `storageOptimization`, `contractAnalytics`, `saferOperations`). Research tree extended to 10 items, 775 RP total. Prerequisite chains preserved; no save schema changes.
- **Balance Pass 3:** `storageOptimizationBonus` 100 → 75; `contractAnalyticsRpBonusRate` 0.15 → 0.20.

---

### Resolution of Top 3 Problems (from Vertical Slice Review)

**Problem 1 — Storage cliff kills onboarding: RESOLVED**
Base crude storage (4 → 10) and base gasoline storage (4 → 20) let the player start producing and complete Contract 1 without buying any storage buildings first. Starter Guide step order and hint now correctly guide new players.

**Problem 2 — Research exhausted too fast: RESOLVED**
4 new research items extend the tree to 775 RP. Late-game players have meaningful RP sinks through Tier 3 contracts. System stays relevant until endgame.

**Problem 3 — Worker effects invisible: RESOLVED**
WorkforcePanel and StaffPanel now display computed bonus text for every worker type with at least one hire. Players can see exactly what each hire contributes without needing to monitor the StatsPanel.

---

### Updated System Ratings

| System | Previous Score | Current Score | Change Notes |
|--------|---------------|---------------|--------------|
| Workers | 2/5 | 3/5 | Bonus text now visible. Hiring tension and visual activity still absent. |
| Research | 2/5 | 3/5 | 10 items, 775 RP — relevant through late game. Will feel shallow again once product expansion ships. |
| UI | 3/5 | 4/5 | Disabled-reason labels, contract tier grouping, and milestone badge cleanup all reduce confusion meaningfully. |

---

### Remaining Concerns After Phase 2A

- Workers still have no hiring cap — players hire as many as they can afford with no strategic tension.
- Building grid is still text-only — hard to parse at 4×4 and 5×5.
- Midgame waiting window (between Tier 1 and Tier 2 completion) is unchanged — no new short-term goals added.
- Research tree will need expansion again once Product Expansion ships (new module unlocks will need new research items).
- Win condition (Level 10 + $100k expansion) is unchanged — no new late-game hook beyond reaching it faster.

---

## 2026-06-11 — Vertical Slice Review (Code-Based Analysis)

**Method:** Full code trace covering all balance values, production formulas, contract tables, event tables, milestone conditions, and UI layout. No Dev Tools. Simulated a fresh save from Level 1 through theoretical win condition.

**Reviewer note:** This is a structured analysis playtest, not a live session. All observations are derived from reading source code, balance tables, and game flow logic.

---

### Starting State Analysis

**What the player has at second 0:**
- $200
- 5 crude oil (but max storage is only 4 — player starts over their own cap)
- 0 gasoline (max 4)
- 9-cell grid (3×3), all empty
- Refinery Level 1 → 1 gasoline/second
- No buildings, no workers, no research

**First hard finding: the storage cliff**

The player starts with 5 crude but their maximum crude storage is 4. This means the very first action the game logically suggests — "buy more crude" — is impossible until they burn 2 crude first. The instant-buy buttons are silently disabled with no explanation.

After processing, the player discovers that gasoline storage is also 4. Contract 1 requires 20 gasoline. **The player cannot complete Contract 1 without first buying a Product Tank ($30)**. The Product Tank increases gasoline storage to 29 (4 + 25), which enables accumulation.

The Starter Guide currently lists three steps: "Buy Crude → Produce Gasoline → Complete a Contract." It does not mention "Buy a storage building first."

This is the single most important friction point in the current prototype.

---

### Early Game (Levels 1–2, first ~10 minutes)

**What happens:**
1. Player processes 4 gasoline from starting crude (5th crude cannot be processed — tank full)
2. Player discovers they cannot buy more crude OR produce more without first selling
3. Player discovers they cannot reach 20 gasoline without buying a Product Tank
4. Player buys a Product Tank ($30 → $170 left)
5. Player begins the crude→gasoline cycle: buy crude, process, repeat until 20 gasoline
6. Complete Contract 1 (+$300, +2 RP, +3 rep)
7. Economy opens up; player can now upgrade refinery ($90 is very cheap) and build more

**Observations:**

- The starter guide step order is wrong. "Produce gasoline" must come before "buy a building to store gasoline" is even possible. The guide should hint at the storage problem explicitly.
- Refinery upgrade costs are extremely cheap (Level 1→2 = $90, starting money $200). Players can and should spam upgrades early. This is fine but doesn't feel like a decision.
- The instant-buy crude buttons and the shipment panel coexist. At this stage, shipments (50 crude for $450, 15 seconds ETA) are better value per unit ($9) than instant buy ($10), but the 15-second wait feels wrong when the player only has a 4-unit crude tank. The smallest shipment (50 crude) has no value if storage is tiny.
- Building adjacency combos exist but are hidden below the grid in the ComboPanel. Players won't know about them unless they scroll down.

**Early Game Score: 2/5**
The production loop is satisfying once running, but the storage wall creates unnecessary confusion that a new player would abandon at.

---

### Mid Game (Levels 3–5, roughly 15–35 minutes)

**What happens:**
- Tier 2 contracts unlock at Level 3 (150–380 gasoline required)
- Player expands grid with crude tanks and product tanks
- Research becomes available (betterPumps 10 RP, biggerTanks 20 RP)
- First grid expansion ($25,000) unlocks at Level 5
- Workers Tier 2 unlock at Level 3 (Safety Officer, Chemist)

**Observations:**

- Between completing Tier 1 contracts and building up to Tier 2, there is a meaningful slow period. The loop is: produce, wait, sell, buy crude, repeat. Without active decisions to make, this window feels like a waiting room.
- The 12 milestones provide short-term goals, but several early milestones (firstFuel, smallSupplier, growingRefinery) fire very close together in the first minutes. Then there's a gap before midgame milestones.
- Tier 2 contracts require 150–380 gasoline. Building enough storage for 380 gasoline in a 3×3 grid requires smart use of the available 9 cells. This is the best strategic tension in the game.
- The first grid expansion ($25,000) is a real money gate that drives players to complete multiple Tier 2 contracts. Good design.
- Choice events fire every 60 seconds. They are the highlights of the mid-game. However, some choices are too clearly dominant (Rush Order B: sell quickly for rep — almost always correct). Occasionally two options feel genuinely equal (equipmentEmergency, investorVisit).
- Workers: hired operators and mechanics have measurable but invisible effects. You notice your production number changed but not why.

**Mid Game Score: 3/5**
The building puzzle is good. Choice events help. But the waiting periods with no active decision-making drag.

---

### Late Game (Levels 5–10, roughly 35–60+ minutes)

**What happens:**
- Tier 3 contracts unlock at Level 5 (500–1000 gasoline each)
- Grid expansion to 4×4 available ($25,000, Level 5)
- Laboratory ($2,000, Level 4), Maintenance Workshop ($2,500, Level 6), Sales Office ($3,000, Level 7) buildings become available
- Research Tier 2 unlocks (advancedDistillation, industrialStorage, premiumContracts)
- Win condition requires: Level 10 + 250 reputation + Contract 7 completed + grid expansion to 5×5

**Observations:**

- **The $100,000 win gate dominates everything.** Grid expansion to 5×5 costs $100,000 and requires Level 10. Getting there requires completing a significant portion of Tier 3 contracts. This is the late game in practice: produce enough gasoline for large tier-3 contracts repeatedly.
- Contract 7 (700 gasoline required) is the hardest single content requirement. With a full 3×3 grid of storage buildings and research, storage can reach approximately 300–450 gasoline, requiring multiple production cycles to fill.
- Reputation 250 is reachable before tier 3. All tier 1 contracts (47 rep) + all tier 2 contracts (182 rep) = 229 rep. Add milestone rewards (smallSupplier +10, growingRefinery +15, researchBeginner +20, refineryLevel5 +20) = 294 rep total — the reputation gate clears without tier 3 content.
- This means the reputation gate is not actually the bottleneck — it's the money and the gasoline volume.
- Advanced buildings (Lab, Workshop, Sales Office) are expensive but opaque. A player who doesn't know that Premium Contracts research exists may not understand why building a Sales Office matters. The benefit chain (Sales Office → unlock contracts research → +20% contract rewards) is not clearly surfaced.
- Workers Tier 3 (Logistics Coordinator, $2,000, Level 5) provides a shipment bonus but the benefit is percentage-based on an already-cheap shipment. At late game scales it matters more but it's hard to feel.
- The production rate at minimum interval (250ms) with multiple distillation units and research bonuses makes the late game feel fast. But waiting for 700 gasoline to accumulate is still passive.

**Late Game Score: 3/5**
Clear money progression toward the win gate. Production feels fast and satisfying. But the game is functionally "wait for gasoline" with less strategic decision-making than mid-game.

---

### System Reviews

| System | Score | Notes |
|--------|-------|-------|
| Buildings | 4/5 | Good variety, adjacency combos add depth, building upgrade path (Lv1–3) is meaningful. Visual identity is still text-only — hard to read a full grid at a glance. |
| Workers | 2/5 | Bonuses apply correctly but nothing tells the player their production just increased. WorkerPresenceBar helps presence but not legibility of effects. No strategic tension (hire as many as you can afford). |
| Contracts | 4/5 | Clear three-tier progression, escalating requirements that naturally gate content. The 16 contracts give good variety. Contracts are the heart of the game. |
| Events | 4/5 | 14 events at 30-second intervals create good variety. Severity is appropriate — negative events are annoying but not devastating. The safety inspection (rep-gated pass/fail) is elegant design. |
| Choice Events | 3/5 | 12 events, fires every 60 seconds. Interesting concept. Some events have a clearly dominant option (Rush Order B is almost always correct). The best ones (equipmentEmergency) feel genuinely balanced. |
| Research | 2/5 | Only 6 items. Cheap to unlock even in mid-game. Two prerequisite chains, but shallow. Research feels exhausted well before the late game. After unlocking all 6, the system vanishes from the player's mental model. |
| Shipments | 3/5 | Good design — always cheaper per unit than instant buy. ETA and cost-per-unit display works well. But the 3 instant-buy buttons still sit prominently alongside shipments, creating dual-system confusion. Logistics Coordinator effect is invisible without doing the math. |
| Goals | 3/5 | The GoalPanel (win condition tracking) and MilestonesPanel (12 individual milestones) overlap in purpose. The player is shown two separate "things to achieve" lists. Milestones fire quickly in the early game and then slow down noticeably. |
| UI | 3/5 | Bilingual text renders cleanly. Sticky resource bar is effective. Panel ordering (Production → Stats → Combos → Progression → Buildings → Contracts → Research → Staff → Milestones) is logical but very tall. The page requires significant scrolling to get from production to contracts. |

---

### Top 3 Problems

**1. Storage cliff kills onboarding**

Players start with 5 crude and 4 max crude storage. Cannot buy more crude. Cannot accumulate 20 gasoline for Contract 1 without first purchasing a Product Tank. The Starter Guide does not surface this. A new player's first experience is "I clicked Buy Crude and nothing happened" followed by "I pressed Sell but now I have no gasoline" without understanding that storage is the constraint.

**Recommendation:** Either bump base gasoline storage to 15–20, or make the Starter Guide explicitly say "First: buy a Product Tank to store gasoline."

---

**2. Research is exhausted too fast — the system disappears**

Six research items at 10–100 RP each. By the time the player reaches tier 3 contracts, they likely have 100+ RP from labs and contract rewards, enough to unlock all 6 items. Once done, the Research Panel becomes dead UI. The research tree doesn't grow with the player.

**Recommendation:** Consider 2–3 more research items at Tier 3 depth (Level 7+, 150–200 RP cost). This keeps the panel alive longer and gives late-game players a meaningful RP sink.

---

**3. Worker system effects are invisible**

Hiring an Operator costs $500 and gives +10% production. But nothing in the UI says "production just increased." The production rate number changes in StatsPanel but most players won't see it. Hiring feels like "spend money and trust that it helped." The game has a WorkerPresenceBar showing emoji tokens, which is a step forward for presence — but it doesn't communicate what each worker is doing.

**Recommendation:** On hire, flash a +X% production callout next to the production rate in StatsPanel. Or display per-worker bonus in the StaffPanel alongside the "Hired ×N" count.

---

### Top 3 Strengths

**1. Contracts are the backbone of the game and they work**

Three tiers, 16 total contracts, escalating gasoline requirements, natural reputation gating — the contract system creates the clearest sense of progression in the game. The player always has an obvious next target. Tier 2 to Tier 3 jump (380 → 500 gasoline) is appropriately significant. This system is the closest thing the prototype has to a "fun loop."

**2. Event variety keeps sessions fresh**

14 random events at 30-second intervals with appropriate positive/negative ratios. The safety inspection (rep-gated pass or fail) is elegant: it rewards players who have been building reputation and penalizes those who haven't. Choice events at 60-second intervals create brief but genuine decision moments.

**3. Building grid has real strategic depth**

Nine cells (or 16/25 post-expansion) with six building types and adjacency combo bonuses. Optimizing a grid for a specific strategy (storage vs. production vs. sell price) creates real tradeoffs. Upgrading individual buildings to Lv3 adds a second layer of grid decision-making. This is the most Kairosoft-feeling part of the current prototype.

---

### Highest-Impact Future Improvement

Fix the early game storage cliff (Problem 1 above). It is the single change most likely to improve the new player experience and reduce early abandonment. Everything else the game does is good enough to be engaging — the player just needs to survive long enough to discover it.

Second priority: extend the research tree. The drop from "active research system" to "nothing left to unlock" happens too abruptly.

---

### Recommended Next Implementation Task

**Balance Pass 2 — Onboarding and Early Storage**

Targets:
- Increase base gasoline storage from 4 to 15–20 (or give the player a free product tank)
- Add explicit "buy a storage building" step to the Starter Guide
- Review the starting crude situation (starting with 5 in a cap of 4 is confusing)

This is low-risk (no new systems, no save migration required) and highest-impact.

---

## 2026-06-06 — Post Content Expansion + Balance Pass 1

### What Was Shipped Since Last Notes

- More random events (14 total: market spikes, safety inspections, worker suggestions, storage contamination, community visits, etc.)
- More choice events (12 total: investor visits, rush orders, equipment emergencies, community complaints, etc.)
- Staff tier grouping in StaffPanel (Tier 1/2/3 visual sections with locked state)
- Building upgrade depth (Lab, Workshop, Sales Office are now upgradeable Lv1–3)
- More contract variety (16 contracts across 3 tiers)
- Shipment System Phase 2 Lite (5 shipment sizes, ETA formatting, cost-per-unit, logistics bonus display, low-capacity warning)
- Balance Pass 1 (starting resources, safety penalty, building upgrade costs, T2 contract reputation, choice event tradeoffs)

### Observations

- Early game feels less punishing after starting money ($200) and crude (5) bump.
- Building upgrades are now a reachable mid-game goal (Lv2 at $3,500 instead of $5,000).
- 14 random events give good variety; negative events are roughly 20–25% of occurrences.
- Choice events feel like real decisions now — supplierNegotiation A is no longer free crude.
- Reputation progression is faster via T2 contracts (182 total rep from all T2 vs 154 before).
- Workers still feel somewhat passive — effects are invisible unless you watch numbers.
- Shipment panel is clearer with cost-per-unit and logistics bonus shown.
- Tier 3 contracts (500–1000 gasoline) require significant storage optimization to complete.

### Open Questions

- Should workers have visible activity or personality?
- Should buildings have icons to make the grid feel more alive?
- Is there a meaningful mid-game goal between first T2 contract and win condition?
- Should the shipment panel replace or reduce the instant-buy buttons eventually?

---

## 2026-06-05 — Original Notes

### Observations

- Reputation progression felt too slow.
- Tier 3 took around 20–30 minutes.
- Buying crude one-by-one was annoying.
- Selling gasoline one-by-one was annoying.
- Workers felt invisible.
- Storage progression was too small.

### Actions Taken

- Added bulk crude buying.
- Added bulk gasoline selling.
- Added workforce summary.
- Increased storage scaling.
