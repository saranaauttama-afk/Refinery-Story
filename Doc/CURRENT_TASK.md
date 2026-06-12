# Charm Pass — COMPLETE (2026-06-13)

Branch: `feature/charm-pass` (off docs-cleanup). All 4 items done (see
WORK_PLAN.md), each independently committed.

## What shipped

1. **Era banner toast** — auto-dismissing celebration banner on entering a new
   Tech Era (Expansion/Modern). Activates the previously-dead
   `eras.bannerTitle` translation.
2. **Refinery name + title progression** — editable name in the hero panel
   (default "Sunrise Refinery") + a level-based company title (Local Refinery
   -> Regional Supplier -> National Producer -> Industry Leader, thresholds at
   Lv5/10/15).
3. **Named staff roster** — hired workers get a flavor name from a 30-name
   pool; StaffPanel shows "Team: A, B, C +N more". Old saves backfill names.
4. **Feedstock-themed random events** — Distillation Hiccup (small feedstock
   loss) and Feedstock Surplus (feedstock -> cash), gated on having built
   distillation.

## Verification
build/lint/tsc clean. 33 new unit assertions + 46 prior = 79 total pass.

## Recommended next
- PLAYTEST_NOTES.md archive/trim pass (now ~1,150 lines).
- Multi-cut process chain (more refinery depth) — biggest lever, watch bloat.
- Per-plant levels, save export/import.
- Mobile/Expo UX phase (deferred, confirmed not excluded — see
  DONT_BUILD_YET.md).
