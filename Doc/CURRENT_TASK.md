# Staff Cleanup & Economy Pass — COMPLETE (2026-06-12)

Branch: `feature/staff-cleanup-and-economy` (on top of gameplay-systems-expansion).
Full task breakdown + checkboxes in WORK_PLAN.md (all 7 done).

## What shipped

1. Removed redundant WorkforcePanel; shared `utils/workerBonusText.ts`.
2. Consolidated JetFuel/Lubricants/Petrochemicals → config-driven `ProductPanel`
   + `data/products.ts`. Asphalt kept separate (manual produce, no direct sell).
3. Sales Agent flat +$3 → +4%/worker; unified `productSellMultiplier`
   (salesAgent% + quality perks% + era%) across ALL products.
4. Wages/Payroll tied to Annual Awards — payroll deducted at year-end, award
   grade uses NET (revenue − payroll). The missing hiring tension.
5. WorkerPresenceBar shows crew level badges.
6. Balance pass: production floor 250→180ms; verified stacked multipliers healthy
   (sell ~2.5x over game, product mult ≤~1.9x, payroll as a real sink).

## Verification

build ✓ / eslint ✓ / tsc ✓ / 40 unit assertions (economy + save migration) ✓.

## Recommended next

- Perk differentiation (Efficiency branch overlaps operators at the production
  floor — repurpose to yield-per-batch).
- Then mobile/Expo layout pass when gameplay feels locked.
- Optional: save export/import, rival/competitive flavor for Awards.
