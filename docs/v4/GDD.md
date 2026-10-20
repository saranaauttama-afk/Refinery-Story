# Refinery Story v4 — Game Design Document

Source of truth for the v4 rewrite. Everything from V1–V3 is retired; only the
refinery theme survives. Numbers here are starting values for playtesting and
are mirrored 1:1 in `src/v4/data/balance.ts`.

Reference data (Kairosoft fan wiki): Hot Springs Story combos/structures,
Mega Mall Story combos/structures/investments, Game Dev Story
employees/training/genres-and-types. Links at the end.

---

## 1. Pillars & core loop

The game is: **arrange the refinery yard to trigger combos, then blend products
up to S grade**, with something new unlocking every 2–3 in-game months.

| Pillar | Borrowed from |
| --- | --- |
| Layout as a puzzle — buildings near each other trigger combos | Hot Springs Story, Mega Mall Story |
| Blend and gamble on grade — Base × Additive → S…F | Game Dev Story (genre × type) |
| Something new often — rank-ups unlock things, year-end awards | All Kairosoft games |
| A living yard — trucks in/out, workers walking, money pop-ups | All Kairosoft games |

**Three loop layers**

- **30 s:** crude truck arrives → units process → Blending Station mixes →
  customer truck collects → `$` + Fame + Research Data (RD).
- **5 min:** move buildings to find combos, upgrade, hire/train staff, take
  contracts.
- **1 in-game year (~12 min):** year-end awards → rank up → unlock land, units,
  new customer groups.

**Currencies:** `$` (build, hire), `RD` (staff level-ups, recipes), `Fame`
(rank; never spent).

**Time:** 1 week = 15 s at 1× speed. 4 weeks = 1 month, 12 months = 1 year
(12 min). Final evaluation at Year 15 (~3 h), play continues after.

---

## 2. Yard & combos

- The **Truck Gate must sit on the yard edge**; trucks drive in on a public road
  from outside the fence.
- Yard starts **16×16**; buy land in **8×8 parcels** up to **40×40**.
- Footprints 1×1 to 3×3. Moving a building costs **$2k** (cheap on purpose so
  players experiment with layout).
- **Building categories:** Process (CDU, Reformer, Cracker, Hydrotreater),
  Blending Station, Storage (tanks), Logistics (truck gate, loading bay, pipe
  rack), Support/Deco (Lab, Control Room, Canteen, Flare, trees, lamps, sign).

**Combo rules**

- **Pair:** two specific building types within **2 tiles** of each other
  (Chebyshev distance ≤ 2, diagonals count — Hot Springs rule). Some pairs are
  **negative**.
- **Set:** three specific building types placed **adjacent in a row**
  (Mega Mall rule). Stronger than pairs.
- **30 combos total:** 22 can be bought as hints in a Recipe Book, **8 are
  hidden** until placed. Discovery → "New Combo!" pop-up + **Fame +20**.

**Support/Deco aura falloff** (Hot Springs scenery grid, E = emitter):

```
10%   12.5%  25%  12.5%  10%
12.5% 50%   100%  50%    12.5%
25%   100%   E    100%   25%
12.5% 50%   100%  50%    12.5%
10%   12.5%  25%  12.5%  10%
```

**Combo list (first 10; fill the rest to 30 in `data/combos.ts`)**

| Combo | Kind | Buildings | Effect |
| --- | --- | --- | --- |
| Tank Farm | Set | Tank + Tank + Pipe Rack | Tank capacity +25% |
| Fresh Cut | Pair | CDU + Hydrotreater | Purity +10 |
| Octane Line | Set | Reformer + Blending + Lab | Gasoline grade score +15 |
| Quick Load | Pair | Loading Bay + Truck Gate | Truck dwell −30% |
| Watchful Eye | Pair | Control Room + any Process unit | Incident chance −50% |
| Green Belt | Set | Tree × 3 | Eco +10, Fame +10/month |
| Lunch Break | Pair | Canteen + Control Room | Staff power regen +20% |
| Smoke Break | Pair | Flare + Canteen | Staff power regen −30% (negative) |
| Heavy Duty | Set | Cracker + Hydrotreater + Tank | Yield +20% |
| Showcase | Set | Lab + Lamp + Company Sign | Fame +40/year (hidden) |

---

## 3. Production & blending

Every lot is made by choosing **Base × Additive** at a Blending Station. Grade
comes from the pair's compatibility plus the lot's stats (Game Dev Story's
genre × type).

**Flow:** Crude (Light Sweet / Heavy Sour / Shale) → CDU splits into cuts
(Naphtha, Kerosene, Gasoil, Residue) → conversion units → **8 Bases**: LPG,
Gasoline, Jet, Diesel, Lube, Asphalt, Wax, Pellet.

**Additives:** 20 types (Octane Booster, Anti-freeze, Detergent, Bio-blend, Dye,
Fragrance, …). Each unlocks when a staff member of a given job and level does a
given training (GDS type unlock). Example: Chemist Lv2 does *Lab Study* →
Octane Booster.

**Compatibility:** 6 grades S / A / B / C (neutral) / D / F, stored as a
Base × Additive matrix. Examples: Gasoline × Octane Booster = S,
Jet × Anti-freeze = S, Diesel × Fragrance = F, Wax × Fragrance = A.

**Lot stats (4):** Purity, Yield, Stability, Eco. Staff assigned to the units
along the chain add to these while the lot is produced (GDS fun/graphics
points).

**Familiarity:** each Base and Additive levels 1–10 with use, +3% quality per
level. Untried pairs show **"First Try"**; trying one gives **Fame +10**.

```
Score = (Purity + Yield + Stability + Eco)
        × M_pair × (1 + 0.03 × familiarityLevel) × (1 + comboBonus)
M_pair: S 1.5, A 1.25, B 1.1, C 1.0, D 0.85, F 0.6
```

| Grade | Score at rank 1 | Price × |
| --- | --- | --- |
| SS | ≥ 400 | 2.7 |
| S | 300–399 | 1.9 |
| A | 200–299 | 1.35 |
| B | 120–199 | 1.0 |
| C | < 120 | 0.8 |

**Pickier buyers:** thresholds are multiplied by `GRADE_SCALE[rank]` =
1, 1.1, 1.2, 1.3, 1.45, 2.4, 4.5, 8, 12, 16 (ranks 1–10). Scores grow fast once
staff and combos stack, so without this SS was reached in year 2 and grade stopped
mattering (playtest v4.0.11). SS stays reachable at every rank but has to be
chased. The Blend sheet shows the current SS line.

**Stations:** each Blending Station runs its own Base × Additive recipe (a new
station starts on the last recipe picked). Every base a station is mixing is
refined from its own cut, so a second product line uses cuts that would
otherwise sit idle. Product tanks stay one shared pool; lots keep their own
grade. Each extra kind of product in the tanks draws more buyers (arrival ×
(1 + 0.8 per extra product), up to 3 products).

---

## 4. Customers, contracts & investments

Customers come to you by truck or ship. New customer groups appear only after
investing in the matching investment chain (Mega Mall). Each customer has a
favourite product and a minimum grade; satisfied repeat buyers give gifts.

- **~40 customers in 5 groups:** Gas stations (Gasoline/Diesel/LPG), Airlines
  (Jet), Shipping (Diesel/Lube), Industrial park (Pellet/Wax), Government
  (Asphalt).
- **Hearts ♥:** +1 per satisfied purchase. At 10 ♥ the customer gives a gift
  (building blueprint, deco, or Additive).
- **Clearance:** when tanks are ≥ 80% full, a buyer takes the worst lot of its
  product even below its minimum grade, at 50% price, with no heart or Fame, so
  unsellable lots never stall the refinery.
- **Contracts:** 2–3 offers at the start of each month, e.g. "30 units of Jet,
  grade ≥ A, within 6 weeks". Success: `$` = 1.5 × market price, Fame +15.
  Failure: Fame −10. Max 3 active.

**Investment chains** (each step requires the previous one; $20k → $5M)

| Chain | First → last step | Unlocks |
| --- | --- | --- |
| Highway | Rest Stop $20k → Logistics Hub $3M | Gas stations, more truck bays |
| Port | Jetty $80k → Deep-sea Terminal $5M | Shipping, export (price ×1.3) |
| Industrial Park | Land Prep $50k → Petrochem Zone $4M | Industrial park, Pellet/Wax bases |
| Airport | Fuel Depot $150k → Hub Airport $4.5M | Airlines, S-grade Jet sells ×2 |

Each chain also has a **Stimulus** step (reduces oil-price-crash impact) and a
**Shelter** step (reduces storm impact), like Mega Mall's walkway/stimulus.

**Market:** crude price cycles over ~2–3 in-game years. Boom: sell price +30%.
Bust: −30%. Players get a 1-month warning.

---

## 5. Staff

Same skeleton as Game Dev Story: 4 stats, jobs, level-ups cost RD and multiply
salary ×1.2 per level; training costs money and power with diminishing
returns.

**Stats → lot stats:** Operation → Yield, Chemistry → Purity,
Mechanics → Stability (+ fewer breakdowns), Safety → Eco (+ fewer incidents).

**Jobs (6):** Operator, Chemist, Engineer, Safety Officer, Manager, Plant
Director (secret: unlocks when someone reaches Manager Lv5 + Chemist Lv5). Each
job has levels 1–5. Change job with a *Career Manual* from the travelling
merchant ($200k).

- Hire cap: 3 at rank 1, +1 per rank, max 12.
- Power 8–30 per person; spent by work and training, refills after shift.
- Fired staff keep their stats and can be re-hired later.

| Hiring method | Cost | Unlocks |
| --- | --- | --- |
| Word of mouth | $5k | Start |
| Job board | $20k | Start |
| University | $80k | Rank 3 |
| Job Fair | $250k | Rank 5 |
| Headhunter | $600k | Rank 7 |

| Training | Cost | Power | Op | Chem | Mech | Safe | Unlocks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read manual | $3k | 2 | +2 | +3 | | | Start |
| Yard walk | $3k | 2 | +3 | | | +3 | Start |
| Hands-on repair | $6k | 3 | | | +5 | +1 | Start |
| Lab Study | $12k | 4 | | +6 | | −2 | Rank 2 |
| Fire drill | $15k | 4 | +1 | | | +6 | Rank 3 |
| Plant tour | $60k | 6 | +5 | +4 | +4 | +3 | Rank 5 |
| Overseas course | $200k | 9 | +7 | +7 | +5 | +5 | Rank 7 |

`gain = base × max(0, 1 − n/12)` where n = times this person already did this
training. Every training has a **5% "Super Up!"** chance: base × 3, even when
normal gain is 0.

---

## 6. Progression

Rank comes from cumulative Fame (only drops on failed contracts or incidents).
Every rank unlocks ≥ 3 things. Pacing target: **≥ 5 unlocks in the first 10
real minutes**, then something new every 2–3 in-game months.

| Rank | Fame | Unlocks | Target year |
| --- | --- | --- | --- |
| 1 | 0 | CDU, Tank, Truck Gate, Blending, Bases Gasoline/Diesel | 1 |
| 2 | 150 | Hydrotreater, Lab, 2nd land parcel, Lab Study training | 1 |
| 3 | 1,000 | Reformer, University hiring, Highway chain | 2 |
| 4 | 1,900 | Cracker, Bases LPG/Jet, Airport chain | 3 |
| 5 | 3,000 | Control Room, Job Fair, Port chain | 4 |
| 6 | 6,000 | Bases Lube/Asphalt, 4th parcel | 5–6 |
| 7 | 11,000 | Headhunter, Industrial Park chain, Bases Wax/Pellet | 7 |
| 8 | 20,000 | Plant Director, full 40×40 yard | 9 |
| 9 | 33,000 | Special building "Mega Refinery Tower" | 11–12 |
| 10 | 47,000 | Special ending, secret mascot applies for a job | 14–15 |

**Year-end awards** (last week of month 12): Best Product (highest-grade lot of
the year), Safety (zero incidents), Eco, Refinery of the Year (total score).
Each win = Fame +100…+500 plus a unique deco. Compared against 4 AI rivals that
improve every year.

**Random events** (1–2 per month): government inspector (bonus if Safety is
high), storm (units stop 1 week), travelling merchant, celebrity visit (Fame),
oil spill (money + Fame loss if Safety is low).

**Year 15 ending:** one total score to beat next time; play continues. New
Game+ carries over one of each unlocked building (Hot Springs).

---

## 7. Balance numbers

Ratios follow the Kairosoft data: cheapest→most expensive building ≈ ×200,
monthly upkeep ≈ 3% of build cost, price-side combo bonus +10–25%.

| Constant | Value | Note |
| --- | --- | --- |
| Starting money | $55k | Guided first layout costs $50k; one Operator foreman starts on staff |
| 1 week | 15 s | 1 year = 12 min |
| Early building cost | $5k–$25k | Tank $5k, CDU $20k |
| Mid building cost | $80k–$400k | Reformer $120k, Cracker $300k |
| Late building cost | $1M–$3M | Mega Tower $3M |
| Upkeep / month | 3% of build cost | |
| Max building level | 5 | |
| Upgrade cost | buildCost × 0.6 × 1.5^(lv−1) | Lv2 = 0.6×, Lv5 ≈ 3× |
| Output per building level | +25% | |
| Base price, grade B, per unit | $26 (Gasoline) – $110 (Lube) | see `BASE_PRICES` |
| Pair combo | +5–15 stat or +10–20% | |
| Set combo | +15–30 stat or +20–30% | |
| Fame per sale | 1 (B), 2 (A), 5 (S), 10 (SS) | C gives 0 |
| RD per sale | 1 per 10 units sold | |
| Staff level-up | 20 RD × target level | Lv5 = 100 RD |
| Staff starting salary | $1k–$8k / month | ×1.2 per level |
| Super Up! chance | 5% | ×3 |
| Move building | $2k | |

**Income targets:** Year 1 profit ≈ $30–60k/month, Year 5 ≈ $500k/month,
Year 10 ≈ $3M/month. If reality is off, tune Base prices first.

---

## Sources

- https://kairosoft.wiki.gg/wiki/Combos_(Hot_Springs_Story)
- https://kairosoft.wiki.gg/wiki/Structures_(Hot_Springs_Story)
- https://kairosoft.wiki.gg/wiki/Combos_(Mega_Mall_Story)
- https://kairosoft.wiki.gg/wiki/Structures_(Mega_Mall_Story)
- https://kairosoft.wiki.gg/wiki/Investments_(Mega_Mall_Story)
- https://kairosoft.wiki.gg/wiki/Employees_(Game_Dev_Story)
- https://kairosoft.wiki.gg/wiki/Training_(Game_Dev_Story)
- https://kairosoft.wiki.gg/wiki/Genres_and_types_(Game_Dev_Story)
