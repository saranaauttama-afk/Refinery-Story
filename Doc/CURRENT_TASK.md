# Rival Refineries / Annual Ranking — COMPLETE (2026-06-13)

Branch: `feature/rival-refineries` (off charm-pass). Background task.

## What shipped
- `data/rivals.ts`: 3 fictional rivals (Coastal Refining Co., Apex Petrochem,
  Highland Energy Group), each with a distinct personality (baseline,
  growth-per-year capped, variance).
- `getRivalResults(year)` + `getPlayerRank(score, rivals)` in
  gameCalculations.ts, calibrated against the STATIC AWARDS_BALANCE
  gradeThresholds (what getAwardGrade actually checks).
- AwardRecord gains `rivals: RivalResult[]` + `playerRank: number`, computed
  once in closeBusinessYear (stable across reloads).
- AwardCeremonyModal shows an "Industry Ranking" table (rank/name/grade/score,
  player row highlighted) + "Ranked #X of 4".
- Save migration: old records default `rivals: []` (ranking hidden), `playerRank: 1`.

## Verification
build/lint/tsc clean. 22 new assertions + 79 prior = 101 total pass.

## Found along the way (not fixed, see TECH_DEBT.md)
`AWARDS_BALANCE.thresholdGrowthPerYear` is dead config — getAwardGrade never
applies it. Deliberate balance decision for later.

## Recommended next (from BACKLOG "Next Session")
- #4: Hidden/discoverable combos (3-5 new adjacency combos, one-time
  discovery bonus + popup, `discoveredCombos: string[]`).
- #2: Scoped-down star employees (~5% chance on hire, permanent small perk +
  star marker in roster).
