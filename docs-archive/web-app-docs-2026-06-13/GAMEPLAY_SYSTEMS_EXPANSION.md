# Gameplay Systems Expansion — Design & Implementation Notes

Four Kairosoft-style systems added on top of the existing economy. All are
save-compatible (old saves load with safe defaults) and reuse existing patterns
(derived-stats multipliers, panel components, log messages, sanitizeLoadedGameState).

---

## System 1 — Staff Training & Levels

**Problem solved:** Playtest notes repeatedly flagged workers as "passive /
invisible." Hiring was a one-time decision with no ongoing engagement.

**Design:** Each worker *type* shares a crew Level (1–5) and an XP bar.
- XP accrues passively every tick: `count × xpPerWorkerPerTick`. A bigger crew
  trains faster.
- Crossing the XP threshold levels the crew up (logged, capped at 5).
- Level multiplies that type's bonus effectiveness:
  `multiplier = 1 + (level − 1) × 0.15` → Level 5 = 1.6× effectiveness.
- Players can pay money + RP to instantly train a crew one level (skips the wait).

**Why type-level, not individual employees:** the existing bonus pipeline is
built on `workerCounts: Record<type, number>`. A per-type level multiplier slots
into that pipeline by scaling the effective headcount — no rewrite of the bonus
math, no per-employee identity bookkeeping. Keeps it simple per AGENTS.md.

**Integration:** `effectiveWorkers(type) = count × levelMultiplier`, fed into the
operator / mechanic / salesAgent / chemist / safetyOfficer / fuelSpecialist
bonus formulas. Storage and sell-price bonuses are `Math.round`ed to keep
integers.

---

## System 2 — Refinery Upgrade Perk Tree

**Problem solved:** Refinery level-ups just incremented a number. No choice, no
identity.

**Design:** Each refinery level-up grants 1 upgrade point. Spend points on perks
across three branches — Efficiency (production speed), Capacity (storage + crude
discount), Quality (sell price). Each branch has 3 tiers; tier N requires tier
N−1 in the same branch, so you commit to a direction rather than maxing all.

**Effects** (additive rates, see `PERK_EFFECTS`):
- Efficiency: +10% / +15% / +25% production speed
- Capacity: +10% / +15% (+5% crude discount) / +25% (+10% crude discount) storage
- Quality: +5% / +10% / +20% sell price

**Integration:** perk rates fold into `productionInterval`, `maxStorage`,
`sellPrice`. `perkCrudeDiscountRate` is exposed in DerivedStats for the buy flow.

---

## System 3 — Tech Eras

**Problem solved:** The research tree ends abruptly; no overarching long-term goal.

**Design:** Three eras — Foundation → Expansion → Modern. You advance when BOTH a
research-count and refinery-level threshold are met (Expansion: 4 research +
Lv7; Modern: 8 research + Lv13). Each era grants cumulative global bonuses and is
announced with a banner the first time it's reached.
- Expansion: +10% sell price, +15% RP
- Modern: +20% sell price, +30% RP

**Integration:** `getCurrentEra` is pure (derived from research + level), so no
new persistent state is strictly required — `highestEraIndex` is stored only to
fire the "new era" banner exactly once.

---

## System 4 — Annual Awards

**Problem solved:** No recurring hype/payoff moment. Kairosoft games lean on
annual ceremonies hard.

**Design:** A "business year" is 3,600 ticks (12 min). Per-year counters track
gasoline produced, money earned (sales + contracts + standing orders), and
contracts completed. At year end a weighted score is graded S/A/B/C, cash +
reputation are awarded, a ceremony modal pops, the result is recorded in a
rolling 12-entry history, and the counters reset.

**Scoring weights:** 1 pt/gasoline, 8 pts/$1,000 earned, 60 pts/contract.
Thresholds: S ≥ 1000, A ≥ 600, B ≥ 300, C otherwise.

**Integration:** evaluated in the staff/awards interval (same cadence as the
production tick, kept separate to avoid complicating production return paths).
`tickCount` always advances each tick (even when idle), so the year always
progresses.

---

## Save Compatibility

`sanitizeLoadedGameState` adds safe loaders for every new field:
- `workerLevels` default 1 (validated 1–5), `workerXp` default 0 (≥0)
- `upgradePoints` 0, `unlockedPerks` [] (unknown perk keys filtered out)
- `highestEraIndex` 0, `businessYear` ≥1, `yearStartTick` 0
- `yearStats` zeroed, `awardHistory` [] (validated records, capped 12)

Old saves with none of these fields load exactly as before with sensible defaults.

## Testing

- `systems.test.ts` — 30 assertions across all four systems (level multipliers,
  XP accrual & level-up, training cost, perk effects on derived stats, era
  thresholds & bonuses, award scoring/grading, year closeout & reset).
- `save2.test.ts` — 18 assertions: old-save migration, full round-trip,
  bogus-perk filtering, out-of-range clamping.
