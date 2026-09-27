# Refinery Story — Game Design (Current State)

> This file describes the game AS IT EXISTS TODAY. It is rewritten whenever a
> major system lands, so AGENTS.md's "read this before changes" instruction
> gives an accurate picture. Historical/superseded design proposals live in
> `Doc/archive/`.

## Genre

Management simulation, Kairosoft-style (Game Dev Story, Dungeon Village).
Easy to learn, satisfying to optimize, fun over realism, short sessions.

## Core Loop

Buy Crude → Refine (Gasoline directly, or Distill → Feedstock → advanced
products) → Sell / Fulfill Contracts & Standing Orders → Earn Money + RP +
Reputation → Level Up Refinery (+1 Upgrade Point) → Hire/Train Staff → Spend
Upgrade Points on Perks → Repeat, with Annual Awards every ~12 minutes as a
recurring checkpoint.

## Resources

- **Money** — buildings, upgrades, expansion, hiring, training, crude.
- **Crude Oil** — input resource, bought in batches (shipments).
- **Feedstock** — intermediate. Distillation Units convert crude → feedstock
  (boosted by crude↔distillation adjacency and by Distillation Unit level
  upgrades). Advanced plants (jet fuel, lubricants, petrochemicals) consume it.
- **Gasoline** — Tier 1 product, crude-direct (no feedstock needed). The
  simple tutorial loop.
- **Asphalt / Jet Fuel / Lubricants / Petrochemicals** — secondary products.
  Asphalt is manually produced from crude (no direct sell, standing orders
  only). The other three are plant-produced from feedstock and sold directly
  or via standing orders.
- **Research Points (RP)** — unlock research items; chemists boost the rate.
- **Reputation** — unlocks reward-bonus tiers on contracts; annual awards add
  to it; an unpaid-payroll year can dock it.

## The Process Chain

- **Tier 1 (crude-direct):** Gasoline, Asphalt.
- **Tier 2 (feedstock-gated):** Jet Fuel, Lubricants, Petrochemicals.
- Distillation Units are the heart of the chain: they produce gasoline-speed
  bonuses AND feedstock, both scaled by unit count, crude-adjacency, and level
  upgrades (Lv2/Lv3). Feedstock is a shared, limited stream the three advanced
  plants compete for — routing it (and how much distillation you build) is the
  mid/late-game strategic layer.

## Buildings (9)

crudeTank, distillationUnit, productTank — core (Lv1+)
laboratory (Lv4+), maintenanceWorkshop (Lv6+), salesOffice (Lv7+) — support
lubricantPlant (Lv5+), jetFuelPlant (Lv10+), petrochemicalPlant (Lv15+) — advanced product plants

crudeTank, productTank, and distillationUnit can be upgraded Lv1→Lv2→Lv3
(storage / gasoline speed + feedstock output respectively).

## Combo System (grid adjacency)

Three pair types, counted across the whole grid:
- **crude↔distillation:** + gasoline production speed, + feedstock output
- **distillation↔product tank:** + sell price multiplier
- **crude↔product tank:** + storage multiplier

## Progression Content

- **Contracts:** ~37, across all 5 product lines, tiered by refinery level.
- **Standing Orders (4):** Asphalt Maintenance (Lv5), Lubricant Supply (Lv6),
  Jet Fuel Charter (Lv10), Petrochem Export (Lv15) — repeatable demand with
  cooldowns, priced as a premium over direct selling.
- **Research (10 items):** production speed, storage, sell price, RP rate.
- **Milestones (16):** money/level/workforce/product/contract goals with
  money + RP + reputation rewards.
- **Reputation tiers (4):** starter → small bonus → trusted supplier →
  industry leader, each raising contract reward multipliers.
- **Shipments (4 sizes):** mini delivery → imported ship, cost-per-unit
  discount at larger sizes, with ETA + logistics-coordinator speed bonus.

## Staff (9 worker types, Crew Levels 1–5)

operator, mechanic, salesAgent, safetyOfficer, chemist, logisticsCoordinator,
fuelSpecialist, aviationSpecialist, chemicalEngineer.

Each TYPE shares a crew level (passive XP from headcount, or pay money+RP to
train instantly). Level 1→5 scales that type's bonus ×1.0→×1.6. Wages scale
with headcount × level and are deducted at year-end (see Annual Awards) —
over-hiring has a real cost.

## Refinery Upgrade Perk Tree (9 perks, 3 branches × 3 tiers)

Refinery level-ups grant 1 upgrade point. Branches — Efficiency (production
speed), Capacity (storage + crude discount), Quality (sell price) — are
directional: each tier requires the previous tier in the same branch, so a
playthrough specializes rather than maxing everything.

## Tech Eras (3)

Foundation → Expansion (4 research + Lv7) → Modern (8 research + Lv13). Each
era grants cumulative +sell price and +RP-rate bonuses, announced once via the
activity log when reached.

## Annual Awards

A ~12-minute "business year" tracks gasoline produced, money earned, and
contracts completed. At year end: payroll is deducted (net profit drives the
score), a grade S/A/B/C is awarded with cash + reputation, shown in a ceremony
modal, and recorded in a rolling 12-year history. If cash can't cover payroll,
a small reputation penalty applies (shown in the ceremony).

## Design Principles

- Always have a short-, medium-, and long-term goal visible.
- Reward optimization (layout, routing, specialization) over grinding.
- Few mechanics that multiply (Kairosoft style) — avoid parallel silos.
- Progressive disclosure: the early game (Tier 1, 9-cell grid) stays simple;
  the chain and meta systems reveal themselves mid-game.
- Fun over realism. Save-compatible across all changes.
