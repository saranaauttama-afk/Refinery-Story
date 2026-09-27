# Gameplay V3-00 baseline

Captured: 2026-09-25 on `bef64d1`. Constructed fixtures use the real `tick()`
and `calculateDerivedStats()` paths. They are not a legal-playthrough or fun test.

Command:

```bash
node --import tsx scripts/gameplay-integrity-check.ts
```

| Area | Current baseline | Required R0 invariant |
| --- | --- | --- |
| Advanced line without generator | Lube5 produced; feedstock20→14; power0→−3 | Site supply is explicit; every pool stays nonnegative |
| One dry generator | Lube0; feedstock20→14 | Zero output consumes zero feedstock/power |
| Power Plant levels1/2/3 | Capacity60/60/60 | Capacity and generation rise by level |
| All five product tank levels1/2/3 | Each product capacity unchanged by level | Every tank's contribution rises by level |
| Per-cell staff eligibility | Jet/Petro/Polymer only | Keep this truthful in R0; Distillation/Lube Operator work starts V3-06 |
| UI upgrade list | Excludes Power Plant and five product tanks | Same capability source drives action and Info UI |
| Power readout | Uses counts and excludes gasoline draw while gasoline is gated after first generator | Gasoline independent; report site+generator supply in matching5s units |

The old `sim-check.ts` may still pass despite these failures. It is a pacing
stress test with privileged policy decisions, not an integrity or UI reachability
test. V3-01/V3-02 must promote the desired column into hard assertions via
`--require-fixed`; expected baseline failures must not be hidden or deleted.

## R0 resolution

The baseline above remains historical evidence. The repaired invariants are now
enforced by `node --import tsx scripts/gameplay-integrity-check.ts --require-fixed`.
V3-01 made partial work atomic and allocation fair. V3-02 added permanent site
power, level-based generators and storage, a shared upgrade capability used by
the action and UI, and truthful Gasoline/power messaging. The full-loop, balance,
camera, and map checks pass after the repair.
