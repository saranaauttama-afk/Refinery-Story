# Demand & Goals Pass 1.0 — Late-Game Progression + Repeatable Demand

## Goal

Fill the Level 10–15 "empty gap" with meaningful goals and give every secondary
product a repeatable income path, so the late game keeps the short/medium/long
goal rhythm that makes Kairosoft games fun.

Sources: BACKLOG Option C (Endgame Progression) + Option D (Contract Expansion),
plus playtest concern #3 from the 2026-06-11 v0.7 notes.

## Rules

1. Preserve save compatibility.
2. Reuse existing standing order and milestone patterns.
3. No new architecture. Numeric constants + pattern repetition only.

## Requirements

### A. Bug Fix — Secondary inventory wiped on load

`sanitizeLoadedGameState` reset asphalt/jetFuel/lubricants/petrochemicals to 0
on every load (Phase A leftover). Load them safely with a 0 default instead.

### B. Bug Fix — Jet Fuel Charter is a trap after the v0.7 rework

- unlockLevel 7 → 10 (jet fuel cannot be produced before Level 10 now)
- reward $2,200 → $7,000 (direct sell of 60 jet fuel is $5,400 base; the old
  reward was strictly worse than selling)
- rpReward 15 → 20, reputationReward 10 → 15

### C. New Standing Order — Lubricant Supply

60 lubricants / $3,800 / 12 RP / +8 Rep / 4 min cooldown / unlock Level 6.
Gives lubricants repeatable demand after contracts 21–23 are done.

### D. New Standing Order — Petrochem Export

40 petrochemicals / $8,500 / 35 RP / +30 Rep / 5 min cooldown / unlock Level 15.
Gives petrochemicals repeatable demand after contracts 24–26 are done.

### E. Four Late-Game Milestones (Level 10–15 gap)

| Key | Requirement | Reward |
|-----|-------------|--------|
| jetFuelPioneer | Build a Jet Fuel Plant | $2,500, +25 Rep |
| aviationPartner | Complete a jet fuel contract | $4,000, 30 RP |
| petrochemicalPioneer | Build a Petrochemical Plant | $5,000, +50 Rep |
| productMogul | Complete a contract for every product line | $10,000, +75 Rep |

### F. ContractsPanel

Generalize standing order inventory lookup and shortfall text so any ProductKey
works (was hardcoded to asphalt/jetFuel).

## Success Criteria

- Existing saves load, including secondary product stock (no longer wiped).
- Jet Fuel Charter appears at Level 10 and pays better than direct selling.
- Lubricant Supply appears at Level 6, Petrochem Export at Level 15.
- 16 milestones display; the 4 new ones complete and reward correctly.
- Build, lint, and typecheck pass.

## Status — COMPLETE (2026-06-12)

All requirements implemented. Build, eslint, and tsc all pass.
See PLAYTEST_NOTES.md 2026-06-12 entry for balance reasoning.
