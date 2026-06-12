# WORK PLAN — Staff Cleanup & Economy Pass

Branch: `feature/staff-cleanup-and-economy`
Started: 2026-06-12. Built on top of `feature/gameplay-systems-expansion` (which
itself sits on `feature/demand-goals-pass`).

This note exists so the work can resume in a fresh session if the chat is cut off.
Each task has a checkbox. When resuming: `git log --oneline` to see what landed,
then continue the first unchecked item.

---

## Scope (the agreed package)

A focused "make it clean" pass — NOT new big systems. Four jobs + a balance pass.

### Task 1 — Remove redundant WorkforcePanel, dedupe bonus text  [ ]
- WorkforcePanel duplicated StaffPanel's worker list. Removed it.
- `getWorkerActiveBonus` was copy-pasted in StaffPanel + WorkforcePanel.
  Moved to a single shared helper in `utils/workerBonusText.ts`.
- StaffPanel is now the one place workers live (hire + level + XP + bonus).

### Task 2 — Consolidate 4 product panels into one ProductPanel  [ ]
- AsphaltPanel / JetFuelPanel / LubricantsPanel / PetrochemicalsPanel were
  ~95% identical. Replaced with a single config-driven `ProductPanel`.
- Product config lives in `data/products.ts` (key, unlock level, base price,
  plant building, sell handler wiring).
- Old panels deleted.

### Task 3 — Convert Sales Agent flat bonus → percentage  [ ]
- `salesAgentSellPriceBonus: 3` (flat) was the long-flagged problem: +$3 on a
  $150 product is meaningless; on gasoline it's huge.
- Replaced with `salesAgentSellPriceBonusRate` (%) applied as a multiplier.
- Unified all product selling through one `productSellMultiplier`
  (salesAgent% + quality perks% + era%), so perks/era now lift EVERY product,
  not just gasoline. Fixes a real inconsistency.

### Task 4 — Wages / Payroll tied to Annual Awards  [ ]
- Each worker type has a wage. Payroll = Σ count × wage × levelFactor
  (leveled crews cost more — ties the systems together).
- Deducted at year-end inside `closeBusinessYear`. The Awards score's money
  component uses NET (revenue − payroll), so over-hiring directly lowers your
  grade — the missing "hiring tension" the playtests kept flagging.
- Awards panel shows live projected payroll + net. Ceremony shows the breakdown.
- If cash can't cover payroll: pay what you can, small reputation hit.

### Task 5 — WorkerPresenceBar reflects crew level  [ ]
- Token bar now shows level pips/stars so the decorative crew ties to System 1.

### Task 6 — Combined Balance Pass  [ ]
- Reviewed the stacked multiplier curve (crew level × perks × era × research ×
  combos). Adjusted constants so late-game doesn't explode. See PLAYTEST_NOTES
  2026-06-12 "Economy Pass" entry for the numbers and reasoning.

### Task 7 — Docs + verify + push  [ ]
- Update ROADMAP / BACKLOG / TECH_DEBT / PLAYTEST_NOTES / CURRENT_TASK.
- build ✓ / eslint ✓ / tsc ✓ / unit tests ✓
- Commit + push.

---

## Deferred (noted, NOT in this pass)

- Perk differentiation (make perks unlock new *capability* instead of % that
  overlaps workers). Discussed but out of scope here — revisit after this lands.
- Mobile / Expo layout. Explicitly later.
- Save export/import. Nice QoL, low effort, future.
- Rival company / competitive ranking flavor for Awards. Future juice.

## Test commands

```
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run build
npx tsx /tmp/*.test.ts   # logic + save-migration suites (recreate if container reset)
```
