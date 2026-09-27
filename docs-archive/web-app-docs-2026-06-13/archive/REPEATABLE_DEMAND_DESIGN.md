> **ARCHIVED — fully implemented.** This was a pre-implementation design
> proposal (2026-06-11). Everything proposed here shipped in later passes —
> see GAME_DESIGN.md for the current system, ROADMAP.md / PLAYTEST_NOTES.md
> for what was actually built and any deviations. Kept for historical design
> rationale only; do not treat the "Status: Design only / not implemented"
> notes below as current.

---

# Repeatable Secondary Product Demand — Design Document

**Author:** Design session, 2026-06-11
**Status:** Design only. Nothing in this document has been implemented.

> Do not implement any part of this system until it is explicitly promoted to CURRENT_TASK.md.

---

## Problem Statement

Gasoline has infinite demand: players can always sell gasoline for a fixed price per unit via the sell buttons in the production panel. This makes gasoline perpetually useful.

Asphalt and Jet Fuel currently have finite demand: two one-time contracts each. Once those contracts are fulfilled, both panels enter a "done" state. The player has no further reason to produce secondary products. The panels persist as visual reminders that the game had more to offer earlier.

This creates an asymmetry that was documented in the Multi-Product Economy Review (verdict B):

> "Both Asphalt and Jet Fuel become ignored after their one-time contracts complete. The panels persist with no gameplay purpose."

---

## Design Constraints

- Kairosoft-style: simple mechanics, clear rewards, minimal UI overhead
- Mobile-friendly: no small text, no dense tables, no nested menus
- Easy to explain: a player should understand the new mechanic in under 10 seconds
- Minimal implementation cost: prefer patterns already in the codebase
- No new products, no new buildings, no full module system
- Preserve save compatibility via the sanitizer pattern

---

## Options Evaluated

### Option A — Standing Orders

A standing order is a persistent contract card representing an ongoing buyer relationship. The buyer always wants the same product on a recurring schedule. Once fulfilled, the card enters a cooldown ("Restocking…") and then becomes available again automatically.

**How it works:**
- Standing order cards appear in the ContractsPanel below one-time contracts, in a clearly labelled "Standing Orders" section
- Each card shows: product badge, buyer name, required amount, reward, and either a "Fulfill" button (when product is sufficient) or a cooldown countdown ("Restocking — 3m 20s")
- Fulfillment is always player-initiated (same as normal contracts)
- After fulfillment, the order goes on cooldown for N minutes, then automatically resets
- No expiration: if the player doesn't fulfill, the order waits indefinitely

**State required:**
- `standingOrderCooldowns: Record<StandingOrderKey, number>` — maps order key to the game tick when it next becomes available
- Default: `{}` (all orders available from unlock, before first fulfillment)
- Added via `sanitizeLoadedGameState` with empty object default — zero breaking for existing saves

**UI impact:**
- One new section heading in ContractsPanel ("Standing Orders")
- Standing order cards visually identical to existing contract cards but with a countdown display instead of a "Locked" or "Completed" state

**Balance impact:**
- Per-fulfillment rewards must be lower than one-time contracts per crude (ongoing income should feel like maintenance revenue, not a windfall)
- Cooldown prevents trivial farming — player must wait before fulfilling again
- Crude cost pressure is real: each fulfillment still diverts crude from gasoline

**Player clarity:**
High. The card is always visible. The countdown communicates exactly when it resets. The fulfillment mechanic is identical to what the player already knows.

---

### Option B — Market Buyers (Spot Sell)

A sell button appears in AsphaltPanel and JetFuelPanel, similar to the gasoline sell buttons in the production panel. Players sell any amount of secondary product at a fixed market price, with no minimum and no cooldown.

**How it works:**
- Two buttons added to each secondary product panel: "Sell 10" and "Sell 50" (or similar)
- Price is fixed, lower than equivalent contract rewards per unit
- No state needed: instantaneous transaction like gasoline sell

**State required:**
- None

**UI impact:**
- Buttons added to AsphaltPanel and JetFuelPanel panels
- Minimal: same visual pattern as existing sell buttons

**Balance impact:**
- If price is too high: secondary products become an alternative income stream on par with gasoline, reducing the purpose of one-time contracts
- If price is too low: nobody uses it, problem unsolved
- No cooldown means players can spam-sell whenever they have product — removes all tension from crude allocation

**Player clarity:**
High for the mechanic, but low for the motivation. A sell button has no narrative. It doesn't explain why someone wants asphalt or jet fuel, or what they're doing with it. It makes secondary products feel like a commodity market rather than a refinery with customer relationships.

---

### Option C — Export Contracts (Repeatable with Cooldown)

Repeatable contract cards that function identically to existing one-time contracts, except they reset after a cooldown once fulfilled. The contract re-appears in the ContractsPanel and can be fulfilled again.

**How it works:**
- A new set of "Export" contract entries in the contract data, flagged as repeatable
- After fulfillment, instead of being marked `isCompleted: true`, the contract enters a cooldown state
- When the cooldown expires, the contract becomes available again

**State required:**
- `repeatableContractCooldowns: Record<number, number>` — maps contract ID to available tick
- Added via sanitizer — zero breaking for existing saves
- Visually: same contract cards, but "Completed" state replaced by "Restocking — Xm Ys"

**UI impact:**
- Minor change to ContractsPanel: handle a third contract state (cooldown) alongside locked/completed
- No new section needed if export contracts coexist in the same tier groups as one-time contracts

**Balance impact:**
- Similar to standing orders, but cooldown is per-contract-ID rather than per-order-key
- Contract variety can grow without a dedicated standing order system

**Player clarity:**
Medium. The mechanic is familiar (same as existing contracts), but the concept of "a contract that resets" is slightly counterintuitive given that all existing contracts are permanent one-time completions. Players may not immediately understand why a "completed" contract is re-appearing.

---

### Option D — Hybrid (Spot Sell + Standing Order)

Combine Option B (spot sell at a low market price) with Option A (standing order at a higher reward), giving players two outlet channels for secondary products.

**How it works:**
- Spot sell buttons in the secondary panels for immediate but low-value liquidation
- Standing orders in ContractsPanel for patient players who wait for a better rate

**State required:**
- Same as Option A (`standingOrderCooldowns`)

**UI impact:**
- Buttons in secondary panels (Option B)
- New section in ContractsPanel (Option A)
- More surface area than either option alone

**Balance impact:**
- Two competing rewards for the same product creates interesting player choice ("sell now at $15/unit or hold for the standing order at $22/unit?")
- Risk: if both outlets are visible, the game must explain both. Two mechanics means twice the explanation burden.

**Player clarity:**
Medium. Two channels for the same product adds a decision but also adds cognitive overhead. In Kairosoft games, simplicity wins over depth at the mechanics layer. Depth comes from the combination of simple systems, not from any single system being complex.

---

## Comparison Matrix

| Criterion | Option A — Standing Orders | Option B — Market Buyers | Option C — Export Contracts | Option D — Hybrid |
|-----------|---------------------------|-------------------------|----------------------------|-------------------|
| Complexity | Low | Very Low | Low | Medium |
| UI impact | One new section, countdown display | Two buttons per secondary panel | Minor ContractsPanel change | Both A + B |
| Save impact | One new field (default `{}`) | Zero | One new field (default `{}`) | One new field |
| Balance impact | Medium (cooldown controls rate) | High (unconstrained) | Medium (cooldown controls rate) | Medium-High |
| Player clarity | High (persistent visible card) | High (familiar button) | Medium (repeating "completed" is confusing) | Medium |
| Kairosoft fit | High (relationship flavor) | Low (no narrative) | Medium | Medium |
| Implementation cost | Low | Very Low | Low | Low-Medium |

---

## Recommendation: Option A — Standing Orders

**Standing orders are the right solution for Refinery Story.**

### Why Option A wins

**1. It explains itself through narrative.**

A standing order card that says "City Road Maintenance Bureau — needs 40 asphalt every 3 minutes" tells a story. The player is a refinery with a real customer. The customer restocks regularly. This is the Kairosoft core loop: your business serves clients. Option B is just a number on a button. Option A has a buyer name, a product badge, a cooldown countdown, and a reward — it feels alive.

**2. It fits the existing ContractsPanel without structural change.**

The ContractsPanel already renders contract cards with product badges, Requires/Reward rows, and action buttons. A standing order card is the same UI with one added state (cooldown countdown). No new panel is needed. No new component is needed. The implementation extends what already exists.

**3. Cooldown creates pacing.**

A standing order that resets every 3 minutes rewards players who produce asphalt regularly. It does not reward players who spam-produce to fill the order instantly — because the next cycle doesn't start until the cooldown ends. This creates the right rhythm: produce asphalt, fulfill order, wait, produce again. It mirrors the feel of the gasoline auto-loop without being identical to it.

**4. It stays out of the way when not relevant.**

A player who hasn't unlocked asphalt never sees the asphalt standing order. A player who has unlocked asphalt sees a persistent, fulfillable card that rewards engagement without requiring it. The "Restocking" countdown communicates the wait without blocking the rest of the game.

**5. It solves the idle panel problem without eliminating the done state.**

After all one-time asphalt contracts are complete, the AsphaltPanel shows the compact done state. The standing order lives in ContractsPanel and provides ongoing motivation to produce asphalt. The player doesn't need to keep checking the AsphaltPanel — they see the standing order in the contracts list and know when to produce.

### Why Option B was rejected

Market buyers make secondary products feel like commodities. Gasoline already has a sell mechanic. Adding sell buttons to Asphalt and Jet Fuel makes them "worse gasoline" rather than distinct products. The lack of a cooldown or minimum means the tension that makes crude allocation interesting disappears — the player sells whatever they have whenever they produce it, with no strategic consideration. Standing orders preserve the "build toward a goal" feeling that makes contract fulfillment satisfying.

### Why Option C was rejected

Export contracts that reset are mechanically similar to standing orders but communicate less clearly. A contract card that says "Completed" and then reappears is counterintuitive — all existing contracts are permanent. Players will be confused about why this one came back. Standing orders, by contrast, have a dedicated cooldown state ("Restocking") that communicates "this is designed to repeat" without any confusion.

### Why Option D was rejected

Hybrid adds two channels where one is sufficient. In Kairosoft games, the depth comes from combinations of systems, not from any single system having multiple sub-modes. A spot-sell button plus a standing order for the same product is two explanations, two balance targets, and two UI elements for a problem that one solution solves cleanly.

---

## Proposed Standing Order Design

### Standing Order: City Road Maintenance Bureau (Asphalt)

| Field | Value |
|-------|-------|
| Key | `asphaltMaintenance` |
| Product | Asphalt |
| Required | 40 asphalt |
| Reward | $900 |
| RP reward | 5 |
| Rep reward | 5 |
| Cooldown | 3 minutes (real-time) |
| Unlock | Refinery Level 5 (asphalt unlock) |
| Flavor | "Standing contract for municipal road repair crews." |

**Economic check:**
40 crude → $900 = $22.5 profit/crude. Above gasoline T3 ($22/crude) but by a small margin. Appropriate given the 3-minute cooldown constraint. Not dramatically more profitable than the best gasoline contract.

---

### Standing Order: Regional Air Charter Service (Jet Fuel)

| Field | Value |
|-------|-------|
| Key | `jetFuelCharter` |
| Product | Jet Fuel |
| Required | 60 jet fuel |
| Reward | $2,200 |
| RP reward | 15 |
| Rep reward | 10 |
| Cooldown | 5 minutes (real-time) |
| Unlock | Refinery Level 7 (jet fuel unlock) |
| Flavor | "Standing fuel supply agreement with a regional charter operator." |

**Economic check:**
60 crude → $2,200 = $36.7 profit/crude. Above asphalt standing order, reflecting jet fuel's premium position. Cooldown is longer (5 minutes vs. 3) to prevent jet fuel from trivially dominating asphalt.

---

## State Design

### New `GameState` field (proposed)

```
standingOrderCooldowns: Partial<Record<StandingOrderKey, number>>
```

Maps standing order key → game tick when the order next becomes available. Absent key = order is currently available.

**Default in sanitizer:** `{}` (all orders available from first unlock, before any fulfillment)

**Save migration:** Zero breaking. Existing saves load with all standing orders immediately available.

### New type (proposed)

```
type StandingOrderKey = 'asphaltMaintenance' | 'jetFuelCharter'
```

Extend when new standing orders are added.

---

## UI Behavior

### ContractsPanel — New Section

Below the existing tier-grouped one-time contracts, add a "Standing Orders" section (only visible if at least one standing order is unlocked).

Each standing order card:
- Same product badge as existing contract cards
- Same Requires/Reward rows
- Button state: 
  - "Fulfill Order" — when product is sufficient and cooldown is expired
  - "Need N more [product]" — when product is insufficient and cooldown is expired
  - "Restocking — Xm Ys" (disabled) — when cooldown is active

### AsphaltPanel and JetFuelPanel

No changes needed. The done state introduced in the Idle UI Pass remains. Players with fulfilled one-time contracts still see the compact done panel. The standing order in ContractsPanel motivates production without requiring the secondary panel to communicate the demand.

---

## What This Design Deliberately Excludes

- No expiring standing orders (order waits indefinitely if player doesn't fulfill)
- No multiple tiers of standing orders per product (one per product in first implementation)
- No reputation gate on standing orders (they are maintenance-tier, not premium)
- No auto-fulfillment (player always clicks to fulfill)
- No standing orders for gasoline (gasoline already has infinite demand via sell buttons)
- No dynamic pricing on standing orders (fixed reward, no fluctuation)

---

## Risks

### Cooldown too short → farming

If the cooldown is shorter than the time needed to produce the required amount, players can fulfill the standing order faster than intended. The proposed cooldowns (3 and 5 minutes) are conservative. The balance review during implementation should verify this against actual production rates at unlock level.

### Cooldown too long → ignored

If the cooldown is longer than the player's session, the order is never fulfilled more than once. The 3-minute asphalt cooldown is intentionally short enough to be fulfillable multiple times in a typical session.

### ContractsPanel vertical length

Adding a standing orders section increases the already-tall ContractsPanel. If the panel becomes too long, consider a collapsed-by-default section. For now, accept the additional height — it is consistent with the current single-scroll-page layout.

---

## Related Documents

- [PLAYTEST_NOTES.md](PLAYTEST_NOTES.md) — Multi-Product Economy Review (verdict B, top weakness: no repeatable demand)
- [TECH_DEBT.md](TECH_DEBT.md) — Active concern: secondary products have no repeatable demand
- [PLANT_MODULE_SYSTEM_DESIGN.md](PLANT_MODULE_SYSTEM_DESIGN.md) — Full module system design (future)
- [BACKLOG.md](BACKLOG.md) — Option B: Repeatable Secondary Product Demand Design (this document)
