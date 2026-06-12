# Refinery Process Chain — COMPLETE (2026-06-12)

Branch: `feature/refinery-process-chain`. All 7 tasks done (see WORK_PLAN.md).

## What shipped

Inserted a **feedstock** intermediate so the refinery is a real process chain:
- Tier 1 (crude-direct, unchanged): gasoline, asphalt — the simple tutorial loop.
- Tier 2 (needs feedstock): jet fuel, lubricants, petrochemicals.
- Distillation Units refine crude → feedstock (adjacency-boosted via the combo
  system). Downstream plants consume feedstock. Routing the shared feedstock
  stream + scaling distillation is the new mid/late-game depth.
- Unified the 3 duplicated plant tick blocks into one config-driven loop.
- Feedstock resource card + throughput + feedstock-starved hints + chain explainer.

## Verification
build ✓ / eslint ✓ / tsc ✓ / 13 unit assertions (throughput + save migration) ✓ /
dev server clean. Save-compatible (feedstock defaults 0).

## Recommended next
- Multi-cut chain (naphtha/distillate/residue + reformer/cracker) IF more refinery
  depth is wanted — biggest lever, but watch for bloat.
- Per-plant levels/throughput upgrades.
- Then mobile/Expo layout once gameplay feels locked.
- Cleanup: dead production fields on the old *_PLANT_BALANCE constants (TECH_DEBT).
