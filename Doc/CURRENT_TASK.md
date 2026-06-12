# Rough Edges Audit — COMPLETE (2026-06-13)

Branch: `feature/rough-edges-audit` (off plant-balance-cleanup).
Scope: find + fix silent bugs and inconsistencies in code/balance via static
audit + headless playtest (no live browser needed — done overnight via mobile).

## Fixed

1. **Silent reputation penalty (real bug).** `closeBusinessYear` computed
   `couldNotAfford` (cash short of payroll → reputation docked) but never put
   it on `AwardRecord`. The `unpaidWarning` translation existed but was
   unreachable — players lost reputation every year-end with zero explanation.
   Fixed: `AwardRecord.couldNotAfford`, surfaced in `AwardCeremonyModal`, save
   migration defaults it `false` for old records.

2. **Distillation Unit upgrades did nothing for feedstock (chain inconsistency).**
   Leveling a Distillation Unit to L2 ($3,500)/L3 ($10,000) gave +25%/+50%
   gasoline speed but ZERO benefit to feedstock output — even though distillation
   is "the heart of the chain" per the process-chain design. Fixed:
   `feedstockPerDistillationCycle` now scales by the same
   `distillationUpgradeProductionMultiplier` gasoline already gets. Verified via
   unit test: Lv3 = Lv1 × 1.5.

3. **Cleanup:** removed 3 dead translation keys (`producedLubricants`,
   `producedJetFuelPlant`, `producedPetrochemicals`) left over from the
   plant-loop unification — superseded by `producedPlant`.

## Verified
build ✓ / eslint ✓ / tsc ✓ / 6 new audit assertions + 37 prior (chain/economy/
save) all pass.

## Flagged for a future cleanup batch (NOT touched — needs confirmation each is
truly dead before removing; lower value than the fixes above)

Possibly-orphaned translation keys found via static scan (defined, no
non-translation references): `ceremonyGrade`, `totalStaff`, `noStaff`,
`inProgress`, `xpProgress`, `productionRateValue`, `tierLabel`,
`completedContract`, `bannerTitle` (era-transition banner — written but no
banner UI exists; could be REMOVED or could be the seed of a nice "new era!"
toast similar to the awards ceremony), `asphaltSummary`.

Also: a 41-line orphaned `sections` block (lines ~49-90 of translations.ts,
containing `heroCopy` + summary/progression/systems descriptions) looks like
early UI-layout design notes never wired to any component. Flag for the
project owner to decide keep (docs) vs remove.

## Recommended next
- Decide on the orphan-translation batch above (quick cleanup once confirmed).
- `bannerTitle` could become a real "Entering the Expansion Era!" toast —
  nice payoff moment to pair with the Annual Awards ceremony.
- Otherwise: per-plant levels, save export/import, or mobile/Expo layout
  (see earlier ROADMAP entries).
